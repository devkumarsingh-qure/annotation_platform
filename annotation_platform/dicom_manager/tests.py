from io import BytesIO
from unittest.mock import patch

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from django.test.utils import override_settings
from pydicom.dataset import Dataset, FileDataset, FileMetaDataset
from pydicom.uid import ExplicitVRLittleEndian, SegmentationStorage, generate_uid
from rest_framework.test import APIClient

from annotation_platform.models import Project, Workspace
from authentication.models.user import User
from dicom_manager.models import Patient, SegmentationMask, Series, Study


class SegmentationMaskApiTests(TestCase):
    def setUp(self):
        self.workspace = Workspace.objects.create(name="Clinical workspace")
        self.user = User.objects.create_user(
            username="reader",
            password="test-password",
            workspace=self.workspace,
        )
        self.patient = Patient.objects.create(
            workspace=self.workspace,
            PatientID="P001",
        )
        self.study = Study.objects.create(
            patient=self.patient,
            StudyInstanceUID="1.2.3",
        )
        self.series = Series.objects.create(
            study=self.study,
            SeriesInstanceUID="1.2.3.4",
            Modality="CT",
        )
        self.project = Project.objects.create(
            workspace=self.workspace,
            name="Lung masks",
        )
        self.project.members.add(self.user)
        self.project.patients.add(self.patient)
        self.client = APIClient()
        self.client.force_authenticate(self.user)

    @property
    def collection_url(self):
        return (
            f"/patients/{self.patient.id}/studies/{self.study.id}/"
            f"series/{self.series.id}/segmentations/"
            f"?project_id={self.project.id}"
        )

    def detail_url(self, mask_id):
        return (
            f"/patients/{self.patient.id}/studies/{self.study.id}/"
            f"series/{self.series.id}/segmentations/{mask_id}/"
            f"?project_id={self.project.id}"
        )

    def dicom_seg_file(
        self,
        *,
        study_instance_uid=None,
        referenced_series_instance_uid=None,
        modality="SEG",
        sop_class_uid=SegmentationStorage,
        label="Lung lesion",
    ):
        sop_instance_uid = generate_uid()
        file_meta = FileMetaDataset()
        file_meta.MediaStorageSOPClassUID = sop_class_uid
        file_meta.MediaStorageSOPInstanceUID = sop_instance_uid
        file_meta.TransferSyntaxUID = ExplicitVRLittleEndian

        dataset = FileDataset(
            None,
            {},
            file_meta=file_meta,
            preamble=b"\0" * 128,
        )
        dataset.SOPClassUID = sop_class_uid
        dataset.SOPInstanceUID = sop_instance_uid
        dataset.StudyInstanceUID = (
            study_instance_uid or self.study.StudyInstanceUID
        )
        dataset.SeriesInstanceUID = generate_uid()
        dataset.Modality = modality
        dataset.ContentDescription = label
        dataset.NumberOfFrames = 1
        dataset.Rows = 2
        dataset.Columns = 2
        dataset.SegmentationType = "BINARY"
        dataset.BitsAllocated = 1
        dataset.BitsStored = 1
        dataset.HighBit = 0
        dataset.PixelRepresentation = 0
        dataset.PixelData = b"\0\0"

        referenced_series = Dataset()
        referenced_series.SeriesInstanceUID = (
            referenced_series_instance_uid or self.series.SeriesInstanceUID
        )
        dataset.ReferencedSeriesSequence = [referenced_series]

        output = BytesIO()
        dataset.save_as(output, enforce_file_format=True)
        return SimpleUploadedFile(
            "lung-lesion.dcm",
            output.getvalue(),
            content_type="application/dicom",
        )

    def upload_payload(self, **file_options):
        return {
            "file": self.dicom_seg_file(**file_options),
        }

    def create_mask(self, label="Lung lesion"):
        return SegmentationMask.objects.create(
            user=self.user,
            project=self.project,
            series=self.series,
            label=label,
        )

    @patch(
        "dicom_manager.models.segmentation_mask.get_presigned_url",
        return_value="https://storage.example/segmentation",
    )
    @patch("dicom_manager.views.segmentations.upload_file")
    def test_uploads_dicom_seg_through_backend_and_lists_mask(
        self,
        upload_file,
        get_presigned_url,
    ):
        response = self.client.post(
            self.collection_url,
            self.upload_payload(),
            format="multipart",
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["label"], "Lung lesion")
        upload_file.assert_called_once()
        self.assertTrue(upload_file.call_args.args[1].endswith("segmentation.dcm"))
        self.assertEqual(
            upload_file.call_args.kwargs["content_type"],
            "application/dicom",
        )

        response = self.client.get(self.collection_url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data["segmentation_masks"]), 1)
        self.assertEqual(
            response.data["segmentation_masks"][0]["label"],
            "Lung lesion",
        )
        self.assertEqual(
            response.data["segmentation_masks"][0]["url"],
            "https://storage.example/segmentation",
        )
        self.assertEqual(get_presigned_url.call_count, 2)

    @override_settings(SEGMENTATION_MAX_UPLOAD_BYTES=1)
    @patch("dicom_manager.views.segmentations.upload_file")
    def test_rejects_dicom_seg_over_size_limit(self, upload_file):
        response = self.client.post(
            self.collection_url,
            self.upload_payload(),
            format="multipart",
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("file", response.data)
        upload_file.assert_not_called()
        self.assertFalse(SegmentationMask.objects.exists())

    @patch("dicom_manager.views.segmentations.upload_file")
    def test_rejects_dicom_that_does_not_match_source_context(
        self,
        upload_file,
    ):
        invalid_files = [
            {"referenced_series_instance_uid": generate_uid()},
            {"study_instance_uid": generate_uid()},
            {"modality": "OT"},
            {"sop_class_uid": "1.2.840.10008.5.1.4.1.1.7"},
        ]
        for file_options in invalid_files:
            with self.subTest(file_options=file_options):
                response = self.client.post(
                    self.collection_url,
                    self.upload_payload(**file_options),
                    format="multipart",
                )
                self.assertEqual(response.status_code, 400)
                self.assertIn("file", response.data)
        upload_file.assert_not_called()
        self.assertFalse(SegmentationMask.objects.exists())

    @patch(
        "dicom_manager.models.segmentation_mask.get_presigned_url",
        return_value="https://storage.example/segmentation",
    )
    @patch("dicom_manager.views.segmentations.upload_file")
    def test_update_segmentation_mask(self, upload_file, get_presigned_url):
        mask = self.create_mask()

        response = self.client.put(
            self.detail_url(mask.id),
            self.upload_payload(label="Reviewed lung lesion"),
            format="multipart",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["id"], str(mask.id))

        mask.refresh_from_db()
        self.assertEqual(mask.label, "Reviewed lung lesion")
        self.assertEqual(
            response.data["url"], "https://storage.example/segmentation"
        )
        upload_file.assert_called_once()
        get_presigned_url.assert_called_once()

    @patch("dicom_manager.models.segmentation_mask.get_presigned_url")
    def test_detail_returns_dicom_seg_download_url(self, get_presigned_url):
        get_presigned_url.return_value = "https://storage.example/segmentation"
        mask = self.create_mask()

        response = self.client.get(self.detail_url(mask.id))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.data["url"], "https://storage.example/segmentation"
        )

    @patch("dicom_manager.models.segmentation_mask.delete_s3_object")
    def test_delete_removes_mask(self, delete_s3_object):
        mask = self.create_mask()

        response = self.client.delete(self.detail_url(mask.id))

        self.assertEqual(response.status_code, 204)
        self.assertFalse(SegmentationMask.objects.filter(id=mask.id).exists())
        self.assertEqual(delete_s3_object.call_count, 1)

import tempfile
from pathlib import Path

from django.test import RequestFactory, SimpleTestCase, override_settings

from annotation_platform.utils.upload_file import (
    delete_s3_object,
    download_file,
    get_presigned_url,
    upload_file,
)
from annotation_platform.views.local_media import serve_local_media


class LocalStorageTests(SimpleTestCase):
    def setUp(self):
        self.temporary_directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary_directory.cleanup)
        self.media_root = Path(self.temporary_directory.name) / "media"
        self.settings_override = override_settings(
            STORAGE_BACKEND="local",
            MEDIA_ROOT=self.media_root,
            LOCAL_MEDIA_BASE_URL="http://localhost:8000/media/",
        )
        self.settings_override.enable()
        self.addCleanup(self.settings_override.disable)

    def test_upload_download_url_and_delete(self):
        source = Path(self.temporary_directory.name) / "source file.dcm"
        source.write_bytes(b"dicom-data")
        key = "patients/one/source file.dcm"

        result = upload_file(source, key, content_type="application/dicom")

        stored_file = self.media_root / key
        self.assertEqual(result, {"object_key": key})
        self.assertEqual(stored_file.read_bytes(), b"dicom-data")
        self.assertEqual(
            get_presigned_url(key, expires_in_hrs=1),
            "http://localhost:8000/media/patients/one/source%20file.dcm",
        )

        destination = Path(self.temporary_directory.name) / "download.dcm"
        download_file(key, destination)
        self.assertEqual(destination.read_bytes(), b"dicom-data")

        delete_s3_object(key)
        self.assertFalse(stored_file.exists())
        delete_s3_object(key)

    def test_rejects_keys_outside_media_root(self):
        source = Path(self.temporary_directory.name) / "source.dcm"
        source.write_bytes(b"dicom-data")

        with self.assertRaisesRegex(ValueError, "Invalid object key"):
            upload_file(source, "../outside.dcm", content_type="application/dicom")

        with self.assertRaisesRegex(ValueError, "Invalid object key"):
            get_presigned_url("../outside.dcm", expires_in_hrs=1)

    def test_media_server_preserves_dicom_content_type(self):
        stored_file = self.media_root / "patients/one/source.dcm"
        stored_file.parent.mkdir(parents=True)
        stored_file.write_bytes(b"dicom-data")

        response = serve_local_media(
            RequestFactory().get("/media/patients/one/source.dcm"),
            "patients/one/source.dcm",
            document_root=self.media_root,
        )
        self.addCleanup(response.close)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response["Content-Type"], "application/dicom")

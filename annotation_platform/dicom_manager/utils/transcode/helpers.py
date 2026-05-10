from pydicom import dcmread
from pydicom.multival import MultiValue
from pydicom.valuerep import PersonName
import json
import os
import shutil
import subprocess
import logging

from annotation_platform.settings import BASE_DIR
from dicom_manager.models.instance import Instance

logger = logging.getLogger(__name__)

encoder_path = os.path.join(
    BASE_DIR, "dicom_manager/utils/transcode/encoders/htj2k/encoder.js"
)


class TranscodeError(RuntimeError):
    pass


class MultiValueEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, MultiValue):
            return list(obj)
        if isinstance(obj, PersonName):
            return str(obj)
        return super().default(obj)


def transcode_instance(instance: Instance, *, series_dir: str):
    instance_id = instance.id
    instance_dir = os.path.join(series_dir, f"instance_{instance_id}")

    if os.path.exists(instance_dir):
        shutil.rmtree(instance_dir)
    os.makedirs(instance_dir)

    try:
        dicom_path = os.path.join(instance_dir, f"{instance_id}.dcm")
        instance.download_p10_to_local(destination=dicom_path)

        ds = dcmread(dicom_path)

        pixel_representation = ds.get("PixelRepresentation", 0)
        bits_allocated = ds.get("BitsAllocated", 16)
        samples_per_pixel = ds.get("SamplesPerPixel", 1)

        frame_files = dicom_to_decoded_raw(ds, instance_dir)

        for frame_file in frame_files:
            frame_file_path = frame_file["temp_file_path"]
            height = frame_file["height"]
            width = frame_file["width"]
            frame_number = frame_file["frame_number"]

            destination_transcoded_frame_path = os.path.join(
                instance_dir, f"transcoded_frame_{frame_number}"
            )

            run_htj2k_encoder(
                frame_file_path=frame_file_path,
                output_path=destination_transcoded_frame_path,
                height=height,
                width=width,
                bits_allocated=bits_allocated,
                pixel_representation=pixel_representation,
                samples_per_pixel=samples_per_pixel,
            )

            instance.upload_dicomweb_to_s3(
                local_path=destination_transcoded_frame_path,
                frame_number=frame_number,
            )

            logger.info(
                f"Successfully transcoded and uploaded frame {frame_number}/{len(frame_files)} for instance id {instance_id}"
            )

        sop_instance_uid = ds.get("SOPInstanceUID", None)
        instance_metadata = ds.to_json_dict()
        instance_metadata["7FE00010"] = {
            "vr": "OB",
            "BulkDataURI": f"instances/{sop_instance_uid}/frames",
        }
        return instance_metadata
    finally:
        shutil.rmtree(instance_dir, ignore_errors=True)


def run_htj2k_encoder(
    *,
    frame_file_path: str,
    output_path: str,
    height: int,
    width: int,
    bits_allocated: int,
    pixel_representation: int,
    samples_per_pixel: int,
):
    command = [
        "node",
        encoder_path,
        str(height),
        str(width),
        str(bits_allocated),
        str(pixel_representation),
        str(samples_per_pixel),
        frame_file_path,
        output_path,
    ]
    result = subprocess.run(
        command,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        check=False,
    )

    if result.returncode != 0:
        raise TranscodeError(
            "JavaScript HTJ2K encoder failed\n"
            f"Command: {' '.join(command)}\n"
            f"Exit code: {result.returncode}\n"
            f"STDERR:\n{result.stderr.strip() or '<empty>'}\n"
            f"STDOUT:\n{result.stdout.strip() or '<empty>'}"
        )

    if not os.path.isfile(output_path) or os.path.getsize(output_path) == 0:
        raise TranscodeError(
            "JavaScript HTJ2K encoder completed without producing output\n"
            f"Command: {' '.join(command)}\n"
            f"Output path: {output_path}\n"
            f"STDERR:\n{result.stderr.strip() or '<empty>'}\n"
            f"STDOUT:\n{result.stdout.strip() or '<empty>'}"
        )


def dicom_to_decoded_raw(ds, instance_dir: str):
    pixel_array = ds.pixel_array
    number_of_frames = int(ds.get("NumberOfFrames", 1))

    frame_files = []

    if number_of_frames == 1:
        height, width = pixel_array.shape[:2]
        raw_bytes = pixel_array.tobytes()
        frame_path = os.path.join(instance_dir, "frame_1.raw")
        with open(frame_path, "wb") as frame_file:
            frame_file.write(raw_bytes)

        frame_files.append(
            {
                "temp_file_path": frame_path,
                "height": height,
                "width": width,
                "frame_number": 1,
            }
        )
    else:
        for frame_index in range(number_of_frames):
            frame_data = pixel_array[frame_index]
            height, width = frame_data.shape[:2]
            frame_number = frame_index + 1
            raw_bytes = frame_data.tobytes()
            frame_path = os.path.join(instance_dir, f"frame_{frame_number}.raw")
            with open(frame_path, "wb") as frame_file:
                frame_file.write(raw_bytes)

            frame_files.append(
                {
                    "temp_file_path": frame_path,
                    "height": height,
                    "width": width,
                    "frame_number": frame_number,
                }
            )

    return frame_files

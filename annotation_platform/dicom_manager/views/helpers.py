import json
import os
import tempfile
from annotation_platform.utils.upload_file import upload_file


def upload_annotation_set(s3_key: str, annotations_json: dict):
    with tempfile.NamedTemporaryFile(
        mode="w", encoding="utf-8", suffix=".json", delete=False
    ) as tmp:
        json.dump(annotations_json, tmp)
        tmp.flush()
        temp_path = tmp.name

    try:
        upload_file(temp_path, s3_key)
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

import os
import shutil
from pathlib import Path
from urllib.parse import quote

import boto3
from botocore.config import Config
from django.conf import settings


class S3ObjectDeletionError(RuntimeError):
    """Raised when a remote object must be removed before a DB row is deleted and removal fails."""


def build_object_key(prefix: str, filename: str) -> str:
    return f"{prefix}/{filename}"


def _s3_client():
    return boto3.client(
        "s3",
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        region_name=settings.AWS_S3_REGION_NAME,
        endpoint_url=settings.AWS_S3_ENDPOINT_URL,
        config=Config(signature_version=settings.AWS_S3_SIGNATURE_VERSION),
    )


def _local_path(key: str) -> Path:
    """Resolve an object key below MEDIA_ROOT without allowing path traversal."""
    media_root = Path(settings.MEDIA_ROOT).resolve()
    path = (media_root / key.lstrip("/")).resolve()
    try:
        path.relative_to(media_root)
    except ValueError as error:
        raise ValueError(f"Invalid object key: {key}") from error
    return path


def get_presigned_url(key: str, expires_in_hrs: int) -> str:
    if settings.STORAGE_BACKEND == "local":
        _local_path(key)
        base_url = settings.LOCAL_MEDIA_BASE_URL.rstrip("/")
        encoded_key = quote(key.lstrip("/"), safe="/")
        return f"{base_url}/{encoded_key}"

    expires_in = expires_in_hrs * 3600
    client = _s3_client()
    return client.generate_presigned_url(
        "get_object",
        Params={
            "Bucket": settings.AWS_STORAGE_BUCKET_NAME,
            "Key": key,
        },
        ExpiresIn=expires_in,
    )


def upload_file(file_source: str, key: str, content_type: str):
    file_path = Path(file_source)

    if not file_path.is_file():
        raise FileNotFoundError(f"File does not exist: {file_source}")

    if settings.STORAGE_BACKEND == "local":
        destination = _local_path(key)
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(file_path, destination)
        return {"object_key": key}

    client = _s3_client()

    extra_args = {
        "ContentType": content_type,
    }

    client.upload_file(
        Filename=str(file_path),
        Bucket=settings.AWS_STORAGE_BUCKET_NAME,
        Key=key,
        ExtraArgs=extra_args,
    )

    return {
        "object_key": key,
    }


def download_file(key: str, destination: str):
    if not os.path.exists(os.path.dirname(destination)):
        raise FileNotFoundError(
            f"Directory {os.path.dirname(destination)} does not exist"
        )

    if settings.STORAGE_BACKEND == "local":
        source = _local_path(key)
        if not source.is_file():
            raise FileNotFoundError(f"Object does not exist: {key}")
        shutil.copyfile(source, destination)
        return

    client = _s3_client()

    client.download_file(
        settings.AWS_STORAGE_BUCKET_NAME,
        key,
        destination,
    )


def delete_s3_object(key: str) -> None:
    if settings.STORAGE_BACKEND == "local":
        _local_path(key).unlink(missing_ok=True)
        return

    client = _s3_client()
    client.delete_object(
        Bucket=settings.AWS_STORAGE_BUCKET_NAME,
        Key=key,
    )


# def delete_s3_prefix(prefix: str) -> int:
#     """Delete every object whose key starts with this prefix. Returns the number of objects removed."""
#     normalized = prefix.strip().lstrip("/")
#     if not normalized:
#         raise ValueError("prefix must be non-empty")

#     client = _s3_client()
#     bucket = settings.AWS_STORAGE_BUCKET_NAME
#     deleted = 0
#     paginator = client.get_paginator("list_objects_v2")
#     for page in paginator.paginate(Bucket=bucket, Prefix=normalized):
#         contents = page.get("Contents") or []
#         if not contents:
#             continue
#         objects = [{"Key": obj["Key"]} for obj in contents]
#         for i in range(0, len(objects), 1000):
#             batch = objects[i : i + 1000]
#             response = client.delete_objects(
#                 Bucket=bucket,
#                 Delete={"Objects": batch, "Quiet": True},
#             )
#             errors = response.get("Errors") or []
#             if errors:
#                 raise S3ObjectDeletionError(
#                     f"Failed to delete {len(errors)} object(s) under prefix {normalized!r}: {errors!r}"
#                 )
#             deleted += len(batch)
#     return deleted

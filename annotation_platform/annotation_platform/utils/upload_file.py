import os
from pathlib import Path

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


def get_presigned_url(key: str, expires_in_hrs: int) -> str:
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


def upload_file(file_source: str, key: str):
    client = _s3_client()

    if isinstance(file_source, (str, Path)):
        client.upload_file(
            os.fspath(file_source),
            settings.AWS_STORAGE_BUCKET_NAME,
            key,
        )
    else:
        client.upload_fileobj(
            file_source,
            settings.AWS_STORAGE_BUCKET_NAME,
            key,
        )

    return {
        "object_key": key,
    }


def delete_s3_object(key: str) -> None:
    client = _s3_client()
    client.delete_object(
        Bucket=settings.AWS_STORAGE_BUCKET_NAME,
        Key=key,
    )


def delete_s3_prefix(prefix: str) -> int:
    """Delete every object whose key starts with this prefix. Returns the number of objects removed."""
    normalized = prefix.strip().lstrip("/")
    if not normalized:
        raise ValueError("prefix must be non-empty")

    client = _s3_client()
    bucket = settings.AWS_STORAGE_BUCKET_NAME
    deleted = 0
    paginator = client.get_paginator("list_objects_v2")
    for page in paginator.paginate(Bucket=bucket, Prefix=normalized):
        contents = page.get("Contents") or []
        if not contents:
            continue
        objects = [{"Key": obj["Key"]} for obj in contents]
        for i in range(0, len(objects), 1000):
            batch = objects[i : i + 1000]
            response = client.delete_objects(
                Bucket=bucket,
                Delete={"Objects": batch, "Quiet": True},
            )
            errors = response.get("Errors") or []
            if errors:
                raise S3ObjectDeletionError(
                    f"Failed to delete {len(errors)} object(s) under prefix {normalized!r}: {errors!r}"
                )
            deleted += len(batch)
    return deleted

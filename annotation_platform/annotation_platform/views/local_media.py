from pathlib import Path

from django.views.static import serve


CONTENT_TYPES = {
    ".dcm": "application/dicom",
    ".json": "application/json",
    ".mht": "multipart/related",
}


def serve_local_media(request, path, document_root=None):
    """Serve development media while preserving the S3 object MIME types."""
    response = serve(request, path, document_root=document_root)
    content_type = CONTENT_TYPES.get(Path(path).suffix.lower())
    if content_type:
        response["Content-Type"] = content_type
    return response

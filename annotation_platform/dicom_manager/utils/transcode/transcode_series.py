from django.db.models import QuerySet
import tempfile
import logging
import json

from dicom_manager.models.instance import Instance
from dicom_manager.models.series import Series
from .helpers import transcode_instance, MultiValueEncoder

logger = logging.getLogger(__name__)


def transcode_series(series_id):
    try:
        series: Series = Series.objects.get(id=series_id)
        instances: QuerySet[Instance] = series.instance_set.all()

        combined_metadata = {}
        num_encoded = 0

        for instance in instances:
            instance_metadata = transcode_instance(instance)
            combined_metadata[instance.id] = instance_metadata
            num_encoded += 1
            logger.info(f"files encoded: {num_encoded}/{len(instances)}")

        with tempfile.NamedTemporaryFile(
            mode="w", encoding="utf-8", suffix=".json"
        ) as metadata_file:
            json.dump(combined_metadata, metadata_file, indent=4, cls=MultiValueEncoder)
            metadata_file.flush()
            series.upload_metadata(local_path=metadata_file.name)
    except Exception as e:
        logger.exception(f"Error encountered while transcoding files: {e}")

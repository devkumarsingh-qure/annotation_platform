from django.db.models import QuerySet
import tempfile
import logging
import json
import os

from dicom_manager.models.instance import Instance
from dicom_manager.models.series import Series
from .helpers import transcode_instance, MultiValueEncoder

logger = logging.getLogger(__name__)


def transcode_series(series_id):
    try:
        series: Series = Series.objects.get(id=series_id)
        instances: QuerySet[Instance] = series.instance_set.all()

        with tempfile.TemporaryDirectory(
            prefix=f"transcode_series_{series_id}_"
        ) as series_dir:
            combined_metadata = {}
            num_encoded = 0
            total_instances = instances.count()

            for instance in instances.iterator():
                instance_metadata = transcode_instance(
                    instance,
                    series_dir=series_dir,
                )
                combined_metadata[instance.id] = instance_metadata
                num_encoded += 1
                logger.info("files encoded: %s/%s", num_encoded, total_instances)

            metadata_path = os.path.join(series_dir, "metadata.json")
            with open(metadata_path, "w", encoding="utf-8") as metadata_file:
                json.dump(
                    combined_metadata,
                    metadata_file,
                    indent=4,
                    cls=MultiValueEncoder,
                )
            series.upload_metadata(local_path=metadata_path)
    except Exception as e:
        logger.exception(f"Error encountered while transcoding files: {e}")

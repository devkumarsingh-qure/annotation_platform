from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("dicom_manager", "0003_segmentationmask_is_ready"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="segmentationmask",
            name="file_size_bytes",
        ),
        migrations.RemoveField(
            model_name="segmentationmask",
            name="format_version",
        ),
        migrations.RemoveField(
            model_name="segmentationmask",
            name="is_ready",
        ),
        migrations.RemoveField(
            model_name="segmentationmask",
            name="segmentation_id",
        ),
        migrations.RemoveField(
            model_name="segmentationmask",
            name="voxel_count",
        ),
    ]

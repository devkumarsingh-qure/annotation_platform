from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("dicom_manager", "0002_segmentationmask"),
    ]

    operations = [
        migrations.AddField(
            model_name="segmentationmask",
            name="is_ready",
            field=models.BooleanField(default=True),
        ),
        migrations.AlterField(
            model_name="segmentationmask",
            name="is_ready",
            field=models.BooleanField(default=False),
        ),
    ]

from rest_framework import serializers

from dicom_manager.models import Patient


class PatientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Patient
        fields = (
            "id",
            "PatientID",
            "PatientName",
            "PatientAge",
            "PatientSex",
            "created_at",
        )

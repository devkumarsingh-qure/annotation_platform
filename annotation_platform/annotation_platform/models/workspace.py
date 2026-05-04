from django.core.validators import MinLengthValidator
from django.db import models


class Workspace(models.Model):
    name = models.CharField(
        max_length=255,
        blank=False,
        validators=[MinLengthValidator(1)],
    )
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

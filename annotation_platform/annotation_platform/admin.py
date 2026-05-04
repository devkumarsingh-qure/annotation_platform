from django.contrib import admin
from annotation_platform.models import (
    Workspace,
    Project,
    ProjectUserPatientsAssignment,
)

admin.site.register(Workspace)
admin.site.register(Project)
admin.site.register(ProjectUserPatientsAssignment)

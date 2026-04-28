from django.contrib import admin
from .models import Patient, Study, Series, Instance, AnnotationSet

admin.site.register(Patient)
admin.site.register(Study)
admin.site.register(Series)
admin.site.register(Instance)
admin.site.register(AnnotationSet)
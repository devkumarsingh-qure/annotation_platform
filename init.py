import os

password = os.getenv("DJANGO_ADMIN_PASSWORD")

workspace, _ = Workspace.objects.get_or_create(id=1, name="Demo Workspace")
user, _ = User.objects.get_or_create(
    id=1, username="workspace_admin", password=password, workspace=workspace
)
user.is_workspace_admin = True
user.is_superuser = True
user.is_staff = True
user.save()

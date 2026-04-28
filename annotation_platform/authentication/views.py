import json

from django.http import JsonResponse
from django.middleware.csrf import get_token
from django.views.decorators.http import require_GET, require_POST
from django.views.decorators.csrf import ensure_csrf_cookie
from django.contrib.auth import authenticate, login, logout


@ensure_csrf_cookie
@require_GET
def csrf_cookie_view(request):
    return JsonResponse({"csrfToken": get_token(request)})


@ensure_csrf_cookie
@require_GET
def me(request):
    if request.user.is_authenticated:
        return JsonResponse(
            {
                "is_authenticated": True,
                "username": request.user.username,
            }
        )
    return JsonResponse({"is_authenticated": False}, status=401)


@require_POST
def login_view(request):
    try:
        payload = json.loads(request.body.decode("utf-8")) if request.body else {}
    except json.JSONDecodeError:
        return JsonResponse({"detail": "Invalid JSON payload"}, status=400)

    username = payload.get("username")
    password = payload.get("password")
    user = authenticate(request, username=username, password=password)
    if user is not None:
        login(request, user)
        return JsonResponse(
            {
                "is_authenticated": True,
                "username": request.user.username,
            }
        )
    return JsonResponse({"is_authenticated": False}, status=401)


@require_GET
def logout_view(request):
    logout(request)
    return JsonResponse({"is_authenticated": False})

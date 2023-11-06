from django.urls import path, include

from . import views

# NOTE: We might have to use the decorator csrf_protect to ensure that
# the endpoints that need the csrf token always get it

urlpatterns = [
    path("", views.index, name="index"),
    path(
        "auth/register",
        views.UserRegistrationView.as_view(),
        name="user-registration",
    ),
    path("auth/login", views.UserLoginView.as_view(), name="user-login"),
    path("auth/logout", views.logout_view, name="user-logout"),
    path("auth/session", views.session_view, name="user-session-view"),
    path("auth/whoami", views.whoami_view, name="user-whoami"),
    path(
        "auth/password_reset/",
        include("django_rest_passwordreset.urls", namespace="password_reset"),
    ),
    path("api/user", views.user_view, name="user-info"),
    path(
        "api/user/profile_picture",
        views.handle_profile_picture,
        name="user-info-profile-picture",
    ),
    path(
        "api/user/pet/pictures",
        views.handle_pet_pictures,
        name="user-info-pet-pictures",
    ),
]

from django.urls import path, include

from . import views
from .views import UserRegistrationView
from .views import UserLoginView, PetListCreateView, PetRetrieveUpdateDeleteView, JobView

# csrf

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
    path("pets/", PetListCreateView.as_view(), name="pet-list-create"),
    path(
        "pets/<uuid:pk>/", PetRetrieveUpdateDeleteView.as_view(), name="pet-retrieve-update-delete"
    ),
    path("jobs/", JobView.as_view(), name="custom-job-view"),
]

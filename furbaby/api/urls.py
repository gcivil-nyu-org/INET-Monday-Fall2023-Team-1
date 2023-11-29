from django.urls import path, include

from . import views
from .views import (
    UserRegistrationView,
    UserLoginView,
    PetListCreateView,
    PetRetrieveUpdateDeleteView,
)

# NOTE: We might have to use the decorator csrf_protect to ensure that
# the endpoints that need the csrf token always get it

urlpatterns = [
    path("", views.index, name="index"),
    path(
        "auth/register",
        UserRegistrationView.as_view(),
        name="user-registration",
    ),
    path("auth/login", UserLoginView.as_view(), name="user-login"),
    path("auth/logout", views.logout_view, name="user-logout"),
    path("auth/session", views.session_view, name="user-session-view"),
    path("auth/whoami", views.whoami_view, name="user-whoami"),
    path(
        "auth/password_reset/",
        include("django_rest_passwordreset.urls", namespace="password_reset"),
    ),
    path("api/user", views.user_view, name="user-info"),
    path("user-list/", views.UserList.as_view(), name="user-list"),
    path(
        "jobs/<uuid:job_id>/apply/",
        views.ApplyForJobView.as_view(),
        name="apply_for_job",
    ),
    path("get-job-status/<uuid:job_id>", views.GetJobStatus.as_view()),
    path(
        "api/user/profile_picture",
        views.handle_profile_picture,
        name="user-info-profile-picture",
    ),
    # path(
    #     "api/user/pet/pictures",
    #     views.handle_pet_pictures,
    #     name="user-info-pet-pictures",
    # ),
    path("api/user/locations", views.user_location_view, name="user-location"),
    path("pets/", PetListCreateView.as_view(), name="pet-list-create"),
    path(
    ),
    path("api/user/locations", views.user_location_view, name="user-location"),
    path(
        "jobs/<uuid:job_id>/applications/<uuid:application_id>/accept/",
        views.accept_application,
        name="accept_application",
    ),
    path(
        "jobs/<uuid:job_id>/applications/<uuid:application_id>/reject/",
        views.reject_application,
        name="reject_application",
    ),
]

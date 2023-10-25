from django.urls import path

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("register", views.UserRegistrationView.as_view(), name="user-registration"),
    path("login", views.UserLoginView.as_view(), name="user-login"),
    path("logout", views.logout_view, name="user-logout"),
    path("session", views.session_view, name="user-session-view"),
    path("whoami", views.whoami_view, name="user-whoami"),
]

from django.urls import path
from django.db import models
from django.contrib.postgres.fields import ArrayField
from django.contrib.auth.models import AbstractUser

# from django.contrib.auth.hashers import make_password use this while storing use passwords
import uuid

from . import views
from .views import UserRegistrationView
from .views import UserLoginView,PetListCreateView,PetRetrieveUpdateDeleteView,UserProfileEditView


urlpatterns = [
    path("", views.index, name="index"),
    path("register/", UserRegistrationView.as_view(), name="user-registration"),
    path("login/", UserLoginView.as_view(), name="user-login"),
    path('edit/', UserProfileEditView.as_view(), name='edit'),
    path('pets/', PetListCreateView.as_view(), name='pet-list-create'),
    path('pets/<uuid:pk>/', PetRetrieveUpdateDeleteView.as_view(), name='pet-retrieve-update-delete'),
    
]

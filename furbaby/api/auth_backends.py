from django.contrib.auth import get_user_model
from django.contrib.auth.backends import ModelBackend
from django.contrib.auth.hashers import check_password
from rest_framework import status

from .utils import json_response


class EmailBackend(ModelBackend):
    def authenticate(self, request, email=None, password=None, **kwargs):
        User = get_user_model()
        try:
            user = User.objects.get(email=email, username=email)
            if check_password(password, user.password):
                return user
        except User.DoesNotExist:
            return json_response(
                data={"error": "User Not Found", "email": email},
                status=status.HTTP_404_NOT_FOUND,
            )

    def get_user(self, user_id):
        User = get_user_model()
        try:
            return User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return None

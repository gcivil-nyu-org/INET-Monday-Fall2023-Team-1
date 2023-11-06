import json
from django.contrib.auth import get_user_model
from django.contrib.auth.backends import ModelBackend
from django.contrib.auth.hashers import check_password
from rest_framework import status

from .utils import json_response, read_request_body


class EmailBackend(ModelBackend):
    def authenticate(self, request, email=None, password=None, **kwargs):
        User = get_user_model()
        try:
            user = User.objects.get(email=email, username=email)
            if check_password(password, user.password):
                return user
        except User.DoesNotExist:
            return None

    def __get_user_record__(self, user=None):
        if user is None:
            return None
        return {
            "email": user.email,
            "first_name": user.first_name,
            "id": user.id,
            "last_name": user.last_name,
            "user_type": user.user_type,
            # "profile_picture": user.profile_picture,
            "date_of_birth": user.date_of_birth,
            "about": user.experience,
            "qualifications": user.qualifications,
            "created_at": user.created_at,
            "updated_at": user.updated_at,
        }

    def get_user_info(self, request, email=None, **kwargs):
        User = get_user_model()
        try:
            user = User.objects.get(email=email, username=email)
            return json_response(
                self.__get_user_record__(user),
                status.HTTP_200_OK,
            )
        except User.DoesNotExist:
            return json_response(
                data={"error": "user not found", "email": email},
                status=status.HTTP_404_NOT_FOUND,
            )

    def delete_user(self, request, email=None, **kwargs):
        User = get_user_model()
        try:
            user = User.objects.get(email=email, username=email)
            user.delete()
            return json_response(
                {"message": "User deleted successfully"},
                status.HTTP_200_OK,
            )
        except User.DoesNotExist:
            return json_response(
                data={"error": "user not found", "email": email},
                status=status.HTTP_404_NOT_FOUND,
            )

    def update_user_info(self, request, email=None, **kwargs):
        User = get_user_model()
        try:
            user = User.objects.get(email=email, username=email)
            req_body = read_request_body(request)
            user.first_name = req_body["first_name"]  # type: ignore
            user.last_name = req_body["last_name"]  # type: ignore
            user.date_of_birth = req_body["date_of_birth"]  # type: ignore
            user.experience = req_body["about"]  # type: ignore
            user.qualifications = req_body["qualifications"]  # type: ignore
            user.save()
            # NOTE: use user.save(update_fields=[column_names...]) to make sure
            # that it is going to be an update on those columns alone
            return json_response(
                self.__get_user_record__(User.objects.get(email=email, username=email)),
                status.HTTP_200_OK,
            )
        except User.DoesNotExist:
            return json_response(
                data={"error": "user not found", "email": email},
                status=status.HTTP_404_NOT_FOUND,
            )

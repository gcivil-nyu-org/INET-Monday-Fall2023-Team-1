import json
import os
from django.http import JsonResponse
from django.contrib.auth import login, logout
from drf_standardized_errors.handler import exception_handler
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.generics import GenericAPIView
from django.conf import settings
from rest_framework.decorators import api_view

from .models import Locations

from .utils import json_response
from api.auth_backends import EmailBackend
from .serializers import (
    RegistrationSerializer,
    UserLocationSerializer,
    UserLoginSerializer,
)

from django.core.mail import EmailMultiAlternatives
from django.dispatch import receiver
from django.template.loader import render_to_string

from django_rest_passwordreset.signals import reset_password_token_created

import json
from django.core.serializers import serialize


class UserRegistrationView(GenericAPIView):
    # the next line is to disable CORS for that endpoint/view
    authentication_classes = []

    serializer_class = RegistrationSerializer

    def get_exception_handler(self):
        return exception_handler

    def post(self, request):
        serializer = self.serializer_class(data=request.data)

        if not serializer.is_valid():
            return json_response(data=serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        serializer.save()
        return json_response(data=serializer.data, status=status.HTTP_201_CREATED)


class UserLoginView(APIView):
    # the next line is to disable CORS for that endpoint/view
    authentication_classes = []

    def get_exception_handler(self):
        return exception_handler

    def post(self, request):
        serializer = UserLoginSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data["email"]
            password = serializer.validated_data["password"]
            email_backend = EmailBackend()
            user = email_backend.authenticate(request, email=email, password=password)
            if user is not None:
                login(request, user)
                return json_response(
                    data={"message": "Login successful"}, status=status.HTTP_200_OK
                )
            else:
                return json_response(
                    data={"message": "User is not found"},
                    status=status.HTTP_404_NOT_FOUND,
                )
        return json_response(data=serializer.errors, status=status.HTTP_401_UNAUTHORIZED)


@api_view(["GET", "OPTIONS", "POST"])
def logout_view(request):
    if not request.user.is_authenticated:
        return json_response(
            {"detail": "You're not logged in."}, status=status.HTTP_400_BAD_REQUEST
        )

    logout(request)
    return json_response({"detail": "Successfully logged out."}, status=status.HTTP_200_OK)


@api_view(["GET", "OPTIONS", "POST"])
def session_view(request):
    if not request.user.is_authenticated:
        return json_response({"isAuthenticated": False}, status=status.HTTP_401_UNAUTHORIZED)

    return json_response({"isAuthenticated": True})


@api_view(["GET", "OPTIONS", "POST"])
def whoami_view(request):
    if not request.user.is_authenticated:
        return json_response({"isAuthenticated": False}, status=status.HTTP_401_UNAUTHORIZED)

    return json_response({"email": request.user.email}, status=status.HTTP_200_OK)


@api_view(["GET", "OPTIONS", "PUT", "PATCH", "DELETE"])
def user_view(request):
    if not request.user.is_authenticated:
        return json_response({"isAuthenticated": False}, status=status.HTTP_401_UNAUTHORIZED)

    email_backend = EmailBackend()
    if request.method == "GET":
        return email_backend.get_user_info(request, request.user.email)

    if request.method in ["PUT", "PATCH"]:
        return __update_user_info__(request)

    if request.method == "DELETE":
        return email_backend.delete_user(request, request.user.email)

    return json_response(
        {"error": "incorrect request method supplied"},
        status=status.HTTP_405_METHOD_NOT_ALLOWED,
    )


def __update_user_info__(request):
    if not request.user.is_authenticated:
        return json_response(
            {
                "isAuthenticated": False,
            },
            status=status.HTTP_401_UNAUTHORIZED,
        )

    email_backend = EmailBackend()
    return email_backend.update_user_info(request, request.user.email)


@api_view(["GET", "OPTIONS"])
def index(req):
    return JsonResponse(
        {
            "version": {
                "short_hash": getattr(settings, "GIT_COMMIT_SHORT_HASH", "default-00000"),
                "hash": getattr(settings, "GIT_COMMIT_HASH", "default-00000"),
            }
        },
        status=200,
    )


@receiver(reset_password_token_created)
def password_reset_token_created(sender, instance, reset_password_token, *args, **kwargs):
    """
    Handles password reset tokens
    When a token is created, an e-mail needs to be sent to the user
    :param sender: View Class that sent the signal
    :param instance: View Instance that sent the signal
    :param reset_password_token: Token Model Object
    :param args:
    :param kwargs:
    :return:
    """
    # send an e-mail to the user
    context = {
        "username": reset_password_token.user.username,
        "email": reset_password_token.user.email,
        "reset_password_url": "{}/forgot-password?token={}".format(
            os.environ["FORGOT_PASSWORD_HOST"],
            reset_password_token.key,
        ),
    }

    # render email text
    email_html_message = render_to_string("email/password_reset_email.html", context)
    email_plaintext_message = render_to_string("email/password_reset_email.txt", context)

    msg = EmailMultiAlternatives(
        # title:
        "Password Reset instructions for {title}".format(title="FurBaby"),
        # message:
        email_plaintext_message,
        # from:
        "sak9791@nyu.edu",
        # to:
        [reset_password_token.user.email],
    )
    msg.attach_alternative(email_html_message, "text/html")
    msg.send()


# This class is for the user location(s)
class UserLocationView(APIView):
    # Fetch the locations serializer
    serializer_class = UserLocationSerializer

    def get_exception_handler(self):
        return exception_handler

    # takes as input the user id, request and inserts a new location record for the user
    def insert_location_record(self, request):
        serializer = self.serializer_class(data=request.data, context={"request": request})

        if not serializer.is_valid():
            return json_response(data=serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        instance = serializer.save()

        return json_response(
            instance.id, status=status.HTTP_201_CREATED, include_data=False, safe=False
        )

    # takes as input a location object and returns a dictionary of the location key value pairs
    def get_location_record(self, location=None):
        if location == None:
            return None
        return {
            "id": location.id,
            "address": location.address,
            "city": location.city,
            "country": location.country,
            "zipcode": location.zipcode,
            "user_id": location.user_id,
            "default_location": location.default_location,
        }

    # takes as input a user_id and returns a JSON of all the locations for that user
    def get_user_locations(self, request):
        locations = Locations.objects.filter(user_id=request.user.id)
        location_list = [
            {
                "id": location.id,
                "address": location.address,
                "city": location.city,
                "country": location.country,
                "zipcode": location.zipcode,
                "default_location": location.default_location,
            }
            for location in locations
        ]
        return location_list

    # takes as input a location_id and location fields and updates the location record
    def update_location_record(self, request):
        try:
            updated_fileds = []
            location_id = request.data["id"]
            location = Locations.objects.get(id=location_id)
            if "address" in request.data:
                location.address = request.data["address"]
                updated_fileds.append("address")
            if "city" in request.data:
                location.city = request.data["city"]
                updated_fileds.append("city")
            if "country" in request.data:
                location.country = request.data["country"]
                updated_fileds.append("country")
            if "zipcode" in request.data:
                location.zipcode = request.data["zipcode"]
                updated_fileds.append("zipcode")
            if "default_location" in request.data:
                if request.data["default_location"] == True:
                    # unset all other locations as default
                    Locations.objects.filter(user_id=request.user.id).update(default_location=False)
                location.default_location = request.data["default_location"]
                updated_fileds.append("default_location")

            # location.save()
            location.save(update_fields=updated_fileds)

            return json_response(
                self.get_location_record(location),
                status.HTTP_200_OK,
                safe=False,
                include_data=False,
            )
        except Locations.DoesNotExist:
            return json_response(
                data={
                    "error": "location not found for user",
                    "location id": location_id,
                    "user id": request.user.id,
                },
                status=status.HTTP_404_NOT_FOUND,
            )
        except Exception as e:
            return json_response(
                data={
                    "error": "something went wrong while updating the location record",
                    "error message": str(e),
                    "location id": location_id,
                    "user id": request.user.id,
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def delete_location_record(self, request):
        try:
            location_id = request.data["id"]
            location = Locations.objects.get(id=location_id)
            location.delete()
            return json_response(
                {"message": "location deleted successfully"},
                status.HTTP_200_OK,
            )
        except Locations.DoesNotExist:
            return json_response(
                data={
                    "error": "location not found for user",
                    "location id": location_id,
                    "user id": request.user.id,
                },
                status=status.HTTP_404_NOT_FOUND,
            )
        except Exception as e:
            return json_response(
                data={
                    "error": "something went wrong while deleting the location record",
                    "error message": str(e),
                    "location id": location_id,
                    "user id": request.user.id,
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


@api_view(["GET", "POST", "OPTIONS", "PUT", "PATCH", "DELETE"])
def user_location_view(request):
    location_view = UserLocationView()

    if not request.user.is_authenticated:
        return json_response({"isAuthenticated": False}, status=status.HTTP_401_UNAUTHORIZED)

    # fetch all user locations for the user
    if request.method == "GET":
        locations_list = location_view.get_user_locations(request)
        return json_response(
            locations_list, status=status.HTTP_200_OK, safe=False, include_data=False
        )

    # insert a new location record for the user
    if request.method in ["POST"]:
        return location_view.insert_location_record(request)

    # update a location record for the user
    if request.method in ["PUT", "PATCH"]:
        return location_view.update_location_record(request)

    # delete a location record for the user
    if request.method == "DELETE":
        return location_view.delete_location_record(request)

    return json_response(
        {"error": "incorrect request method supplied"},
        status=status.HTTP_405_METHOD_NOT_ALLOWED,
    )

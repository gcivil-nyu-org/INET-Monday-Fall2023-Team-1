import os
from django.http import JsonResponse, HttpResponse
from django.contrib.auth import login, logout
from drf_standardized_errors.handler import exception_handler
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.generics import GenericAPIView
from django.conf import settings
from rest_framework.decorators import api_view

from .models import Pets, Users

from .utils import json_response, make_s3_path
from api.auth_backends import EmailBackend
from .serializers import RegistrationSerializer, UserLoginSerializer

from django.core.mail import EmailMultiAlternatives
from django.dispatch import receiver
from django.template.loader import render_to_string

from django_rest_passwordreset.signals import reset_password_token_created

from django.views.decorators.csrf import csrf_protect

import boto3
from botocore.exceptions import ClientError

s3Config = getattr(settings, "S3_CONFIG", None)
s3Client = boto3.client("s3", config=s3Config)
s3AssetsFolder = getattr(settings, "ASSETS_PATH")
s3BucketName = getattr(settings, "AWS_BUCKET_NAME")


class UserRegistrationView(GenericAPIView):
    # the next line is to disable CORS for that endpoint/view
    authentication_classes = []

    serializer_class = RegistrationSerializer

    def get_exception_handler(self):
        return exception_handler

    def post(self, request):
        if request.user.is_authenticated:
            return json_response(
                data={"message": "user account has already been created"},
                status=status.HTTP_200_OK,
            )

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
        if request.user.is_authenticated:
            return json_response(
                data={"message": "user account has already been created"},
                status=status.HTTP_200_OK,
            )

        serializer = UserLoginSerializer(data=request.data)

        if serializer.is_valid():
            email = serializer.validated_data["email"]  # type: ignore
            password = serializer.validated_data["password"]  # type: ignore
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


@csrf_protect
@api_view(["GET", "OPTIONS", "POST"])
def logout_view(request):
    if not request.user.is_authenticated:
        return json_response(
            {"detail": "You're not logged in."}, status=status.HTTP_400_BAD_REQUEST
        )

    logout(request)
    return json_response({"detail": "Successfully logged out."}, status=status.HTTP_200_OK)


@csrf_protect
@api_view(["GET", "OPTIONS", "POST"])
def session_view(request):
    current_user = Users.objects.filter(id=request.user.id).first()

    if not request.user.is_authenticated or current_user == None:
        return json_response({"isAuthenticated": False}, status=status.HTTP_401_UNAUTHORIZED)

    user_response_body = {
        "id": current_user.id,
        "email": current_user.email.lower(),
    }

    if current_user.first_name != None or current_user.last_name != None:
        name = "{} {}".format(
            "" if current_user.first_name == None else current_user.first_name,
            "" if current_user.last_name == None else current_user.last_name,
        )
        user_response_body["name"] = name

    return json_response(
        {
            "isAuthenticated": True,
            "user": user_response_body,
        },
        status=status.HTTP_200_OK,
    )


@csrf_protect
@api_view(["GET", "OPTIONS", "POST"])
def whoami_view(request):
    if not request.user.is_authenticated:
        return json_response({"isAuthenticated": False}, status=status.HTTP_401_UNAUTHORIZED)

    return json_response({"email": request.user.email}, status=status.HTTP_200_OK)


@csrf_protect
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


@csrf_protect
@api_view(["GET", "POST", "OPTIONS"])
def handle_profile_picture(request):
    if not request.user.is_authenticated:
        return json_response(
            data={"error": "unauthenticated request. rejected"},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    if request.method == "GET":
        return __get_user_profile_picture__(request)

    if request.method == "POST":
        return __upload_profile_picture__(request)

    return json_response(
        {
            "error": "incorrect request method",
            "message": 'endpoint only allows only "GET" & "PUT" requests',
        },
        status=status.HTTP_405_METHOD_NOT_ALLOWED,
    )


def __get_user_profile_picture__(request):
    profile_picture_path = make_s3_path(
        s3AssetsFolder, str(request.user.id), "profile-picture", "picture"
    )

    try:
        image_object = s3Client.get_object(Bucket=s3BucketName, Key=profile_picture_path)
        object_content = image_object["Body"].read()
        return HttpResponse(object_content, content_type="image/jpeg")
    except ClientError as e:
        if e.response["Error"]["Code"] == "NoSuchKey":
            return json_response(
                {
                    "data": {
                        "message": "no profile picture present with current user: {}".format(
                            str(request.user.id),
                        ),
                        "key": profile_picture_path,
                    }
                },
                status=status.HTTP_404_NOT_FOUND,
            )
        return json_response(
            data={
                "error": "failed to fetch profile picture, ({})".format(e),
                "message": "unknown error occurred while fetching user profile picture",
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


def __upload_profile_picture__(request):
    if s3Config == None:
        return json_response(
            data={"error": "failed to upload profile picture due to internal error"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    picture = request.FILES["profile_picture"]

    if picture == None:
        return json_response(
            data={
                "error": "file missing in upload",
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    if picture.content_type != "image/jpeg":
        return json_response(
            {
                "error": "incorrect file format uploaded",
                "message": 'only file type of "jpeg" is accepted',
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        upload_path = make_s3_path(
            s3AssetsFolder, str(request.user.id), "profile-picture", "picture"
        )
        # NOTE: if the Key is the same, the object(s) are overwritten
        s3Client.put_object(Bucket=s3BucketName, Body=picture, Key=upload_path)
    except ClientError as e:
        return json_response(
            {
                "error": e.__str__(),
                "message": "failed to upload file",
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    return json_response(
        data={"message": "profile picture has been updated"},
        status=status.HTTP_201_CREATED,
    )


@csrf_protect
@api_view(["POST", "GET", "OPTIONS", "DELETE"])
def handle_pet_pictures(request):
    if not request.user.is_authenticated:
        return json_response(
            data={"error": "unauthenticated request. rejected"},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    if s3Config == None:
        return json_response(
            data={"error": "failed to upload picture due to internal error"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    if request.method == "GET":
        return __get_user_pet_picture__(request)

    if request.method == "POST":
        return __put_user_pet_picture__(request)

    if request.method == "DELETE":
        return __delete_user_pet_picture__(request)

    return json_response(
        {
            "error": "incorrect request method",
            "message": 'endpoint only allows only "POST" & "PUT" requests',
        },
        status=status.HTTP_405_METHOD_NOT_ALLOWED,
    )


def __get_user_pet_picture__(request):
    pet_id = request.data["pet_id"]

    pet_info = Pets.objects.filter(name=pet_id, owner=request.user.id).first()

    if pet_info == None:
        return json_response(
            data={
                "error": "failed to locate pet with given name and user",
            },
            status=status.HTTP_404_NOT_FOUND,
        )

    pet_picture_path = make_s3_path(s3AssetsFolder, str(request.user.id), "pets", str(pet_info.id))

    try:
        image_object = s3Client.get_object(Bucket=s3BucketName, Key=pet_picture_path)
        object_content = image_object["Body"].read()
        return HttpResponse(object_content, content_type="image/jpeg")
    except ClientError as e:
        if e.response["Error"]["Code"] == "NoSuchKey":
            return json_response(
                {
                    "data": {
                        "message": "no pet picture present with current user({}) and pet({})".format(
                            request.user.id, pet_info.name
                        )
                    }
                },
                status=status.HTTP_404_NOT_FOUND,
            )
        return json_response(
            data={
                "error": "failed to fetch pet picture, ({})".format(e.__str__()),
                "message": "unknown error occurred while fetching pet profile picture",
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


def __put_user_pet_picture__(request):
    pet_id = request.data["pet_id"]

    pet_info = Pets.objects.filter(name=pet_id, owner=request.user.id).first()

    if pet_info == None:
        return json_response(
            {"error": "failed to locate pet in user account"},
            status=status.HTTP_404_NOT_FOUND,
        )

    picture = request.FILES["picture"]

    if picture == None:
        return json_response(
            data={
                "error": "file missing in upload",
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    if picture.content_type != "image/jpeg":
        return json_response(
            {
                "error": "incorrect file format uploaded",
                "message": 'only file type of "jpeg" is accepted',
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        upload_path = make_s3_path(s3AssetsFolder, str(request.user.id), "pets", str(pet_info.id))
        # NOTE: if the Key is the same, the object(s) are overwritten
        s3Client.put_object(Bucket=s3BucketName, Body=picture, Key=upload_path)
    except ClientError as e:
        return json_response(
            {
                "error": e.__str__(),
                "message": "failed to upload file",
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    return json_response(
        data={"message": "pet picture has been updated"},
        status=status.HTTP_201_CREATED,
    )


def __delete_user_pet_picture__(request):
    pet_id = request.data["pet_id"]

    pet_info = Pets.objects.filter(name=pet_id, owner=request.user.id).first()

    if pet_info == None:
        return json_response(
            data={
                "error": "failed to locate pet with given name and user",
            },
            status=status.HTTP_404_NOT_FOUND,
        )

    pet_picture_path = make_s3_path(s3AssetsFolder, str(request.user.id), "pets", str(pet_info.id))

    try:
        s3Client.delete_object(Bucket=s3BucketName, Key=pet_picture_path)
        return json_response(
            data={
                "data": {"message": "deleted pet({}) picture successful".format(pet_info.name)},
            },
            status=status.HTTP_200_OK,
        )
    except ClientError as e:
        if e.response["Error"]["Code"] == "NoSuchKey":
            return json_response(
                {
                    "data": {
                        "message": "no pet picture present with current user({}) and pet({})".format(
                            request.user.id, pet_info.name
                        )
                    }
                },
                status=status.HTTP_200_OK,
            )
        return json_response(
            data={
                "error": "failed to fetch pet picture, ({})".format(e.__str__()),
                "message": "unknown error occurred while fetching pet picture",
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

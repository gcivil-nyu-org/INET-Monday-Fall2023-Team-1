import json
import os
from django.http import JsonResponse, HttpResponse
from django.contrib.auth import login, logout
from drf_standardized_errors.handler import exception_handler
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.generics import (
    GenericAPIView,
    ListCreateAPIView,
    RetrieveUpdateDestroyAPIView,
)
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied
from .utils import json_response, make_s3_path
from django.conf import settings
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import Locations
from api.auth_backends import EmailBackend
from .models import Pets, Users, Locations, Jobs, Applications
from .utils import json_response
from api.auth_backends import EmailBackend
from .serializers import (
    RegistrationSerializer,
    UserLocationSerializer,
    UserLoginSerializer,
    PetSerializer,
    JobSerializer,
    ApplicationSerializer,
)

from django.core.mail import EmailMultiAlternatives
from django.dispatch import receiver
from django.template.loader import render_to_string
from django_rest_passwordreset.signals import reset_password_token_created
from django.core.exceptions import ValidationError

from django.views.decorators.csrf import csrf_protect
from django.core.serializers import serialize

import boto3
from botocore.exceptions import ClientError

s3Config = getattr(settings, "S3_CONFIG", None)
s3Client = boto3.client("s3", config=s3Config)
s3AssetsFolder = getattr(settings, "ASSETS_PATH")
s3BucketName = getattr(settings, "AWS_BUCKET_NAME")


def update_job_status(job):
    applications_count = Applications.objects.filter(job=job).count()
    if applications_count < 10:
        job.status = "open"
    elif applications_count > 10:
        job.status = "job_acceptance_pending"
    else:
        job.status = "acceptance_complete"
    job.save()


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
        "user_type": current_user.user_type,
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


# @csrf_protect
# @api_view(["POST", "GET", "OPTIONS", "DELETE"])
# def handle_pet_pictures(request):
#     if not request.user.is_authenticated:
#         return json_response(
#             data={"error": "unauthenticated request. rejected"},
#             status=status.HTTP_401_UNAUTHORIZED,
#         )

#     if s3Config == None:
#         return json_response(
#             data={"error": "failed to upload picture due to internal error"},
#             status=status.HTTP_500_INTERNAL_SERVER_ERROR,
#         )

#     if request.method == "GET":
#         return __get_user_pet_picture__(request)

#     if request.method == "POST":
#         return __put_user_pet_picture__(request)

#     if request.method == "DELETE":
#         return __delete_user_pet_picture__(request)

#     return json_response(
#         {
#             "error": "incorrect request method",
#             "message": 'endpoint only allows only "POST" & "PUT" requests',
#         },


# This class is for the user location(s)
class UserLocationView(APIView):  # type: ignore
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
    def get_user_location_by_id(self, request):
        locations = Locations.objects.filter(id=request.GET["location_id"])
        return self.get_location_record(locations.first())

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
        location_id: str = request.data["id"]

        if location_id == None:
            return json_response(
                {"message": "location_id is missing in request"},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            updated_fields = []
            location = Locations.objects.get(id=location_id)
            if "address" in request.data:
                location.address = request.data["address"]
                updated_fields.append("address")
            if "city" in request.data:
                location.city = request.data["city"]
                updated_fields.append("city")
            if "country" in request.data:
                location.country = request.data["country"]
                updated_fields.append("country")
            if "zipcode" in request.data:
                location.zipcode = request.data["zipcode"]
                updated_fields.append("zipcode")
            if "default_location" in request.data:
                if request.data["default_location"] == True:
                    # unset all other locations as default
                    Locations.objects.filter(user_id=request.user.id).update(default_location=False)
                location.default_location = request.data["default_location"]
                updated_fields.append("default_location")

            # location.save()
            location.save(update_fields=updated_fields)

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
        location_id: str = request.data["id"]

        if location_id == None:
            return json_response(
                {"message": "location_id is missing in request"},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
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

    if request.method == "GET":
        try:
            l = request.GET["location_id"]
            if l != None:
                return json_response(
                    location_view.get_user_location_by_id(request),
                    status=status.HTTP_200_OK,
                    safe=False,
                    include_data=False,
                )
        except:
            locations_list = location_view.get_user_locations(request)
            return json_response(
                locations_list,
                status=status.HTTP_200_OK,
                safe=False,
                include_data=False,
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


class PetListCreateView(ListCreateAPIView):
    queryset = Pets.objects.all()
    serializer_class = PetSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # You can remove this method from PetRetrieveUpdateDeleteView
        return Pets.objects.filter(owner_id=self.request.user.id)  # type: ignore

    def create(self, request, *args, **kwargs):
        request.data["owner_id"] = request.user.id
        if "owner" in request.user.user_type:
            request.data["owner_id"] = request.user.id
            return super().create(request, *args, **kwargs)
        else:
            raise PermissionDenied("You are not allowed to create a pet profile.")


class PetRetrieveUpdateDeleteView(RetrieveUpdateDestroyAPIView):
    queryset = Pets.objects.all()
    serializer_class = PetSerializer
    permission_classes = [IsAuthenticated]


class JobView(APIView):
    permission_classes = [IsAuthenticated]

    def get_all(self):
        return Jobs.objects.all()

    def get_queryset(self):
        return Jobs.objects.filter(user_id=self.request.user.id)

    def get_object(self, job_id):
        try:
            return Jobs.objects.get(id=job_id, user=self.request.user)
        except Jobs.DoesNotExist:
            raise ValidationError("Job not found or you do not have permission to access this job.")

    def get(self, request, *args, **kwargs):
        job_id = self.request.data.get("id")
        if job_id:
            job = self.get_object(job_id)
            serializer = JobSerializer(job)
            return JsonResponse(serializer.data)
        else:
            # print(request.user.user_type)
            if "owner" in request.user.user_type and "sitter" in request.user.user_type:
                queryset_owner = self.get_queryset()
                queryset_sitter = self.get_all()

                serializer_owner = JobSerializer(queryset_owner, many=True)
                serializer_sitter = JobSerializer(queryset_sitter, many=True)

                response_data = {
                    "owner_jobs": serializer_owner.data,
                    "sitter_jobs": serializer_sitter.data,
                }
                # print(response_data)
                return JsonResponse(response_data, safe=False)

            elif "owner" in request.user.user_type:
                queryset_owner = self.get_queryset()
                serializer_owner = JobSerializer(queryset_owner, many=True)
                response_data = {
                    "owner_jobs": serializer_owner.data,
                }
                return JsonResponse(response_data, safe=False)

            elif "sitter" in request.user.user_type:
                queryset_sitter = self.get_all()
                serializer_sitter = JobSerializer(queryset_sitter, many=True)
                response_data = {
                    "sitter_jobs": serializer_sitter.data,
                }
                return JsonResponse(response_data, safe=False)

    def put(self, request, *args, **kwargs):
        # Retrieve the application ID from the URL or request data
        job_id = self.request.data.get("id")
        try:
            job = Jobs.objects.get(id=job_id)
            # print(job.status)
            if job.status == "open":
                job.status = "acceptance_complete"
                job.save()
                return Response({"detail": "Job status updated successfully."})

        except Jobs.DoesNotExist:
            return Response({"detail": "Job not found."}, status=404)
        except Exception as e:
            return Response({"detail": str(e)}, status=500)

    def post(self, request, *args, **kwargs):
        request.data["user_id"] = request.user.id
        if "owner" in request.user.user_type:
            pet_id = self.request.data.get("pet")
            try:
                pet = Pets.objects.get(id=pet_id, owner=self.request.user)
            except Pets.DoesNotExist:
                raise ValidationError("Invalid pet ID or you do not own the pet.")

            # Ensure that the pet owner is the one creating the job
            if pet.owner != self.request.user:
                raise PermissionDenied("You do not have permission to create a job for this pet.")
            # Now, create the job with the specified pet
            serializer = JobSerializer(data=request.data, context={"request": request})
            serializer.is_valid(raise_exception=True)
            serializer.save(user=self.request.user, pet=pet)

            return Response(serializer.data, status=status.HTTP_201_CREATED)
        else:
            raise PermissionDenied("You are not allowed to create a job.")

    def delete(self, request, *args, **kwargs):
        job_id = self.request.data.get("id")
        if job_id:
            job = self.get_object(job_id)
            job.delete()
            return JsonResponse({"detail": "Job deleted successfully."})


class ApplicationView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        job_id = request.query_params.get("job_id")

        if job_id:
            applications = Applications.objects.filter(job_id=job_id)
            serializer = ApplicationSerializer(applications, many=True)
            return JsonResponse(serializer.data, safe=False)

        else:
            user_id = request.user.id
            applications = Applications.objects.filter(user_id=user_id)
            serializer = ApplicationSerializer(applications, many=True)
            return JsonResponse(serializer.data, safe=False)

    def put(self, request, *args, **kwargs):
        # Retrieve the application ID from the URL or request data
        application_id = request.data.get("id")
        # print(application_id)
        try:
            application = Applications.objects.get(id=application_id)
        except Applications.DoesNotExist:
            raise ValidationError("Application not found.")
        job_instance = Jobs.objects.get(id=application.job_id)

        # Check if the user making the request is the owner of the application
        if request.user == job_instance.user:
            # print(request.user)
            # Check if the job status is "open"
            if job_instance.status == "open":
                # Update the application status based on your requirements
                new_status = request.data.get("status")
                if new_status:
                    application.status = new_status
                    application.save()

                    # You can perform additional actions based on the new status if needed
                    # For example, update the job status or send notifications

                    return Response(
                        {"detail": "Application status updated successfully."},
                        status=status.HTTP_200_OK,
                    )
                else:
                    return Response(
                        {"detail": "New status is required for the update."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
            else:
                return Response(
                    {"detail": "The job status must be 'open' to update the application."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        else:
            return Response(
                {"detail": "You do not have permission to update this application."},
                status=status.HTTP_403_FORBIDDEN,
            )

    def post(self, request, *args, **kwargs):
        job_id = self.request.data.get("id")
        # print(request.data)
        # print(job_id)
        try:
            job = Jobs.objects.get(id=job_id)
        except Jobs.DoesNotExist:
            raise ValidationError("Job not found.")

        # Check if the user is allowed to apply for this job
        if "sitter" in request.user.user_type:
            # Check if the job is still available (you can add more checks based on your logic)
            if job.status == "open":
                # Check if the user is not the owner of the job
                if job.user != request.user:
                    # Check if the user has not already applied for this job
                    if not Applications.objects.filter(user=request.user, job=job).exists():
                        # Create an application for the job
                        application_data = {
                            "user": request.user.id,
                            "job": job_id,
                            "status": "rejected",  # You can set an initial status here
                            "details": {},  # You can add more details if needed
                        }
                        application_serializer = ApplicationSerializer(
                            data=application_data, context={"request": self.request}
                        )
                        application_serializer.is_valid(raise_exception=True)
                        application_serializer.save()
                        update_job_status(job)

                        return Response(
                            {"detail": "Application submitted successfully."},
                            status=status.HTTP_201_CREATED,
                        )
                    else:
                        return Response(
                            {"detail": "You have already applied for this job."},
                            status=status.HTTP_400_BAD_REQUEST,
                        )
                else:
                    return Response(
                        {"detail": "You cannot apply to your own job."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
            else:
                return Response(
                    {"detail": "This job is no longer available."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        else:
            return Response(
                {"detail": "Only pet sitters can apply for jobs."},
                status=status.HTTP_403_FORBIDDEN,
            )

import os
import json
from django.http import JsonResponse
from django.contrib.auth import login, logout
from drf_standardized_errors.handler import exception_handler
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.generics import GenericAPIView, ListAPIView
from django.conf import settings
from rest_framework.decorators import api_view

from .utils import json_response
from api.auth_backends import EmailBackend
from .serializers import RegistrationSerializer, UserLoginSerializer, CustomUserSerializer, ApplicationsSerializer

from django.core.mail import EmailMultiAlternatives
from django.dispatch import receiver
from django.template.loader import render_to_string

from django_rest_passwordreset.signals import reset_password_token_created
from .models import Users, Jobs

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
        return _update_user_info_(request)

    if request.method == "DELETE":
        return email_backend.delete_user(request, request.user.email)

    return json_response(
        {"error": "incorrect request method supplied"},
        status=status.HTTP_405_METHOD_NOT_ALLOWED,
    )


def _update_user_info_(request):
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
class UserList(ListAPIView):
    def get(self, request, *args, **kwargs):
        queryset = Users.objects.all()
        try:
            return json_response( data= list(queryset.values()), status=status.HTTP_200_OK
         )
        except Exception as e:
            return json_response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        

class ApplyForJobView(GenericAPIView):
    serializer_class = ApplicationsSerializer

    def post(self, request, job_id):
        print("JobID", job_id)
        print("request", request)
        try:
            job = Jobs.objects.get(id=job_id)
            print("Jobs", job.values())
        except Jobs.DoesNotExist:
            return json_response({"error": "Job not found or you do not have permission to access this job."},
                                 status=status.HTTP_404_NOT_FOUND)
        print("User data",request.data.get('user'))
        user_serializer = CustomUserSerializer(data=request.data.get('user'))
        if not user_serializer.is_valid():
            return json_response(user_serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        application_data = {
            'job_id': job_id,
            'user': request.data.get('user'),
            'status': 'accepted',
            'details': {}  
        }

        application_serializer = self.get_serializer(data=application_data)
        if application_serializer.is_valid():
            application_serializer.save()
            return json_response(application_serializer.data,
                                 status=status.HTTP_201_CREATED)
        else:
            return json_response(application_serializer.errors,
                                 status=status.HTTP_400_BAD_REQUEST)

class GetJobStatus(APIView):

    def get(self, request, job_id):
        if not isinstance(job_id, int):
            return json_response({"error": "Invalid Job Id"}, 
                                 status=status.HTTP_400_BAD_REQUEST)

        try:
            job = Jobs.objects.get(id=job_id)
        except Jobs.DoesNotExist:
            return json_response({"error": "Job does not exist"}, 
                                 status=status.HTTP_404_NOT_FOUND)

        data = {"job_status": job.status}
        return json_response(data, status=status.HTTP_200_OK)
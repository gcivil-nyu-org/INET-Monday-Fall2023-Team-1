import os
from django.http import JsonResponse
from django.contrib.auth import login, logout
from drf_standardized_errors.handler import exception_handler
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.generics import GenericAPIView
from django.views.decorators.csrf import ensure_csrf_cookie
from rest_framework.generics import ListCreateAPIView, RetrieveUpdateDestroyAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .utils import json_response
from django.conf import settings
from rest_framework.decorators import api_view
from api.auth_backends import EmailBackend
from .serializers import RegistrationSerializer, UserLoginSerializer, PetSerializer, JobSerializer
from .models import Pets, Jobs
from django.core.mail import EmailMultiAlternatives
from django.dispatch import receiver
from django.template.loader import render_to_string
from django_rest_passwordreset.signals import reset_password_token_created
from rest_framework.exceptions import PermissionDenied
from django.core.exceptions import ValidationError


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


class PetListCreateView(ListCreateAPIView):
    queryset = Pets.objects.all()
    serializer_class = PetSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Pets.objects.filter(owner_id=self.request.user.id)

    def create(self, request, *args, **kwargs):
        request.data["owner_id"] = request.user.id
        print(request.user.user_type)
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
            queryset = self.get_queryset()
            serializer = JobSerializer(queryset, many=True)
            return JsonResponse(serializer.data, safe=False)

    def post(self, request, *args, **kwargs):
        request.data["user_id"] = request.user.id
        print(request.user.user_type)
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

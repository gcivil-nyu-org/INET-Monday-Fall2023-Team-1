import os
from django.http import HttpResponse
from django.contrib.auth import login, logout
from drf_standardized_errors.handler import exception_handler
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.generics import GenericAPIView
from django.views.decorators.csrf import ensure_csrf_cookie

from .utils import json_response
from api.auth_backends import EmailBackend
from rest_framework.generics import ListCreateAPIView,RetrieveUpdateDestroyAPIView
from rest_framework.permissions import IsAuthenticated
from .serializers import RegistrationSerializer, UserLoginSerializer, PetSerializer,UserProfileEditSerializer,LocationSerializer
from .models import Pets,Locations
from rest_framework.exceptions import ValidationError

from django.core.mail import EmailMultiAlternatives
from django.dispatch import receiver
from django.template.loader import render_to_string
from django.urls import reverse

from django_rest_passwordreset.signals import reset_password_token_created


class UserRegistrationView(GenericAPIView):
    # the next line is to disable CORS for that endpoint/view
    authentication_classes = []
    serializer_class = RegistrationSerializer

    def get_exception_handler(self):
        return exception_handler

    def post(self, request):
        serializer = self.serializer_class(data=request.data)

        if not serializer.is_valid():
            return json_response(
                data=serializer.errors, status=status.HTTP_400_BAD_REQUEST
            )

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
                    data={"message": "Invalid credentials"},
                    status=status.HTTP_401_UNAUTHORIZED,
                )
        return json_response(data=serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@ensure_csrf_cookie
def logout_view(request):
    if not request.user.is_authenticated:
        return json_response(
            {"detail": "You're not logged in."}, status=status.HTTP_400_BAD_REQUEST
        )

    logout(request)
    return json_response(
        {"detail": "Successfully logged out."}, status=status.HTTP_200_OK
    )


@ensure_csrf_cookie
def session_view(request):
    if not request.user.is_authenticated:
        return json_response(
            {"isAuthenticated": False}, status=status.HTTP_401_UNAUTHORIZED
        )

    return json_response({"isAuthenticated": True})


@ensure_csrf_cookie
def whoami_view(request):
    if not request.user.is_authenticated:
        return json_response(
            {"isAuthenticated": False}, status=status.HTTP_401_UNAUTHORIZED
        )

    return json_response({"email": request.user.email}, status=status.HTTP_200_OK)


class UserLoginView(APIView):
    def post(self, request):
        serializer = UserLoginSerializer(data=request.data)
        if serializer.is_valid():
            print(serializer.data)
            email = serializer.validated_data["email"]
            password = serializer.validated_data["password"]
            email_backend = EmailBackend()
            user = email_backend.authenticate(request, email=email, password=password)
            if user is not None:
                login(request, user)
                return Response({"message": "Login successful"}, status=status.HTTP_200_OK)
            else:
                print(f"Invalid login attempt: {serializer.validated_data['email']}")
                return Response(
                    {"message": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED
                )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UserProfileEditView(RetrieveUpdateDestroyAPIView):
    serializer_class = UserProfileEditSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user
    
    def perform_update(self, serializer):
        location_data = self.request.data.get("location", [])
        
        for location_item in location_data:
            location_id = location_item.get("id")
            user_id = self.request.user.id

            # Check if a location with the same user_id already exists
            existing_location = Locations.objects.filter(user=user_id).first()
            is_pet_owner = 'Pet Owner' in serializer.validated_data.get('user_type', [])

            if is_pet_owner:
                # Check if the location is not in New York City
                if location_item.get("city") != "New York City":
                    raise ValidationError("Pet owners must have a location in New York")  # Use ValidationError from rest_framework.exceptions
            
            location_id = location_item.get("id")

            if location_id:
                # Update existing location
                location = Locations.objects.get(id=location_id, user=user_id)
                location_serializer = LocationSerializer(location, data=location_item, partial=True)
            else:
                if existing_location:
                    # Update existing location with the provided data
                    location_serializer = LocationSerializer(existing_location, data=location_item, partial=True)
                else:
                    # Create a new location
                    location_item["user"] = user_id 
                    location_serializer = LocationSerializer(data=location_item)

            if location_serializer.is_valid():
                location_serializer.save()
            else:
                raise serializers.ValidationError(location_serializer.errors)

        # Continue with the user profile update
        serializer.save()

class PetListCreateView(ListCreateAPIView):
    queryset = Pets.objects.all()
    serializer_class = PetSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Filter pets based on the user's ID
        return Pets.objects.filter(owner_id=self.request.user.id)

    def create(self, request, *args, **kwargs):
        # Set the owner to the authenticated user
        request.data["owner_id"] = request.user.id
        return super().create(request, *args, **kwargs)

class PetRetrieveUpdateDeleteView(RetrieveUpdateDestroyAPIView):
    queryset = Pets.objects.all()
    serializer_class = PetSerializer
    permission_classes = [IsAuthenticated]
    
def index(req):
    return HttpResponse("Hello, world", status=200)


@receiver(reset_password_token_created)
def password_reset_token_created(
    sender, instance, reset_password_token, *args, **kwargs
):
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
    email_plaintext_message = render_to_string(
        "email/password_reset_email.txt", context
    )

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

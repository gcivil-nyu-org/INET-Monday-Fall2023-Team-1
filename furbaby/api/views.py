from django.http import HttpResponse
from rest_framework.generics import CreateAPIView
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import login
from .serializers import UserRegistrationSerializer, UserLoginSerializer
from api.auth_backends import EmailBackend


class UserRegistrationView(CreateAPIView):
    serializer_class = UserRegistrationSerializer


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
                return Response(
                    {"message": "Login successful"}, status=status.HTTP_200_OK
                )
            else:
                print(f"Invalid login attempt: {serializer.validated_data['email']}")
                return Response(
                    {"message": "Invalid credentials"},
                    status=status.HTTP_401_UNAUTHORIZED,
                )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


def index(req):
    return HttpResponse("Hello, world", status=200)

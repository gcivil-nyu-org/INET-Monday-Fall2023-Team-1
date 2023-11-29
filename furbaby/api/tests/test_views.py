import json

from django.test import TestCase
from django.urls import reverse
from django_rest_passwordreset.signals import reset_password_token_created
from rest_framework import status
from ..models import Users
from rest_framework.test import APIClient
from django.core import mail


class UserRegistrationViewTest(TestCase):
    def test_user_registration_invalid_email_owner(self):
        client = APIClient()
        url = reverse("user-registration")
        data = {"email": "invalid_email", "password": "test1231", "user_type": ["owner"]}
        response = client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_user_registration_invalid_email_sitter(self):
        client = APIClient()
        url = reverse("user-registration")
        data = {"email": "invalid_email", "password": "test1231", "user_type": ["sitter"]}
        response = client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_user_registration_invalid_password(self):
        client = APIClient()
        url = reverse("user-registration")
        data = {"email": "test@example.com", "password": "short", "user_type": ["owner"]}
        response = client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_user_registration_no_user_type_selected(self):
        client = APIClient()
        url = reverse("user-registration")
        data = {"email": "test@example.com", "password": "test1231", "user_type": []}
        response = client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_user_registration_valid_email_owner(self):
        client = APIClient()
        url = reverse("user-registration")
        data = {"email": "valid@example.com", "password": "test1231", "user_type": ["owner"]}
        response = client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Users.objects.count(), 1)
        self.assertEqual(Users.objects.get().email, "valid@example.com")

    def test_user_registration_valid_email_sitter(self):
        client = APIClient()
        url = reverse("user-registration")
        data = {"email": "valid@nyu.edu", "password": "test1231", "user_type": ["sitter"]}
        response = client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Users.objects.count(), 1)
        self.assertEqual(Users.objects.get().email, "valid@nyu.edu")


class UserLoginViewTest(TestCase):
    def setUp(self):
        client = APIClient()
        url = reverse("user-registration")
        data = {"email": "test@example.com", "password": "test1234", "user_type": ["owner"]}
        response = client.post(url, data, format="json")

    def test_user_login_successful(self):
        client = APIClient()
        url = reverse("user-login")
        data = {"email": "test@example.com", "password": "test1234"}
        response = client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_user_login_invalid_credentials(self):
        client = APIClient()
        url = reverse("user-login")
        data = {"email": "test@example.com", "password": "wrong_password"}
        response = client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class LogoutViewTest(TestCase):
    def setUp(self):
        client = APIClient()
        url = reverse("user-registration")
        data = {"email": "test@example.com", "password": "test1234", "user_type": ["owner"]}
        _ = client.post(url, data, format="json")

    def test_user_logout_successful(self):
        client = APIClient()
        url_login = reverse("user-login")
        data_login = {"email": "test@example.com", "password": "test1234"}
        _ = client.post(url_login, data_login, format="json")
        url = reverse("user-logout")
        response = client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)


class SessionViewTest(TestCase):
    def setUp(self):
        client = APIClient()
        url = reverse("user-registration")
        data = {"email": "test@example.com", "password": "test1234", "user_type": ["owner"]}
        _ = client.post(url, data, format="json")

    def test_session_view_authenticated_user(self):
        client = APIClient()
        url_login = reverse("user-login")
        data_login = {"email": "test@example.com", "password": "test1234"}
        _ = client.post(url_login, data_login, format="json")
        url = reverse("user-session-view")
        response = client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_session_view_unauthenticated_user(self):
        client = APIClient()
        url = reverse("user-session-view")
        response = client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class WhoAmIViewTest(TestCase):
    def setUp(self):
        client = APIClient()
        url = reverse("user-registration")
        data = {"email": "test@example.com", "password": "test1234", "user_type": ["owner"]}
        _ = client.post(url, data, format="json")

    def test_whoami_view_authenticated_user(self):
        client = APIClient()
        url_login = reverse("user-login")
        data_login = {"email": "test@example.com", "password": "test1234"}
        _ = client.post(url_login, data_login, format="json")
        url = reverse("user-whoami")
        response = client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = json.loads(response.content)
        self.assertEqual(data["data"]["email"], "test@example.com")

    def test_whoami_view_unauthenticated_user(self):
        client = APIClient()
        url = reverse("user-whoami")
        response = client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

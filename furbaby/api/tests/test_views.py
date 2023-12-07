import json
import uuid
from datetime import datetime, timedelta

from django.contrib.auth.hashers import make_password
from django.core.exceptions import ValidationError
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from django_rest_passwordreset.signals import reset_password_token_created
from rest_framework import status
from ..models import Users, Locations, Pets, Applications, Jobs
from rest_framework.test import APIClient
from django.core import mail


def get_current_date_time(delta):
    now = datetime.now(tz=timezone.utc) + timedelta(hours=delta)
    year = now.year
    month = str(now.month).zfill(2)
    day = str(now.day).zfill(2)
    hour = str(now.hour).zfill(2)
    minute = str(now.minute).zfill(2)

    return f"{year}-{month}-{day}T{hour}:{minute}"


class UserRegistrationViewTest(TestCase):
    def test_user_registration_invalid_email_owner(self):
        client = APIClient()
        url = reverse("user-registration")
        data = {
            "email": "invalid_email",
            "password": "test1231",
            "user_type": ["owner"],
        }
        response = client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_user_registration_invalid_email_sitter(self):
        client = APIClient()
        url = reverse("user-registration")
        data = {
            "email": "invalid_email",
            "password": "test1231",
            "user_type": ["sitter"],
        }
        response = client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_user_registration_invalid_password(self):
        client = APIClient()
        url = reverse("user-registration")
        data = {
            "email": "test@example.com",
            "password": "short",
            "user_type": ["owner"],
        }
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
        data = {
            "email": "valid@example.com",
            "password": "test1231",
            "user_type": ["owner"],
        }
        response = client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Users.objects.count(), 1)
        self.assertEqual(Users.objects.get().email, "valid@example.com")

    def test_user_registration_valid_email_sitter(self):
        client = APIClient()
        url = reverse("user-registration")
        data = {
            "email": "valid@nyu.edu",
            "password": "test1231",
            "user_type": ["sitter"],
        }
        response = client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Users.objects.count(), 1)
        self.assertEqual(Users.objects.get().email, "valid@nyu.edu")


class UserLoginViewTest(TestCase):
    def setUp(self):
        client = APIClient()
        url = reverse("user-registration")
        data = {
            "email": "test@example.com",
            "password": "test1234",
            "user_type": ["owner"],
        }
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
        data = {
            "email": "test@example.com",
            "password": "test1234",
            "user_type": ["owner"],
        }
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
        data = {
            "email": "test@example.com",
            "password": "test1234",
            "user_type": ["owner"],
        }
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


class UserViewTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.url = reverse("user-registration")

    def test_user_not_authenticated(self):
        url = reverse("user-info")
        response = self.client.get(url)
        data = json.loads(response.content)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertFalse(data["data"]["isAuthenticated"])

    def test_user_update_info_not_authenticated(self):
        url = reverse("user-info")
        response = self.client.put(url)
        data = json.loads(response.content)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertFalse(data["data"]["isAuthenticated"])

    def test_user_update_info_successful(self):
        user = Users.objects.create(
            email="test_owner_sitter@nyu.edu",
            password=make_password("testpasswordownersitter"),
            first_name="John",
            last_name="Doe",
            user_type=["owner", "sitter"],
            username="test_owner_sitter@nyu.edu",
        )
        url_login = reverse("user-login")
        data_login = {"email": user.email, "password": "testpasswordownersitter"}
        _ = self.client.post(url_login, data_login, format="json")
        url = reverse("user-info")
        data = {
            "first_name": "Jane",
            "last_name": "Doe",
            "user_type": ["owner", "sitter"],
            "date_of_birth": "1990-01-01",
            "about": "5 years",
            "qualifications": "None",
            "phone_number": "1234567890",
        }
        response = self.client.put(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = json.loads(response.content)
        self.assertEqual(data["data"]["first_name"], "Jane")
        self.assertEqual(data["data"]["last_name"], "Doe")

    def test_user_get_info_successful(self):
        user = Users.objects.create(
            email="test_owner_sitter@nyu.edu",
            password=make_password("testpasswordownersitter"),
            first_name="John",
            last_name="Doe",
            user_type=["owner", "sitter"],
            username="test_owner_sitter@nyu.edu",
        )
        url_login = reverse("user-login")
        data_login = {"email": user.email, "password": "testpasswordownersitter"}
        _ = self.client.post(url_login, data_login, format="json")
        url = reverse("user-info")
        response = self.client.get(url)
        data = json.loads(response.content)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(data["data"]["email"], user.email)
        self.assertEqual(data["data"]["first_name"], user.first_name)


class JobViewTest(TestCase):
    def setUp(self):
        self.user_owner = Users.objects.create(
            email="test_owner_job@gmail.com",
            password=make_password("testpassword"),
            user_type=["owner"],
            username="test_owner_job@gmail.com",
        )
        self.user_sitter = Users.objects.create(
            email="test_sitter_job@nyu.edu",
            password=make_password("testpasswordsitter"),
            user_type=["sitter"],
            username="test_sitter_job@nyu.edu",
        )
        self.user_owner_sitter = Users.objects.create(
            email="test_owner_sitter_job@nyu.edu",
            password=make_password("testpasswordownersitter"),
            user_type=["owner", "sitter"],
            username="test_owner_sitter_job@nyu.edu",
        )
        self.location = Locations.objects.create(
            user=self.user_owner,
            address="123 Main St",
            city="New York City",
            country="USA",
            zipcode="12345",
            default_location=True,
        )
        self.pet = Pets.objects.create(
            owner=self.user_owner,
            name="Sunny",
            species="Dog",
            breed="Doberman",
            color="Brown",
            height="3",
            weight="35",
            chip_number="A007",
            health_requirements="Not applicable",
        )

    def test_createJobSuccessfully(self):
        client = APIClient()
        url_login = reverse("user-login")
        data_login = {"email": "test_owner_job@gmail.com", "password": "testpassword"}
        _ = client.post(url_login, data_login, format="json")
        url = reverse("custom-job-view")
        data = {
            "pet": self.pet.id,
            "location": self.location.id,
            "user": self.user_owner.id,
            "pay": "155",
            "start": datetime.now() + timedelta(hours=5),
            "end": datetime.now() + timedelta(hours=20),
            "status": "open",
        }
        response = client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Jobs.objects.count(), 1)
        data = json.loads(response.content)
        job = Jobs.objects.get(id=data["id"])
        self.assertEqual(job.pay, 155)

    def test_fetch_all_jobs_sitter_feed(self):
        job = Jobs.objects.create(
            pet=self.pet,
            location=self.location,
            user=self.user_owner,
            pay="999",
            start=get_current_date_time(5),
            end=get_current_date_time(15),
            status="open",
        )
        client = APIClient()
        url_login = reverse("user-login")
        data_login = {"email": self.user_sitter.email, "password": "testpasswordsitter"}
        _ = client.post(url_login, data_login, format="json")
        url = reverse("custom-job-view")
        data = {
            "user": self.user_sitter,
        }
        response = client.get(url, data, format="json")
        data = json.loads(response.content)
        self.assertEqual(len(data["sitter_jobs"]), 1)
        self.assertEqual(data["sitter_jobs"][0]["id"], str(job.id))

    def test_fetch_all_jobs_owner(self):
        job = Jobs.objects.create(
            pet=self.pet,
            location=self.location,
            user=self.user_owner,
            pay="525",
            start=get_current_date_time(5),
            end=get_current_date_time(15),
            status="open",
        )
        client = APIClient()
        url_login = reverse("user-login")
        data_login = {"email": self.user_owner.email, "password": "testpassword"}
        _ = client.post(url_login, data_login, format="json")
        url = reverse("custom-job-view")
        data = {
            "user": self.user_owner,
        }
        response = client.get(url, data, format="json")
        data = json.loads(response.content)
        self.assertEqual(len(data["owner_jobs"]), 1)
        self.assertEqual(data["owner_jobs"][0]["id"], str(job.id))

    def test_fetch_all_jobs_feed_except_own_jobs(self):
        job = Jobs.objects.create(
            pet=self.pet,
            location=self.location,
            user=self.user_owner_sitter,
            pay="525",
            start=get_current_date_time(5),
            end=get_current_date_time(15),
            status="open",
        )
        client = APIClient()
        url_login = reverse("user-login")
        data_login = {"email": self.user_owner_sitter.email, "password": "testpasswordownersitter"}
        _ = client.post(url_login, data_login, format="json")
        url = reverse("custom-job-view")
        data = {
            "user": self.user_owner_sitter,
        }
        response = client.get(url, data, format="json")
        data = json.loads(response.content)
        self.assertEqual(len(data["owner_jobs"]), 1)
        self.assertEqual(len(data["sitter_jobs"]), 0)
        self.assertEqual(data["owner_jobs"][0]["id"], str(job.id))

    def test_job_update_status_invalid_job_id(self):
        client = APIClient()
        url_login = reverse("user-login")
        data_login = {"email": self.user_owner.email, "password": "testpassword"}
        _ = client.post(url_login, data_login, format="json")
        url = reverse("custom-job-view")
        data = {
            "id": uuid.uuid4(),
            "status": "cancelled",
        }
        response = client.put(url, data, format="json")
        data = json.loads(response.content)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(data["detail"], "Job not found.")


class WhoAmIViewTest(TestCase):
    def setUp(self):
        client = APIClient()
        url = reverse("user-registration")
        data = {
            "email": "test@example.com",
            "password": "test1234",
            "user_type": ["owner"],
        }
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


class ApplicationViewTest(TestCase):
    def setUp(self):
        self.user_owner = Users.objects.create(
            email="test_owner_job@gmail.com",
            password=make_password("testpassword"),
            user_type=["owner"],
            username="test_owner_job@gmail.com",
        )
        self.user_sitter = Users.objects.create(
            email="test_sitter_job@nyu.edu",
            password=make_password("testpasswordsitter"),
            user_type=["sitter"],
            username="test_sitter_job@nyu.edu",
        )
        self.user_owner_sitter = Users.objects.create(
            email="test_owner_sitter_job@nyu.edu",
            password=make_password("testpasswordownersitter"),
            user_type=["owner", "sitter"],
            username="test_owner_sitter_job@nyu.edu",
        )
        self.location = Locations.objects.create(
            user=self.user_owner,
            address="123 Main St",
            city="New York City",
            country="USA",
            zipcode="12345",
            default_location=True,
        )
        self.pet = Pets.objects.create(
            owner=self.user_owner,
            name="Sunny",
            species="Dog",
            breed="Doberman",
            color="Brown",
            height="3",
            weight="35",
            chip_number="A007",
            health_requirements="Not applicable",
        )
        self.job = Jobs.objects.create(
            pet=self.pet,
            location=self.location,
            user=self.user_owner,
            pay="525",
            start=get_current_date_time(5),
            end=get_current_date_time(15),
            status="open",
        )
        self.pet2 = Pets.objects.create(
            owner=self.user_owner_sitter,
            name="Julie",
            species="Dog",
            breed="German Shepherd",
            color="Gold",
            height="3",
            weight="30",
            chip_number="A007",
            health_requirements="Not applicable",
        )

    def test_application_invalid_job_id(self):
        client = APIClient()
        url_login = reverse("user-login")
        data_login = {"email": self.user_owner_sitter.email, "password": "testpasswordownersitter"}
        _ = client.post(url_login, data_login, format="json")
        url = reverse("application-list")
        data = {
            "id": uuid.uuid4(),
        }
        with self.assertRaises(ValidationError) as context_manager:
            _ = client.post(url, data, format="json")
        self.assertEqual(context_manager.exception.message, "Job not found.")

    def test_application_create_by_owner(self):
        client = APIClient()
        url_login = reverse("user-login")
        data_login = {"email": self.user_owner.email, "password": "testpassword"}
        _ = client.post(url_login, data_login, format="json")
        url = reverse("application-list")
        data = {
            "id": self.job.id,
        }
        response = client.post(url, data, format="json")
        data = json.loads(response.content)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(data["detail"], "Only pet sitters can apply for jobs.")

    def test_application_create_by_sitter_status_not_open(self):
        client = APIClient()
        closed_job = Jobs.objects.create(
            pet=self.pet2,
            location=self.location,
            user=self.user_owner_sitter,
            pay="525",
            start=get_current_date_time(10),
            end=get_current_date_time(20),
            status="cancelled",
        )
        url_login = reverse("user-login")
        data_login = {"email": self.user_sitter.email, "password": "testpasswordsitter"}
        _ = client.post(url_login, data_login, format="json")
        url = reverse("application-list")
        data = {
            "id": closed_job.id,
        }
        response = client.post(url, data, format="json")
        data = json.loads(response.content)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(data["detail"], "This job is no longer available.")

    def test_application_create_by_owner_for_own_job(self):
        client = APIClient()
        own_job = Jobs.objects.create(
            pet=self.pet2,
            location=self.location,
            user=self.user_owner_sitter,
            pay="525",
            start=get_current_date_time(10),
            end=get_current_date_time(20),
            status="open",
        )
        url_login = reverse("user-login")
        data_login = {"email": self.user_owner_sitter.email, "password": "testpasswordownersitter"}
        _ = client.post(url_login, data_login, format="json")
        url = reverse("application-list")
        data = {
            "id": own_job.id,
        }
        response = client.post(url, data, format="json")
        data = json.loads(response.content)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(data["detail"], "You cannot apply to your own job.")

    def test_application_submitted_twice_by_sitter(self):
        client = APIClient()
        url_login = reverse("user-login")
        data_login = {"email": self.user_sitter.email, "password": "testpasswordsitter"}
        _ = client.post(url_login, data_login, format="json")
        url = reverse("application-list")
        data = {
            "id": self.job.id,
        }
        _ = client.post(url, data, format="json")
        response = client.post(url, data, format="json")
        data = json.loads(response.content)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(data["detail"], "You have already applied for this job.")

    def test_application_created_successfully(self):
        client = APIClient()
        url_login = reverse("user-login")
        data_login = {"email": self.user_sitter.email, "password": "testpasswordsitter"}
        _ = client.post(url_login, data_login, format="json")
        url = reverse("application-list")
        data = {
            "id": self.job.id,
        }
        response = client.post(url, data, format="json")
        data = json.loads(response.content)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(data["detail"], "Application submitted successfully.")
        application = Applications.objects.get()
        self.assertEqual(application.job.id, self.job.id)
        self.assertEqual(application.user.id, self.user_sitter.id)

    def test_application_update_invalid_application_id(self):
        client = APIClient()
        url_login = reverse("user-login")
        data_login = {"email": self.user_owner_sitter.email, "password": "testpasswordownersitter"}
        _ = client.post(url_login, data_login, format="json")
        url = reverse("application-list")
        data = {
            "id": uuid.uuid4(),
            "status": "accepted",
        }
        with self.assertRaises(ValidationError) as context_manager:
            _ = client.put(url, data, format="json")
        self.assertEqual(context_manager.exception.message, "Application not found.")

    def test_application_update_by_non_owner(self):
        client = APIClient()
        application = Applications.objects.create(
            user=self.user_sitter,
            job=self.job,
            status="rejected",
            details={},
        )
        url_login = reverse("user-login")
        data_login = {"email": self.user_sitter.email, "password": "testpasswordsitter"}
        _ = client.post(url_login, data_login, format="json")
        url = reverse("application-list")
        data = {
            "id": application.id,
            "status": "accepted",
        }
        response = client.put(url, data, format="json")
        data = json.loads(response.content)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(data["detail"], "You do not have permission to update this application.")

    def test_application_update_of_closed_job(self):
        client = APIClient()

        temp_job = Jobs.objects.create(
            pet=self.pet2,
            location=self.location,
            user=self.user_owner_sitter,
            pay="525",
            start=get_current_date_time(10),
            end=get_current_date_time(20),
            status="open",
        )

        application = Applications.objects.create(
            user=self.user_sitter,
            job=temp_job,
            status="rejected",
            details={},
        )

        temp_job.status = "cancelled"
        temp_job.save()

        url_login = reverse("user-login")
        data_login = {"email": self.user_owner_sitter.email, "password": "testpasswordownersitter"}
        _ = client.post(url_login, data_login, format="json")
        url = reverse("application-list")
        data = {
            "id": application.id,
            "status": "accepted",
        }
        response = client.put(url, data, format="json")
        data = json.loads(response.content)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(data["detail"], "The job status must be 'open' to update the application.")

    def test_application_update_with_no_new_status(self):
        client = APIClient()
        application = Applications.objects.create(
            user=self.user_sitter,
            job=self.job,
            status="rejected",
            details={},
        )
        url_login = reverse("user-login")
        data_login = {"email": self.user_owner.email, "password": "testpassword"}
        _ = client.post(url_login, data_login, format="json")
        url = reverse("application-list")
        data = {
            "id": application.id,
        }
        response = client.put(url, data, format="json")
        data = json.loads(response.content)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(data["detail"], "New status is required for the update.")

    def test_application_update_successfully(self):
        client = APIClient()
        application = Applications.objects.create(
            user=self.user_sitter,
            job=self.job,
            status="rejected",
            details={},
        )
        url_login = reverse("user-login")
        data_login = {"email": self.user_owner.email, "password": "testpassword"}
        _ = client.post(url_login, data_login, format="json")
        url = reverse("application-list")
        data = {"id": application.id, "status": "accepted"}
        response = client.put(url, data, format="json")
        data = json.loads(response.content)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(data["detail"], "Application status updated successfully.")
        updated_application = Applications.objects.get(id=application.id)
        self.assertEqual(updated_application.status, "accepted")

    def test_application_get_applications_for_one_job(self):
        client = APIClient()
        application1 = Applications.objects.create(
            user=self.user_sitter,
            job=self.job,
            status="rejected",
            details={},
        )
        application2 = Applications.objects.create(
            user=self.user_owner_sitter,
            job=self.job,
            status="rejected",
            details={},
        )
        url_login = reverse("user-login")
        data_login = {"email": self.user_owner.email, "password": "testpassword"}
        _ = client.post(url_login, data_login, format="json")
        url = reverse("application-list")
        data = {
            "job_id": self.job.id,
        }
        response = client.get(url, data, format="json")
        data = json.loads(response.content)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(data), 2)

    def test_application_get_applications_for_one_sitter(self):
        client = APIClient()
        job2 = Jobs.objects.create(
            pet=self.pet,
            location=self.location,
            user=self.user_owner,
            pay="525",
            start=get_current_date_time(3),
            end=get_current_date_time(12),
            status="open",
        )
        application1 = Applications.objects.create(
            user=self.user_sitter,
            job=self.job,
            status="rejected",
            details={},
        )
        application2 = Applications.objects.create(
            user=self.user_sitter,
            job=job2,
            status="rejected",
            details={},
        )
        url_login = reverse("user-login")
        data_login = {"email": self.user_sitter.email, "password": "testpasswordsitter"}
        _ = client.post(url_login, data_login, format="json")
        url = reverse("application-list")
        data = {}
        response = client.get(url, data, format="json")
        data = json.loads(response.content)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(data), 2)


class LocationViewTest(TestCase):
    def setUp(self):
        self.user_owner = Users.objects.create(
            email="test_owner_job@gmail.com",
            password=make_password("testpassword"),
            user_type=["owner"],
            username="test_owner_job@gmail.com",
        )
        self.user_sitter = Users.objects.create(
            email="test_sitter_job@nyu.edu",
            password=make_password("testpasswordsitter"),
            user_type=["sitter"],
            username="test_sitter_job@nyu.edu",
        )
        self.user_owner_sitter = Users.objects.create(
            email="test_owner_sitter_job@nyu.edu",
            password=make_password("testpasswordownersitter"),
            user_type=["owner", "sitter"],
            username="test_owner_sitter_job@nyu.edu",
        )

    def test_add_new_location_successful(self):
        client = APIClient()
        url_login = reverse("user-login")
        data_login = {"email": self.user_owner.email, "password": "testpassword"}
        _ = client.post(url_login, data_login, format="json")
        url = reverse("user-location")
        data = {
            "address": "123 Main St",
            "city": "New York City",
            "country": "USA",
            "zipcode": "12345",
            "default_location": True,
        }
        response = client.post(url, data, format="json")
        data = json.loads(response.content)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        location = Locations.objects.get(user=self.user_owner)
        self.assertEqual(location.address, "123 Main St")

    def test_add_new_location_invalid_city(self):
        client = APIClient()
        url_login = reverse("user-login")
        data_login = {"email": self.user_owner.email, "password": "testpassword"}
        _ = client.post(url_login, data_login, format="json")
        url = reverse("user-location")
        data = {
            "address": "123 Main St",
            "city": "Boston",
            "country": "USA",
            "zipcode": "12345",
            "default_location": True,
        }
        response = client.post(url, data, format="json")
        data = json.loads(response.content)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            data["data"]["non_field_errors"][0], "Users must be located in New York City/NYC"
        )

    def test_get_location_by_id(self):
        location = Locations.objects.create(
            user=self.user_owner,
            address="123 Main St",
            city="New York City",
            country="USA",
            zipcode="12345",
            default_location=True,
        )
        location2 = Locations.objects.create(
            user=self.user_owner,
            address="456 Main St",
            city="New York City",
            country="USA",
            zipcode="12345",
            default_location=False,
        )
        client = APIClient()
        url_login = reverse("user-login")
        data_login = {"email": self.user_owner.email, "password": "testpassword"}
        _ = client.post(url_login, data_login, format="json")
        url = reverse("user-location")
        data = {
            "location_id": location.id,
        }
        response = client.get(url, data, format="json")
        data = json.loads(response.content)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(data["address"], "123 Main St")

    def test_get_location_list(self):
        location = Locations.objects.create(
            user=self.user_owner,
            address="123 Main St",
            city="New York City",
            country="USA",
            zipcode="12345",
            default_location=True,
        )
        location2 = Locations.objects.create(
            user=self.user_owner,
            address="456 Main St",
            city="New York City",
            country="USA",
            zipcode="12345",
            default_location=False,
        )
        client = APIClient()
        url_login = reverse("user-login")
        data_login = {"email": self.user_owner.email, "password": "testpassword"}
        _ = client.post(url_login, data_login, format="json")
        url = reverse("user-location")
        data = {}
        response = client.get(url, data, format="json")
        data = json.loads(response.content)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(data), 2)

    def test_location_update_missing_location_id(self):
        client = APIClient()
        location = Locations.objects.create(
            user=self.user_owner,
            address="123 Main St",
            city="New York City",
            country="USA",
            zipcode="12345",
            default_location=True,
        )
        url_login = reverse("user-login")
        data_login = {"email": self.user_owner.email, "password": "testpassword"}
        _ = client.post(url_login, data_login, format="json")
        url = reverse("user-location")
        data = {
            "id": None,
            "address": "456 Main St",
            "city": "New York City",
            "country": "USA",
            "zipcode": "12345",
            "default_location": True,
        }
        response = client.put(url, data, format="json")
        data = json.loads(response.content)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(data["data"]["message"], "location_id is missing in request")

    def test_location_update_location_does_not_exist(self):
        client = APIClient()
        location = Locations.objects.create(
            user=self.user_owner,
            address="123 Main St",
            city="New York City",
            country="USA",
            zipcode="12345",
            default_location=True,
        )
        url_login = reverse("user-login")
        data_login = {"email": self.user_owner.email, "password": "testpassword"}
        _ = client.post(url_login, data_login, format="json")
        url = reverse("user-location")
        data = {
            "id": uuid.uuid4(),
            "address": "456 Main St",
            "city": "New York City",
            "country": "USA",
            "zipcode": "12345",
            "default_location": True,
        }
        response = client.put(url, data, format="json")
        data = json.loads(response.content)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(data["data"]["error"], "location not found for user")

    def test_location_update_successful(self):
        client = APIClient()
        location = Locations.objects.create(
            user=self.user_owner,
            address="123 Main St",
            city="New York City",
            country="USA",
            zipcode="12345",
            default_location=True,
        )
        url_login = reverse("user-login")
        data_login = {"email": self.user_owner.email, "password": "testpassword"}
        _ = client.post(url_login, data_login, format="json")
        url = reverse("user-location")
        data = {
            "id": location.id,
            "address": "456 Main St",
            "city": "NYC",
            "country": "US",
            "zipcode": "45678",
            "default_location": True,
        }
        response = client.put(url, data, format="json")
        data = json.loads(response.content)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        location = Locations.objects.get(id=location.id)
        self.assertEqual(location.address, "456 Main St")

    def test_location_delete_missing_location_id(self):
        client = APIClient()
        location = Locations.objects.create(
            user=self.user_owner,
            address="123 Main St",
            city="New York City",
            country="USA",
            zipcode="12345",
            default_location=True,
        )
        url_login = reverse("user-login")
        data_login = {"email": self.user_owner.email, "password": "testpassword"}
        _ = client.post(url_login, data_login, format="json")
        url = reverse("user-location")
        data = {
            "id": None,
        }
        response = client.delete(url, data, format="json")
        data = json.loads(response.content)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(data["data"]["message"], "location_id is missing in request")

    def test_location_delete_location_does_not_exist(self):
        client = APIClient()
        location = Locations.objects.create(
            user=self.user_owner,
            address="123 Main St",
            city="New York City",
            country="USA",
            zipcode="12345",
            default_location=True,
        )
        url_login = reverse("user-login")
        data_login = {"email": self.user_owner.email, "password": "testpassword"}
        _ = client.post(url_login, data_login, format="json")
        url = reverse("user-location")
        data = {
            "id": uuid.uuid4(),
        }
        response = client.delete(url, data, format="json")
        data = json.loads(response.content)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(data["data"]["error"], "location not found for user")

    def test_location_delete_successful(self):
        client = APIClient()
        location = Locations.objects.create(
            user=self.user_owner,
            address="123 Main St",
            city="New York City",
            country="US",
            zipcode="12345",
            default_location=True,
        )
        location2 = Locations.objects.create(
            user=self.user_owner,
            address="456 Main St",
            city="NYC",
            country="US",
            zipcode="12345",
            default_location=False,
        )
        url_login = reverse("user-login")
        data_login = {"email": self.user_owner.email, "password": "testpassword"}
        _ = client.post(url_login, data_login, format="json")
        url = reverse("user-location")
        data = {
            "id": location.id,
        }
        response = client.delete(url, data, format="json")
        data = json.loads(response.content)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(data["data"]["message"], "location deleted successfully")
        self.assertEqual(Locations.objects.count(), 1)
        self.assertEqual(Locations.objects.get().address, "456 Main St")

from django.test import TestCase
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from ..models import *


User = get_user_model()


class ModelTests(TestCase):
    def setUp(self):
        # Create a test user
        self.user = Users.objects.create(
            email="test@example.com", password="test1234", user_type=["owner"]
        )

    def test_create_location(self):
        location = Locations.objects.create(
            user=self.user,
            address="123 Main St",
            city="City",
            country="Country",
            zipcode="12345",
            default_location=False,
        )
        self.assertEqual(Locations.objects.count(), 1)
        self.assertEqual(location.address, "123 Main St")

    def test_create_pet(self):
        pet = Pets.objects.create(
            owner=self.user, name="Fluffy", breed="Golden Retriever", weight="50", pictures=["pic"]
        )
        self.assertEqual(Pets.objects.count(), 1)
        self.assertEqual(pet.name, "Fluffy")

    def test_create_job(self):
        location = Locations.objects.create(
            user=self.user,
            address="123 Main St",
            city="City",
            country="Country",
            zipcode="12345",
            default_location=False,
        )
        pet = Pets.objects.create(
            owner=self.user, name="Fluffy", breed="Golden Retriever", weight="50", pictures=["pic"]
        )
        job = Jobs.objects.create(
            pet=pet,
            user=self.user,
            location=location,
            status="open",
            pay=100.00,
            start="2023-01-01T00:00:00Z",
            end="2023-01-02T00:00:00Z",
        )
        self.assertEqual(Jobs.objects.count(), 1)
        self.assertEqual(job.status, "open")

    def test_create_application(self):
        location = Locations.objects.create(
            user=self.user,
            address="123 Main St",
            city="City",
            country="Country",
            zipcode="12345",
            default_location=False,
        )
        pet = Pets.objects.create(
            owner=self.user, name="Fluffy", breed="Golden Retriever", weight="50", pictures=["pic"]
        )
        job = Jobs.objects.create(
            pet=pet,
            user=self.user,
            location=location,
            status="open",
            pay=100.00,
            start="2023-01-01T00:00:00Z",
            end="2023-01-02T00:00:00Z",
        )
        application = Applications.objects.create(
            user=self.user, job=job, status="accepted", details={"note": "I am interested"}
        )
        self.assertEqual(Applications.objects.count(), 1)
        self.assertEqual(application.status, "accepted")

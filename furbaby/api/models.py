from django.db import models
from django.contrib.postgres.fields import ArrayField
from django.contrib.auth.models import AbstractUser

import uuid

"""

CREATE TYPE user_feature_access_type AS ENUM (
    'sitter',
    'owner'
);

CREATE TABLE users (
    id uuid primary key,
    email text not null,
    "password" text not null,
    first_name text not null,
    last_name text not null,
    user_type user_feature_access_type[2],
    contact text not null,
    date_of_birth date not null,
    experience text,
    qualifications text
);

"""


class UserTypes(models.TextChoices):
    PET_SITTER = "sitter"
    PET_OWNER = "owner"


class Users(AbstractUser):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.TextField(max_length=200, null=False, editable=True, unique=True)
    password = models.TextField(null=False, editable=True)
    first_name = models.TextField(null=True, editable=True)
    last_name = models.TextField(null=True, editable=True)
    user_type = ArrayField(
        models.TextField(max_length=20, choices=UserTypes.choices), size=2
    )
    date_of_birth = models.DateField(editable=False, null=True)
    experience = models.TextField(editable=True, null=True)
    qualifications = models.TextField(editable=True, null=True)
    phone_number = models.TextField(editable=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["password", "user_type"]

    def __str__(self):
        return self.email


"""

CREATE TABLE locations (
    id uuid primary key,
    user_id uuid references users (id),
    "address" text not null,
    city text,
    country text,
    zipcode text,
    default_location boolean default FALSE
);

"""


class Locations(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(Users, on_delete=models.CASCADE, to_field="id")
    address = models.TextField(max_length=200, editable=True, null=False)
    city = models.TextField(editable=True, null=False)
    country = models.TextField(editable=True, null=False)
    zipcode = models.TextField(editable=True, null=False)
    default_location = models.BooleanField(default=False, editable=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=("address", "city", "country", "user_id"),
                name="address_city_country_user_id_constraint",
            )
        ]


"""
CREATE TABLE pets (
    id uuid primary key,
    owner_id uuid references users (id),
    name text not null,
    species text,
    color text,
    height text,
    breed text not null,
    "weight" text not null,
    chip_number text,
    health_requirements text
);
"""


class Pets(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    owner = models.ForeignKey(Users, on_delete=models.CASCADE, to_field="id")
    name = models.TextField(editable=True, null=False)
    species = models.TextField(editable=True, null=True)
    color = models.TextField(editable=True, null=True)
    height = models.TextField(editable=True, null=True)
    breed = models.TextField(editable=True, null=False)
    weight = models.TextField(editable=True, null=False)
    chip_number = models.TextField(editable=True, null=True)
    health_requirements = models.TextField(editable=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=("name", "owner_id"), name="name_owner_id_constraint"
            )
        ]


"""

CREATE TYPE job_status AS ENUM (
    'open',
    'job_acceptance_pending',
    'acceptance_complete',
    'job_ongoing',
    'job_complete',
    'cancelled',
    'removed'
);

CREATE TABLE jobs (
    id uuid primary key,
    pet_id uuid references pets (id),
    user_id uuid references users (id),
    "status" job_status not null,
    pay numeric not null,
    "start" timestamptz not null,
    "end" timestamptz not null,
    location_id uuid references locations (id)
);


"""


class Jobs(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    pet = models.ForeignKey(Pets, on_delete=models.CASCADE, to_field="id")
    user = models.ForeignKey(Users, on_delete=models.CASCADE, to_field="id")
    location = models.ForeignKey(Locations, on_delete=models.CASCADE, to_field="id")
    status = models.TextField(null=False, editable=True)
    pay = models.DecimalField(decimal_places=2, max_digits=8, null=False)
    start = models.DateTimeField(null=False)
    end = models.DateTimeField(null=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=("location_id", "start", "end", "pet_id"),
                name="location_id_start_end_pet_id_constraint",
            )
        ]


"""

CREATE TYPE application_status AS ENUM (
    'rejected',
    'accepted'
);

CREATE TABLE applications (
    id uuid primary key,
    job_id uuid references jobs (id),
    user_id uuid references users (id),
    "status" application_status not null,
    details jsonb
);

"""


class Applications(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(Users, on_delete=models.CASCADE, to_field="id")
    job = models.ForeignKey(Jobs, on_delete=models.CASCADE, to_field="id")
    status = models.TextField(
        # note: use the application_status enum values while referencing this field in the API
        null=False,
        editable=True,
    )
    details = models.JSONField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=("user_id", "job_id"), name="user_id_job_id_constraint"
            )
        ]

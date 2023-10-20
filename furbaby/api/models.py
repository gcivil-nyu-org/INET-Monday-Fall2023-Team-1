from django.db import models
from django.contrib.postgres.fields import ArrayField
from django.contrib.auth.models import AbstractUser

# from django.contrib.auth.hashers import make_password use this while storing use passwords
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
    profile_picture text,
    contact text not null,
    date_of_birth date not null,
    experience text,
    qualifications text
);

"""


class Users(AbstractUser):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.TextField(max_length=200, null=False, editable=True, unique=True)
    password = models.TextField(null=False, editable=True)
    first_name = models.TextField(null=False, editable=True)
    last_name = models.TextField(null=False, editable=True)
    user_type = ArrayField(
        models.TextField(null=True, blank=True),
        blank=True,
        size=2,
        null=False,
        editable=True,
    )
    profile_picture = models.TextField(editable=True)
    date_of_birth = models.DateField(editable=False)
    experience = models.TextField(editable=True)
    qualifications = models.TextField(editable=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = [email, password, first_name, last_name, date_of_birth]

    def __str__(self):
        return self.email

    # class Meta:
    #     constraints = [
    #         models.CheckConstraint(
    #             name="nyu_email_check",
    #             check=models.Q(email__like="%@nyu.edu"),
    #         ),
    #     ]


"""

CREATE TABLE locations (
    id uuid primary key,
    user_id uuid references users (id),
    "address" text not null,
    city text,
    country text,
    default_location boolean default FALSE
);

"""


class Locations(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(Users, on_delete=models.CASCADE, to_field="id")
    address = models.TextField(max_length=200, editable=True, null=False)
    city = models.TextField(editable=True, null=False)
    country = models.TextField(editable=True, null=False)
    default_location = models.BooleanField(default=False, editable=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=("address", "city", "country"),
                name="address_city_country_constraint",
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
    picures text[],
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
    pictures = ArrayField(
        models.TextField(null=True, blank=True), blank=True, null=False, editable=True
    )
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

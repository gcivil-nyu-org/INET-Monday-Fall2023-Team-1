# Generated by Django 4.0 on 2023-10-19 17:59

import django.contrib.postgres.fields
from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        ("api", "0001_create_first_db_models"),
    ]

    operations = [
        migrations.CreateModel(
            name="Users",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.UUID("d22eb4ae-de3d-41b0-bf63-b54cd8ba348b"),
                        editable=False,
                        primary_key=True,
                        serialize=False,
                    ),
                ),
                ("email", models.TextField(max_length=200)),
                ("password", models.TextField()),
                ("first_name", models.TextField()),
                ("last_name", models.TextField()),
                (
                    "user_type",
                    django.contrib.postgres.fields.ArrayField(
                        base_field=models.TextField(blank=True, null=True),
                        blank=True,
                        size=2,
                    ),
                ),
                ("profile_picture", models.TextField()),
                ("date_of_birth", models.DateField(editable=False)),
                ("experience", models.TextField()),
                ("qualifications", models.TextField()),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
        ),
        migrations.CreateModel(
            name="Pets",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.UUID("b5ac3463-cf7f-4205-9c96-9c74707f4900"),
                        editable=False,
                        primary_key=True,
                        serialize=False,
                    ),
                ),
                ("name", models.TextField()),
                ("species", models.TextField(null=True)),
                ("color", models.TextField(null=True)),
                ("height", models.TextField(null=True)),
                ("breed", models.TextField()),
                ("weight", models.TextField()),
                (
                    "pictures",
                    django.contrib.postgres.fields.ArrayField(
                        base_field=models.TextField(blank=True, null=True),
                        blank=True,
                        size=None,
                    ),
                ),
                ("chip_number", models.TextField(null=True)),
                ("health_requirements", models.TextField(null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "owner_id",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to="api.users"),
                ),
            ],
        ),
        migrations.CreateModel(
            name="Locations",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.UUID("80ad0fba-e6ec-451b-891a-b80e792b0f82"),
                        editable=False,
                        primary_key=True,
                        serialize=False,
                    ),
                ),
                ("address", models.TextField(max_length=200)),
                ("city", models.TextField()),
                ("country", models.TextField()),
                ("default_location", models.BooleanField(default=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "user_id",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to="api.users"),
                ),
            ],
        ),
        migrations.CreateModel(
            name="Jobs",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.UUID("e2288338-e73e-4afb-bcfd-b8ac4beba6ad"),
                        editable=False,
                        primary_key=True,
                        serialize=False,
                    ),
                ),
                ("status", models.TextField()),
                ("pay", models.DecimalField(decimal_places=2, max_digits=8)),
                ("start", models.DateTimeField()),
                ("end", models.DateTimeField()),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "location_id",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE, to="api.locations"
                    ),
                ),
                (
                    "pet_id",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to="api.pets"),
                ),
                (
                    "user_id",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to="api.users"),
                ),
            ],
        ),
        migrations.CreateModel(
            name="Applications",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.UUID("9ce40f15-d374-44a0-a5f1-0fd84bd54de1"),
                        editable=False,
                        primary_key=True,
                        serialize=False,
                    ),
                ),
                ("status", models.TextField()),
                ("details", models.JSONField()),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "job_id",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to="api.jobs"),
                ),
                (
                    "user_id",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to="api.users"),
                ),
            ],
        ),
    ]

# Generated by Django 4.0 on 2023-10-22 16:44

import django.contrib.postgres.fields
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("api", "0007_applications_user_id_job_id_constraint_and_more"),
    ]

    operations = [
        migrations.AlterField(
            model_name="users",
            name="user_type",
            field=django.contrib.postgres.fields.ArrayField(
                base_field=models.CharField(
                    choices=[("Pet Sitter", "Pet Sitter"), ("Pet Owner", "Pet Owner")],
                    max_length=20,
                ),
                size=2,
            ),
        ),
    ]

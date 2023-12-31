# Generated by Django 4.0 on 2023-10-23 23:49

import django.contrib.postgres.fields
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("api", "0009_merge_20231023_2310"),
    ]

    operations = [
        migrations.AlterField(
            model_name="users",
            name="date_of_birth",
            field=models.DateField(editable=False, null=True),
        ),
        migrations.AlterField(
            model_name="users",
            name="experience",
            field=models.TextField(null=True),
        ),
        migrations.AlterField(
            model_name="users",
            name="first_name",
            field=models.TextField(null=True),
        ),
        migrations.AlterField(
            model_name="users",
            name="last_name",
            field=models.TextField(null=True),
        ),
        migrations.AlterField(
            model_name="users",
            name="profile_picture",
            field=models.TextField(null=True),
        ),
        migrations.AlterField(
            model_name="users",
            name="qualifications",
            field=models.TextField(null=True),
        ),
        migrations.AlterField(
            model_name="users",
            name="user_type",
            field=django.contrib.postgres.fields.ArrayField(
                base_field=models.TextField(
                    choices=[("sitter", "Pet Sitter"), ("owner", "Pet Owner")],
                    max_length=20,
                ),
                size=2,
            ),
        ),
    ]

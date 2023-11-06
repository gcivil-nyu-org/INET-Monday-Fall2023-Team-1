# Generated by Django 4.0 on 2023-11-06 18:18

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("api", "0011_remove_pets_pictures_remove_users_profile_picture_and_more"),
    ]

    operations = [
        migrations.AlterModelOptions(
            name="users",
            options={},
        ),
        migrations.AddConstraint(
            model_name="users",
            constraint=models.CheckConstraint(
                check=models.Q(
                    ("date_of_birth__gte", 16), ("date_of_birth__isnull", True), _connector="OR"
                ),
                name="check_if_atleast_16_constraint",
            ),
        ),
    ]
# Generated by Django 4.0 on 2023-11-05 00:19

from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("api", "0010_alter_users_date_of_birth_alter_users_experience_and_more"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="pets",
            name="pictures",
        ),
        migrations.RemoveField(
            model_name="users",
            name="profile_picture",
        ),
    ]
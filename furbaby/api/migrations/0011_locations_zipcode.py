# Generated by Django 4.0 on 2023-11-03 21:12

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("api", "0010_alter_users_date_of_birth_alter_users_experience_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="locations",
            name="zipcode",
            field=models.TextField(null=True),
        ),
    ]

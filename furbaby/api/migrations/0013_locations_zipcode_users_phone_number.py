# Generated by Django 4.0 on 2023-11-10 00:47

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("api", "0012_auto_20231106_1829"),
    ]

    operations = [
        migrations.AddField(
            model_name="users",
            name="phone_number",
            field=models.TextField(null=True),
        )
    ]

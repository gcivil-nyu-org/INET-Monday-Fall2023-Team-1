from rest_framework import serializers
from .models import Users, Locations
from django.contrib.auth.hashers import make_password
from django.core.exceptions import ValidationError


class RegistrationSerializer(serializers.ModelSerializer):
    user_type = serializers.ListField(
        child=serializers.RegexField(
            max_length=20,
            regex="^(sitter|owner)$",
        ),
        write_only=True,
        allow_empty=False,
    )
    password = serializers.CharField(min_length=6, write_only=True, trim_whitespace=True)
    email = serializers.EmailField(allow_blank=False, trim_whitespace=True)

    class Meta:
        model = Users
        fields = [
            "email",
            "password",
            "user_type",
        ]

    def validate(self, data):
        user_type = data.get("user_type", [])
        email = data.get("email", "")

        if "sitter" in user_type and not email.endswith("nyu.edu"):
            raise ValidationError("Pet sitters must have a nyu.edu email")
        return data

    def create(self, validated_data):
        # save username with value of email
        validated_data["username"] = validated_data["email"]
        # Hash the password
        validated_data["password"] = make_password(validated_data["password"])

        # Create and return the user
        return Users.objects.create(**validated_data)


class UserLoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(min_length=6, write_only=True)


class UserLocationSerializer(serializers.Serializer):
    user_id = serializers.UUIDField()
    address = serializers.CharField(max_length=200)
    city = serializers.CharField(max_length=100)
    country = serializers.CharField(max_length=100)
    zipcode = serializers.CharField(max_length=20)
    default_location = serializers.BooleanField()

    class Meta:
        model = Locations
        fields = ["user_id" "address", "city", "country", "zipcode", "deault_location"]

    # TODO: There should be only one default address per user
    def validate(self, data):
        city = data.get("city", "")
        city = str(city).lower()
        country = data.get("country", "")
        country = str(country).lower()

        cities_allowed_list = ["new york city", "nyc"]
        countries_allowed_list = [
            "united states",
            "usa",
            "us",
            "america",
            "united states of america",
        ]

        if city not in cities_allowed_list:
            raise ValidationError("Users must be located in New York City/NYC")
        if country not in countries_allowed_list:
            raise ValidationError("Users must be located in the United States of America/USA")
        return data

    def create(self, validated_data):
        return Locations.objects.create(**validated_data)

from rest_framework import serializers
from .models import Users
from django.contrib.auth.hashers import make_password
from django.core.exceptions import ValidationError


class UserRegistrationSerializer(serializers.ModelSerializer):
    user_type = serializers.ListField(child=serializers.CharField(max_length=20), write_only=True)
    date_of_birth = serializers.DateField()

    class Meta:
        model = Users
        fields = [
            "email",
            "password",
            "first_name",
            "last_name",
            "experience",
            "date_of_birth",
            "qualifications",
            "user_type",
        ]

    def validate(self, data):
        user_type = data.get("user_type", [])
        email = data.get("email", "")

        if "Pet Sitter" in user_type and not email.endswith("nyu.edu"):
            raise ValidationError("Pet sitters must have a nyu.edu email")
        return data

    def create(self, validated_data):
        # Hash the password
        validated_data["password"] = make_password(validated_data["password"])

        # Create and return the user
        return Users.objects.create(**validated_data)


class UserLoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()

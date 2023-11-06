from rest_framework import serializers
from .models import Users,Pets
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
    password = serializers.CharField(min_length=8, write_only=True, trim_whitespace=True)
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
    password = serializers.CharField(min_length=8, write_only=True)

class PetSerializer(serializers.ModelSerializer):
    owner = serializers.HiddenField(default=serializers.CurrentUserDefault()) 

    class Meta:
        model = Pets
        exclude = ()  

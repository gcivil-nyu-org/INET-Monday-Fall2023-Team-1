from rest_framework import serializers
from .models import Users,Pets,Locations
from django.contrib.auth.hashers import make_password
from django.core.exceptions import ValidationError
from django.contrib.auth import get_user_model

class UserRegistrationSerializer(serializers.ModelSerializer):
    user_type = serializers.ListField(child=serializers.CharField(max_length=20), write_only=True)
    date_of_birth = serializers.DateField()

    class Meta:
        model = Users
        fields = [
            "email",
            "username",
            "password",
            "date_of_birth",
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

class LocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Locations
        fields = [
            "user",
            "address",
            "city",
            "country",
        ]
 
        
class UserProfileEditSerializer(serializers.ModelSerializer):
    location = LocationSerializer(many=True, read_only=True)
    class Meta:
        model = Users
        fields = [
            "first_name",
            "last_name",
            "date_of_birth",
            "user_type",
            "experience",
            "qualifications",
            "location", 
        ]


class PetSerializer(serializers.ModelSerializer):
    owner = serializers.HiddenField(default=serializers.CurrentUserDefault()) 

    class Meta:
        model = Pets
        exclude = ()  
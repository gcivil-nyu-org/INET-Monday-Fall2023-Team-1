from rest_framework import serializers
from .models import Users, Locations, Pets, Jobs, Applications
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
        email = data.get("email", "").lower()  # Convert email to lowercase for case insensitivity

        # Check if the email already exists in the database
        if Users.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError("Email already exists")

        if "sitter" in user_type and not email.endswith("nyu.edu"):
            raise serializers.ValidationError("Pet sitters must have a nyu.edu email")

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


class UserLocationSerializer(serializers.Serializer):
    user = serializers.HiddenField(default=serializers.CurrentUserDefault())
    address = serializers.CharField(max_length=200)
    city = serializers.CharField(max_length=100)
    country = serializers.CharField(max_length=100)
    zipcode = serializers.CharField(max_length=20)
    default_location = serializers.BooleanField()

    class Meta:
        model = Locations
        fields = [
            "user_id",
            "address",
            "city",
            "country",
            "zipcode",
            "default_location",
        ]

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

    def update(self, instance, validated_data):
        instance.address = validated_data.get("address", instance.address)
        instance.city = validated_data.get("city", instance.city)
        instance.country = validated_data.get("country", instance.country)
        instance.zipcode = validated_data.get("zipcode", instance.zipcode)
        if validated_data.get("default_location"):
            Locations.objects.filter(user=instance.user).update(default_location=False)
            instance.default_location = True;
        if not validated_data.get("default_location"):
            instance.default_location = False;
        instance.save()
        return instance


class PetSerializer(serializers.ModelSerializer):
    owner = serializers.HiddenField(default=serializers.CurrentUserDefault())

    class Meta:
        model = Pets
        exclude = ()


class JobSerializer(serializers.ModelSerializer):
    user = serializers.HiddenField(default=serializers.CurrentUserDefault())

    class Meta:
        model = Jobs
        fields = "__all__"


class UserSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    username = serializers.CharField()
    email = serializers.CharField()
    date_of_birth = serializers.DateField()
    experience = serializers.CharField()
    qualifications = serializers.CharField()
    phone_number = serializers.CharField()


class ApplicationSerializer(serializers.ModelSerializer):
    user = serializers.HiddenField(default=serializers.CurrentUserDefault())

    class Meta:
        model = Applications
        fields = "__all__"

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        user_representation = UserSerializer(instance.user).data
        representation["user"] = user_representation
        return representation

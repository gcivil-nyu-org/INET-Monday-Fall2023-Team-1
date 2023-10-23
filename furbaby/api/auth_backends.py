from django.contrib.auth import get_user_model
from django.contrib.auth.backends import ModelBackend
from django.contrib.auth.hashers import check_password
from django.http import HttpResponse


class EmailBackend(ModelBackend):
    def authenticate(self, request, email=None, password=None, **kwargs):
        User = get_user_model()
        try:
            user = User.objects.get(email=email)
            print(user)
            print(password)
            print(user.password)
            if check_password(password, user.password):
                return user
        except User.DoesNotExist:
            return HttpResponse("User Not Found", status=404)


    def get_user(self, user_id):
        User = get_user_model()
        try:
            return User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return None

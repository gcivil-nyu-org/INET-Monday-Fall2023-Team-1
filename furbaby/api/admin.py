from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import Users, Pets, Jobs, Applications, Locations

# Register your models here.

admin.site.register(Users, UserAdmin)
admin.site.register(Locations)
admin.site.register(Pets)
admin.site.register(Jobs)
admin.site.register(Applications)

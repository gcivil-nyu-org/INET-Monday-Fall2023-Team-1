from django.http import HttpResponse


def health():
    return HttpResponse("OK", status=200)


def index():
    return HttpResponse("Hey! Welcome to Furbaby!", status=200)

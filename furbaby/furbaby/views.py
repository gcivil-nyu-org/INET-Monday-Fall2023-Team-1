from django.http import HttpResponse


def health(_req):
    return HttpResponse("OK", status=200)


def index(_req):
    return HttpResponse("Hey! Welcome to Furbaby!", status=200)

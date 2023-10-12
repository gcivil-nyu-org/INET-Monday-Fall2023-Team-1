from django.http import HttpResponse


def health(req):
    return HttpResponse("OK", status=200)


def index(req):
    return HttpResponse("Hey! Welcome to Furbaby!", status=200)

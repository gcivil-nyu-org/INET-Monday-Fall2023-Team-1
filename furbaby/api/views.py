from django.http import JsonResponse

# Create your views here.


def index(req):
    return JsonResponse({"message": "hello, world"}, status=200)

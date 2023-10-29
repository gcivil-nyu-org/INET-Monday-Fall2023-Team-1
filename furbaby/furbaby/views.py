from django.http import JsonResponse


def health(req):
    return JsonResponse({"status": "OK"}, status=200)

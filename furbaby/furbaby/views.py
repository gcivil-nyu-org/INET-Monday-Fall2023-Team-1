from django.http import JsonResponse


def health(_req):
    return JsonResponse({"status": "OK"}, status=200)

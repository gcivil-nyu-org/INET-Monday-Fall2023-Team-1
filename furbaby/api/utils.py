from django.http import JsonResponse


def json_response(data=None, status=None):
    return JsonResponse(data={"data": data}, status=status)

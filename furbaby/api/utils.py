import json
from django.http import JsonResponse


def make_s3_path(*args: str):
    return "/".join(args)


def read_request_body(request):
    body_unicode = request.body.decode("utf-8")
    return json.loads(body_unicode)


def json_response(data=None, status=None, safe=True, include_data=True):
    if include_data == False:
        return JsonResponse(data=data, status=status, safe=safe)
    return JsonResponse(data={"data": data}, status=status, safe=safe)

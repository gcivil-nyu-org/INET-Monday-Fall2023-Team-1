import json
from django.http import JsonResponse


def json_response(data=None, status=None):
    return JsonResponse(data={"data": data}, status=status)


def make_s3_path(*args: str):
    return "/".join(args)


def read_request_body(request):
    body_unicode = request.body.decode("utf-8")
    body = json.loads(body_unicode)
    return body["content"]

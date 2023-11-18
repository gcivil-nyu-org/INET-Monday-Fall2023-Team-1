from django.http import JsonResponse


def json_response(data=None, status=None, safe=True, include_data=True):
    if include_data == False:
        return JsonResponse(data=data, status=status, safe=safe)
    return JsonResponse(data={"data": data}, status=status, safe=safe)

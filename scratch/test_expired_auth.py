import urllib.request
import urllib.error
import json

try:
    req = urllib.request.Request(
        "http://127.0.0.1:8000/api/offices/search/",
        headers={"Authorization": "Bearer invalid_or_expired_token"}
    )
    with urllib.request.urlopen(req) as response:
        print("Success status:", response.getcode())
except urllib.error.HTTPError as e:
    print("Failed with status code:", e.code)
    print("Response body:", e.read().decode('utf-8'))
except Exception as e:
    print("Other error:", e)

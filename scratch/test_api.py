import urllib.request
import json

try:
    req = urllib.request.Request("http://127.0.0.1:8000/api/offices/search/")
    with urllib.request.urlopen(req) as response:
        status_code = response.getcode()
        print("Status code:", status_code)
        data = json.loads(response.read().decode('utf-8'))
        print("Total count:", data.get("count"))
        results = data.get("results", [])
        print("Returned results count in page 1:", len(results))
        if results:
            print("Sample office:", results[0])
except Exception as e:
    print("Error querying API:", e)

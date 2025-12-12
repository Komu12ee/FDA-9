import requests
import sys

try:
    print("Sending request...")
    r = requests.post('http://localhost:8000/api/charts/scatter', json={}, timeout=5)
    if r.status_code == 200:
        data = r.json()
        if 'points' in data and len(data['points']) > 0:
            keys = list(data['points'][0].keys())
            print(f"Keys found: {keys}")
            if 'ACC_NUM' in keys:
                print("SUCCESS: ACC_NUM is present.")
            else:
                print("FAILURE: ACC_NUM is MISSING.")
        else:
            print("FAILURE: No points returned.")
    else:
        print(f"FAILURE: Status code {r.status_code}")
        print(r.text)
except Exception as e:
    print(f"ERROR: {e}")

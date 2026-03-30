import urllib.request
import urllib.error
import json

url = 'https://ai-go.app/api/v1/refs/apps/d2299619-859e-4e62-b818-7f88d0298f02'
payload = {
    "table_name": "customers",
    "columns": ["id"],
    "permissions": ["read"]
}
req = urllib.request.Request(url, data=json.dumps(payload).encode('utf-8'), method='POST', headers={'User-Agent': 'Mozilla/5.0', 'Content-Type': 'application/json'})
try:
    urllib.request.urlopen(req, timeout=5)
    print("Success")
except urllib.error.HTTPError as e:
    print('HTTPError', e.code)
except Exception as e:
    print('Exception', e)

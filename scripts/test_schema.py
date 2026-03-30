import urllib.request
import json
import sys

API_BASE = 'https://ai-go.app/api/v1/open/proxy'
API_KEY = 'sk_live_0e26c58efb443b55a4358543ccf19e08d00b7e3c82575fb77437207434e214f7'
req = urllib.request.Request(f'{API_BASE}/sale_order_lines/query', data=b'{"limit":1}', headers={'X-API-Key': API_KEY, 'Content-Type': 'application/json'})
try:
    res = urllib.request.urlopen(req)
    print(list(json.loads(res.read())[0].keys()))
except Exception as e:
    err = getattr(e, 'read', lambda: b'')()
    print('Err:', err.decode())

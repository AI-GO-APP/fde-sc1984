import urllib.request
import json

try:
    req = urllib.request.Request('https://ai-go.app/api/v1/openapi.json', headers={'User-Agent': 'Mozilla/5.0'})
    print("Fetching openapi.json...")
    res = urllib.request.urlopen(req)
    data = json.loads(res.read())
    paths = data.get('paths', {})
    print(f"Loaded {len(paths)} API paths.")
    
    with open('tmp_openapi_paths.txt', 'w', encoding='utf-8') as f:
        for path in paths:
            f.write(path + '\n')
            
    # Search for login related paths
    print("Login related endpoints:")
    for path in paths:
        if 'login' in path.lower() or 'auth' in path.lower() or 'token' in path.lower():
            print(f"  {path}")
            
except Exception as e:
    print(f"Error fetching openapi.json: {e}")

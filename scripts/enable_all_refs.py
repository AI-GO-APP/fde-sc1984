import os
import sys
import json
import urllib.request
import re
from urllib.error import HTTPError, URLError

API_BASE = "https://ai-go.app/api/v1"
APP_IDS = [
    "d2299619-859e-4e62-b818-7f88d0298f02",
    "50d52f3f-0954-4853-80fe-e319e04c0e9a"
]
EMAIL = "admin@sc1984.com"
PASSWORD = "ak472008"

def extract_supabase_config():
    print("Fetching ai-go.app to extract Supabase config...")
    req = urllib.request.Request('https://ai-go.app/builder', headers={'User-Agent': 'Mozilla/5.0'})
    html = urllib.request.urlopen(req).read().decode('utf-8')
    js_files = set(re.findall(r'src="([^"]+\.js)"', html) + re.findall(r'href="([^"]+\.js)"', html))
    
    supabase_url = None
    anon_key = None
    
    for js_file in js_files:
        js_url = 'https://ai-go.app' + js_file if js_file.startswith('/') else 'https://ai-go.app/builder/' + js_file if not js_file.startswith('http') else js_file
        try:
            js_req = urllib.request.Request(js_url, headers={'User-Agent': 'Mozilla/5.0'})
            js_content = urllib.request.urlopen(js_req).read().decode('utf-8')
            
            urls = re.findall(r'https://[^.]+\.supabase\.co', js_content)
            keys = re.findall(r'eyJh[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+', js_content)
            
            if urls: supabase_url = urls[0]
            if keys: anon_key = sorted(list(set(keys)), key=len, reverse=True)[0] # get the longest jwt
            if supabase_url and anon_key:
                break
        except Exception:
            pass
            
    if not supabase_url or not anon_key:
        raise Exception("Could not find Supabase URL or Anon Key")
        
    return supabase_url, anon_key

def supabase_login(supabase_url, anon_key):
    print("Logging into Supabase...")
    url = f"{supabase_url}/auth/v1/token?grant_type=password"
    payload = {"email": EMAIL, "password": PASSWORD}
    headers = {
        "apikey": anon_key,
        "Content-Type": "application/json"
    }
    
    req = urllib.request.Request(url, data=json.dumps(payload).encode('utf-8'), headers=headers, method='POST')
    try:
        res = urllib.request.urlopen(req)
        data = json.loads(res.read())
        return data['access_token']
    except HTTPError as e:
        print(f"Login failed: {e.code} {e.read().decode()}")
        raise

def request(method, url, data=None, token=None):
    headers = {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0'
    }
    if token:
        headers['Authorization'] = f'Bearer {token}'
    
    req = urllib.request.Request(url, method=method, headers=headers)
    if data is not None:
        req.data = json.dumps(data).encode('utf-8')
    
    try:
        res = urllib.request.urlopen(req, timeout=15)
        body = res.read()
        if not body:
            return None
        return json.loads(body)
    except HTTPError as e:
        print(f"HTTP Error {e.code} on {method} {url}")
        print(e.read().decode())
        raise
    except URLError as e:
        print(f"URL Error on {method} {url}: {e.reason}")
        raise

def main():
    sb_url, sb_key = extract_supabase_config()
    print(f"Supabase Found: {sb_url}")
    
    token = supabase_login(sb_url, sb_key)
    print("Successfully logged in and got access_token.")
    
    print("Fetching available tables...")
    tables = request('GET', f'{API_BASE}/refs/available-tables', token=token)
    print(f"Found {len(tables)} tables.")
    
    table_columns = {}
    for t in tables:
        tname = t['name']
        print(f"Fetching columns for {tname}...")
        cols = request('GET', f'{API_BASE}/refs/tables/{tname}/columns', token=token)
        col_names = [c['name'] for c in cols]
        table_columns[tname] = col_names
        print(f"  - {len(col_names)} columns")
        
    for app_id in APP_IDS:
        print(f"\\n--- Processing App ID: {app_id} ---")
        existing_refs = request('GET', f'{API_BASE}/refs/apps/{app_id}', token=token)
        ref_map = {r['table_name']: r['id'] for r in existing_refs}
        
        for tname, col_names in table_columns.items():
            payload = {
                "columns": col_names,
                "permissions": ["read", "create", "update", "delete"]
            }
            if tname in ref_map:
                ref_id = ref_map[tname]
                print(f"Updating ref for {tname} (ref_id: {ref_id})...")
                request('PATCH', f'{API_BASE}/refs/{ref_id}', data=payload, token=token)
            else:
                payload["table_name"] = tname
                print(f"Creating ref for {tname}...")
                try:
                    request('POST', f'{API_BASE}/refs/apps/{app_id}', data=payload, token=token)
                except HTTPError as e:
                    if e.code == 409:
                        print(f"Ref for {tname} already exists (409), skipping creation...")
                    else:
                        raise
        
        print(f"Publishing app {app_id}...")
        request('POST', f'{API_BASE}/integrations/{app_id}/publish', data={"note": "Auto publish all refs"}, token=token)
        print(f"App {app_id} published successfully.")

if __name__ == '__main__':
    main()

import urllib.request
import re

try:
    req = urllib.request.Request('https://ai-go.app/builder', headers={'User-Agent': 'Mozilla/5.0'})
    html = urllib.request.urlopen(req).read().decode('utf-8')
    js_files = set(re.findall(r'src="([^"]+\.js)"', html) + re.findall(r'href="([^"]+\.js)"', html))
    for js_file in js_files:
        js_url = 'https://ai-go.app' + js_file if js_file.startswith('/') else 'https://ai-go.app/builder/' + js_file if not js_file.startswith('http') else js_file
        try:
            js_req = urllib.request.Request(js_url, headers={'User-Agent': 'Mozilla/5.0'})
            js_content = urllib.request.urlopen(js_req).read().decode('utf-8')
            anon_keys = re.findall(r'eyJh[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+', js_content)
            if anon_keys:
                for k in set(anon_keys):
                    print(f"ANON_KEY={k}")
        except Exception:
            pass
except Exception as e:
    pass

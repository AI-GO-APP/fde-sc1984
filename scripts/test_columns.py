import urllib.request
import urllib.error

url = 'https://ai-go.app/api/v1/refs/tables/customers/columns'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    urllib.request.urlopen(req, timeout=5)
except urllib.error.HTTPError as e:
    print('HTTPError', e.code)
except Exception as e:
    print('Exception', e)

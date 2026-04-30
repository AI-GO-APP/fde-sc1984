"""Shared test helpers: login, proxy CRUD, action invocation (use_dev=true).
Usage:
  from test_lib import api_login, query, qquery, patch, post, run_action, ADMIN_APP, ORDERING_APP
"""
import json, os, sys, urllib.request, urllib.error

API_BASE = "https://ai-go.app/api/v1"
ADMIN_APP = "6d1b56d0-0b54-4bda-8d41-9bf201d0cb78"
ORDERING_APP = os.environ.get("ORDERING_APP_ID", "")


def _req(method, url, headers, data=None, timeout=30):
    body = json.dumps(data).encode() if data is not None else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            raw = resp.read()
            return resp.status, (json.loads(raw) if raw else None)
    except urllib.error.HTTPError as e:
        try:
            return e.code, json.loads(e.read())
        except Exception:
            return e.code, None


def api_login():
    email = os.environ.get("AIGO_EMAIL", "").strip()
    pw = os.environ.get("AIGO_PASSWORD", "").strip()
    if not (email and pw):
        sys.exit("AIGO_EMAIL / AIGO_PASSWORD missing — source .env first")
    s, b = _req("POST", f"{API_BASE}/auth/login", {"Content-Type": "application/json"}, {"email": email, "password": pw})
    if s != 200 or not (b and b.get("access_token")):
        sys.exit(f"login failed: {s} {b}")
    return {"Authorization": f"Bearer {b['access_token']}", "Content-Type": "application/json"}


def query(h, app_id, table, limit=50):
    s, b = _req("GET", f"{API_BASE}/proxy/{app_id}/{table}?limit={limit}", h)
    return b if s == 200 else []


def qquery(h, app_id, table, filters, limit=50):
    s, b = _req("POST", f"{API_BASE}/proxy/{app_id}/{table}/query", h, {"filters": filters, "limit": limit})
    if s != 200:
        print(f"[qquery {table}] {s} {str(b)[:200]}", file=sys.stderr)
        return []
    return b


def patch(h, app_id, table, rid, data):
    # Internal proxy 期待 {"data": {...}} 包裝（見 vfs/admin/src/db.ts）
    return _req("PATCH", f"{API_BASE}/proxy/{app_id}/{table}/{rid}", h, {"data": data})


def post(h, app_id, table, data):
    return _req("POST", f"{API_BASE}/proxy/{app_id}/{table}", h, {"data": data})


def run_action(h, app_id, action_name, params, use_dev=True):
    flag = "true" if use_dev else "false"
    url = f"{API_BASE}/actions/apps/{app_id}/execute-by-name?action_name={action_name}&use_dev={flag}"
    return _req("POST", url, h, {"params": params}, timeout=60)

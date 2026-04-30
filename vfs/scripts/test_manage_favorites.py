"""Smoke-test manage_favorites action (use_dev=true).

Flow: list (filter by test customer) → add (with default_note) → list → set_note → remove → list
Always cleans up created records.
"""
import json, os, sys
sys.path.insert(0, os.path.dirname(__file__))
from test_lib import api_login, run_action, ORDERING_APP

ORDERING_APP_ID = os.environ.get("ORDERING_APP_ID") or ORDERING_APP


def call(h, op, **kw):
    s, b = run_action(h, ORDERING_APP_ID, "manage_favorites", {"op": op, **kw})
    print(f"[{op}] status={s}")
    print(json.dumps((b or {}).get("result") or b, ensure_ascii=False, indent=2)[:600])
    return (b or {}).get("result") or {}


def main():
    h = api_login()
    if not ORDERING_APP_ID:
        sys.exit("ORDERING_APP_ID env var or hard-coded constant required")
    cust = "test-cust-" + os.urandom(4).hex()
    tmpl = "test-tmpl-" + os.urandom(4).hex()

    print(f"\n== test customer={cust}  template={tmpl} ==")
    print("\n-- list (should be empty) --")
    r = call(h, "list", customer_id=cust)

    print("\n-- add with default_note --")
    r = call(h, "add", customer_id=cust, product_tmpl_id=tmpl, default_note="老客戶要切丁")
    rec_id = (r.get("record") or {}).get("id")
    print("rec_id:", rec_id)

    print("\n-- list (should have 1 with default_note) --")
    call(h, "list", customer_id=cust)

    print("\n-- add same again (should de-dupe + update note) --")
    call(h, "add", customer_id=cust, product_tmpl_id=tmpl, default_note="改：切片")

    print("\n-- list (note should be 改：切片) --")
    call(h, "list", customer_id=cust)

    print("\n-- set_note via record_id --")
    call(h, "set_note", record_id=rec_id, default_note="再改：切絲")

    print("\n-- list (note should be 再改：切絲) --")
    call(h, "list", customer_id=cust)

    print("\n-- set_note for new product (no record_id) --")
    tmpl2 = "test-tmpl-" + os.urandom(4).hex()
    r2 = call(h, "set_note", customer_id=cust, product_tmpl_id=tmpl2, default_note="新品項常用備註")
    rec2 = r2.get("record_id")

    print("\n-- list (should have 2) --")
    call(h, "list", customer_id=cust)

    print("\n== cleanup ==")
    call(h, "remove", record_id=rec_id)
    if rec2:
        call(h, "remove", record_id=rec2)
    call(h, "list", customer_id=cust)


if __name__ == "__main__":
    main()

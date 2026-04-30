"""Smoke-test update_order_lines action — 驗證 note 寫入 sale_order_lines.custom_data.note
保持原值還原（cleanup）。
"""
import json, os, sys
sys.path.insert(0, os.path.dirname(__file__))
from test_lib import api_login, qquery, run_action, ADMIN_APP, ORDERING_APP

ORDER_ID = sys.argv[1] if len(sys.argv) > 1 else None


def main():
    h = api_login()
    # 找一筆有 lines 的 draft 訂單（或從 ADMIN proxy 撈也行；用 admin app 因為 ordering 訂單也都在同一個 sale_orders 表）
    if ORDER_ID:
        orders = qquery(h, ADMIN_APP, "sale_orders", [{"column": "id", "op": "eq", "value": ORDER_ID}], 1)
    else:
        orders = qquery(h, ADMIN_APP, "sale_orders", [{"column": "state", "op": "eq", "value": "draft"}], 5)
    if not orders:
        sys.exit("no order found")
    order = orders[0]
    oid = order["id"]
    lines = qquery(h, ADMIN_APP, "sale_order_lines", [{"column": "order_id", "op": "eq", "value": oid}], 50)
    if not lines:
        sys.exit("no lines")
    target = lines[0]
    lid = target["id"]
    old_cd = target.get("custom_data") or {}
    old_note = (old_cd or {}).get("note", "") if isinstance(old_cd, dict) else ""
    print(f"== order={oid}  line={lid}  current note={old_note!r}")

    test_note = "[TEST] 切片中段，老闆指定"
    print("\n-- invoke update_order_lines with note --")
    s, body = run_action(h, ORDERING_APP, "update_order_lines", {
        "order_id": oid,
        "lines": [{"id": lid, "qty": float(target.get("product_uom_qty") or 0), "note": test_note}],
    })
    print("status:", s, "result:", json.dumps((body or {}).get("result") or body, ensure_ascii=False)[:300])

    # verify
    fresh = qquery(h, ADMIN_APP, "sale_order_lines", [{"column": "id", "op": "eq", "value": lid}], 1)
    new_cd = fresh[0].get("custom_data") if fresh else None
    print("verify custom_data:", new_cd)
    ok = isinstance(new_cd, dict) and new_cd.get("note") == test_note
    print("PASS" if ok else "FAIL")

    # cleanup
    print("\n== cleanup, restore note --")
    run_action(h, ORDERING_APP, "update_order_lines", {
        "order_id": oid,
        "lines": [{"id": lid, "qty": float(target.get("product_uom_qty") or 0), "note": old_note}],
    })
    after = qquery(h, ADMIN_APP, "sale_order_lines", [{"column": "id", "op": "eq", "value": lid}], 1)
    print("restored:", after[0].get("custom_data") if after else None)


if __name__ == "__main__":
    main()

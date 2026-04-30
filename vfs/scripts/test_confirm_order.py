"""Smoke-test confirm_order action (use_dev=true, no publish needed).

Flow:
  1. Find a draft sale_order
  2. For each line's template, find its first variant; ensure stock_quants has >= line qty
     (top-up via PATCH or seed via POST)
  3. Call confirm_order action
  4. Verify: sale_orders.state == 'sale', stock_pickings inserted, stock_moves inserted
  5. Cleanup: revert sale_orders.state to 'draft', delete created picking/moves, restore quants

Usage:
  set -a && source .env && set +a && python3 vfs/scripts/test_confirm_order.py [order_id]
"""
import json, os, sys, time

sys.path.insert(0, os.path.dirname(__file__))
from test_lib import api_login, query, qquery, patch, post, run_action, ADMIN_APP


def main():
    h = api_login()
    target_oid = sys.argv[1] if len(sys.argv) > 1 else None

    if target_oid:
        orders = qquery(h, ADMIN_APP, "sale_orders", [{"column": "id", "op": "eq", "value": target_oid}], 1)
    else:
        orders = qquery(h, ADMIN_APP, "sale_orders", [{"column": "state", "op": "eq", "value": "draft"}], 5)
    if not orders:
        print("no draft order found"); return
    order = orders[0]; oid = order["id"]
    print(f"== test target: order={oid} state={order.get('state')} customer={order.get('customer_id')}")

    lines = qquery(h, ADMIN_APP, "sale_order_lines", [{"column": "order_id", "op": "eq", "value": oid}], 100)
    print(f"   lines: {len(lines)}")

    seeded_quant_ids = []
    patched_quants = []
    locs = query(h, ADMIN_APP, "stock_locations", 50)
    loc_id = next((x["id"] for x in (locs or []) if x.get("usage") == "internal"), None) or (locs[0]["id"] if locs else None)

    for l in lines:
        raw_pid = l.get("product_id") or l.get("product_template_id")
        req = float(l.get("product_uom_qty") or 0)
        if not raw_pid or req <= 0:
            continue
        as_variant = qquery(h, ADMIN_APP, "product_products", [{"column": "id", "op": "eq", "value": raw_pid}], 1)
        variants = as_variant if as_variant else qquery(h, ADMIN_APP, "product_products", [{"column": "product_tmpl_id", "op": "eq", "value": raw_pid}], 50)
        if not variants:
            print(f"   [skip] no variant for {raw_pid} ({l.get('name')})"); continue

        total = 0.0
        all_existing = []
        for v in variants:
            existing = qquery(h, ADMIN_APP, "stock_quants", [{"column": "product_id", "op": "eq", "value": v["id"]}], 5)
            for q in existing:
                total += float(q.get("quantity") or 0)
                all_existing.append(q)
        if total >= req:
            continue

        if all_existing:
            q0 = all_existing[0]
            old = float(q0.get("quantity") or 0)
            new_qty = old + (req - total) + 100
            patch(h, ADMIN_APP, "stock_quants", q0["id"], {"quantity": new_qty})
            patched_quants.append((q0["id"], old))
            print(f"   [topup] {l.get('name')} quant {q0['id']} {old} -> {new_qty}")
        else:
            if not loc_id:
                print(f"   [skip] no internal location for {l.get('name')}"); continue
            vid = variants[0]["id"]
            s, b = post(h, ADMIN_APP, "stock_quants", {"product_id": vid, "location_id": loc_id, "quantity": req + 100})
            if b and b.get("id"):
                seeded_quant_ids.append(b["id"])
                print(f"   [seed] {l.get('name')} variant={vid} qty={req+100}")
            else:
                print(f"   [seed-fail] {l.get('name')} status={s} body={b}")

    print("\n== invoke confirm_order ==")
    s, body = run_action(h, ADMIN_APP, "confirm_order", {"order_ids": [oid]})
    print(f"status={s}")
    result = (body or {}).get("result") if isinstance(body, dict) else None
    print(json.dumps(result or body, ensure_ascii=False, indent=2)[:2500])

    ok = bool(result and result.get("confirmed"))
    picking_id = None
    move_ids = []
    if ok:
        picking_id = result["results"][0].get("picking_id")
        move_ids = [m.get("move_id") for m in (result["results"][0].get("moves") or []) if m.get("move_id")]

    time.sleep(1)
    print("\n== verify state ==")
    fresh = qquery(h, ADMIN_APP, "sale_orders", [{"column": "id", "op": "eq", "value": oid}], 1)
    print("sale_orders.state =", fresh[0].get("state") if fresh else "(?)")
    if picking_id:
        p = qquery(h, ADMIN_APP, "stock_pickings", [{"column": "id", "op": "eq", "value": picking_id}], 1)
        print("picking:", p)
    if move_ids:
        for mid in move_ids[:3]:
            m = qquery(h, ADMIN_APP, "stock_moves", [{"column": "id", "op": "eq", "value": mid}], 1)
            print("move:", m)

    print("\n== cleanup ==")
    if ok:
        patch(h, ADMIN_APP, "sale_orders", oid, {"state": "draft"})
        for mid in move_ids:
            from test_lib import _req, API_BASE
            _req("DELETE", f"{API_BASE}/proxy/{ADMIN_APP}/stock_moves/{mid}", h)
        if picking_id:
            from test_lib import _req, API_BASE
            _req("DELETE", f"{API_BASE}/proxy/{ADMIN_APP}/stock_pickings/{picking_id}", h)
        print("reverted state, deleted picking + moves")
    for qid, old in patched_quants:
        patch(h, ADMIN_APP, "stock_quants", qid, {"quantity": old})
    for qid in seeded_quant_ids:
        from test_lib import _req, API_BASE
        _req("DELETE", f"{API_BASE}/proxy/{ADMIN_APP}/stock_quants/{qid}", h)
    print("cleaned up", len(patched_quants), "patched +", len(seeded_quant_ids), "seeded quants")


if __name__ == "__main__":
    main()

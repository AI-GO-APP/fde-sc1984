def execute(ctx):
    user_email = ctx.params.get("user_email", "")
    if not user_email:
        ctx.response.json({"orders": []})
        return

    try:
        customers = ctx.db.query("customers", limit=1000) or []
    except Exception:
        ctx.response.json({"orders": []})
        return

    customer_id = None
    for c in customers:
        if c.get("email") == user_email:
            customer_id = str(c.get("id", ""))
            break

    if not customer_id:
        ctx.response.json({"orders": []})
        return

    try:
        all_orders = ctx.db.query(
            "sale_orders", limit=500,
            order_by=[{"column": "date_order", "direction": "desc"}]
        ) or []
    except Exception:
        ctx.response.json({"orders": []})
        return

    my_orders = [o for o in all_orders if str(o.get("customer_id") or "") == customer_id]

    try:
        all_lines = ctx.db.query("sale_order_lines", limit=5000) or []
    except Exception:
        all_lines = []

    result = []
    for order in my_orders:
        oid = str(order.get("id", ""))
        lines = [l for l in all_lines if str(l.get("order_id") or "") == oid]
        result.append({"order": order, "lines": lines})

    ctx.response.json({"orders": result})

def execute(ctx):
    user_email = ctx.params.get("user_email", "")
    if not user_email:
        ctx.response.json({"pickings": []})
        return

    try:
        customers = ctx.db.query("customers", limit=1000) or []
    except Exception:
        ctx.response.json({"pickings": []})
        return

    customer_id = None
    for c in customers:
        if c.get("email") == user_email:
            customer_id = str(c.get("id", ""))
            break

    if not customer_id:
        ctx.response.json({"pickings": []})
        return

    try:
        all_pickings = ctx.db.query(
            "stock_pickings", limit=500,
            order_by=[{"column": "scheduled_date", "direction": "desc"}]
        ) or []
    except Exception:
        ctx.response.json({"pickings": []})
        return

    mine = [p for p in all_pickings if str(p.get("customer_id") or "") == customer_id]

    try:
        all_moves = ctx.db.query("stock_moves", limit=5000) or []
    except Exception:
        all_moves = []

    result = []
    for p in mine:
        pid = str(p.get("id", ""))
        moves = [m for m in all_moves if str(m.get("picking_id") or "") == pid]
        result.append({"picking": p, "moves": moves})

    ctx.response.json({"pickings": result})

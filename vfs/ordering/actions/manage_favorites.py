def execute(ctx):
    op = ctx.params.get("op")
    customer_id = str(ctx.params.get("customer_id", ""))
    product_tmpl_id = str(ctx.params.get("product_tmpl_id", ""))
    record_id = str(ctx.params.get("record_id", ""))

    if op == "list":
        rows = ctx.db.query_object("customer_favorite_products", limit=5000) or []
        mine = [r for r in rows if str(r.get("customer_id", "")) == customer_id]
        ctx.response.json({"favorites": mine})

    elif op == "add":
        result = ctx.db.insert_object("customer_favorite_products", {
            "customer_id": customer_id,
            "product_tmpl_id": product_tmpl_id,
        })
        ctx.response.json({"record": result})

    elif op == "remove":
        ctx.db.delete_object("customer_favorite_products", record_id)
        ctx.response.json({"ok": True})

    else:
        ctx.response.json({"error": "unknown op"})

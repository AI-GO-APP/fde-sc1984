def execute(ctx):
    op = ctx.params.get("op")
    customer_id = str(ctx.params.get("customer_id", ""))
    product_tmpl_id = str(ctx.params.get("product_tmpl_id", ""))
    record_id = str(ctx.params.get("record_id", ""))
    default_note = ctx.params.get("default_note")

    if op == "list":
        rows = ctx.db.query_object("customer_favorite_products", customer_id=customer_id, limit=5000) or []
        ctx.response.json({"favorites": rows})

    elif op == "add":
        # 同個 (customer, product) 去重：若已存在則更新 default_note 而非重複插入
        existing = ctx.db.query_object(
            "customer_favorite_products",
            customer_id=customer_id, product_tmpl_id=product_tmpl_id, limit=1,
        ) or []
        if existing:
            rid = existing[0]["id"]
            if default_note is not None:
                ctx.db.update_object("customer_favorite_products", rid, {"default_note": default_note})
            ctx.response.json({"record": {**existing[0], "default_note": default_note if default_note is not None else existing[0].get("default_note")}})
            return
        payload = {"customer_id": customer_id, "product_tmpl_id": product_tmpl_id}
        if default_note is not None:
            payload["default_note"] = default_note
        result = ctx.db.insert_object("customer_favorite_products", payload)
        ctx.response.json({"record": result})

    elif op == "set_note":
        # 設定（或清除）某品項的常用備註；如該品項尚未在收藏，則建立一筆
        if not record_id:
            existing = ctx.db.query_object(
                "customer_favorite_products",
                customer_id=customer_id, product_tmpl_id=product_tmpl_id, limit=1,
            ) or []
            if existing:
                rid = existing[0]["id"]
                ctx.db.update_object("customer_favorite_products", rid, {"default_note": default_note or ""})
                ctx.response.json({"record_id": rid})
                return
            result = ctx.db.insert_object("customer_favorite_products", {
                "customer_id": customer_id,
                "product_tmpl_id": product_tmpl_id,
                "default_note": default_note or "",
            })
            ctx.response.json({"record_id": (result or {}).get("id")})
            return
        ctx.db.update_object("customer_favorite_products", record_id, {"default_note": default_note or ""})
        ctx.response.json({"record_id": record_id})

    elif op == "remove":
        ctx.db.remove_object("customer_favorite_products", record_id)
        ctx.response.json({"ok": True})

    else:
        ctx.response.json({"error": "unknown op"})

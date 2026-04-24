def execute(ctx):
    name = (ctx.params.get("name") or "").strip()
    if not name:
        ctx.response.json({"error": "品名為必填"})
        return

    code = (ctx.params.get("default_code") or "").strip()
    categ_id = ctx.params.get("categ_id") or None

    data = {"name": name, "sale_ok": False, "active": True}
    if code:
        data["default_code"] = code
    if categ_id:
        data["categ_id"] = categ_id

    try:
        prod = ctx.db.insert("product_templates", data)
    except Exception as e:
        ctx.response.json({"error": str(e)})
        return

    if not prod or not prod.get("id"):
        ctx.response.json({"error": "建立產品失敗"})
        return

    ctx.response.json({"id": str(prod["id"]), "name": name})

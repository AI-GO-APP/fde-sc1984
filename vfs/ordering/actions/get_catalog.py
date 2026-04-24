def execute(ctx):
    try:
        categories = ctx.db.query("product_categories", limit=500) or []
    except Exception:
        categories = []

    try:
        templates = ctx.db.query("product_templates", limit=2000) or []
    except Exception:
        templates = []

    try:
        uoms = ctx.db.query("uom_uom", limit=200) or []
    except Exception:
        uoms = []

    active_cats = [r for r in categories if r.get("active") != False]
    active_tmpl = [r for r in templates if r.get("active") != False and r.get("sale_ok") != False]
    active_uoms = [r for r in uoms if r.get("active") != False]

    ctx.response.json({
        "categories": active_cats,
        "templates": active_tmpl,
        "uoms": active_uoms,
    })

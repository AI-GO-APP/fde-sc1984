def execute(ctx):
    results = {}

    # 1. ctx.db.query - 標準 Odoo 表
    try:
        rows = ctx.db.query("hr_employees", limit=2)
        results["query_odoo"] = {"ok": True, "count": len(rows or [])}
    except Exception as e:
        results["query_odoo"] = {"ok": False, "error": str(e)}

    # 2. ctx.db.query - x_ 客製表
    try:
        rows = ctx.db.query("x_app_settings", limit=2)
        results["query_x_table"] = {"ok": True, "count": len(rows or [])}
    except Exception as e:
        results["query_x_table"] = {"ok": False, "error": str(e)}

    # 3. ctx.db.update 可用性
    results["has_update"] = hasattr(ctx.db, "update")

    # 4. ctx.db.delete 可用性
    results["has_delete"] = hasattr(ctx.db, "delete")

    # 5. ctx.db.query_object 可用性
    results["has_query_object"] = hasattr(ctx.db, "query_object")

    ctx.response.json(results)

def execute(ctx):
    results = {}
    try:
        rows = ctx.db.query_object("x_holiday_settings", limit=2)
        results["x_holiday_settings"] = {"ok": True, "sample": (rows or [])[:2]}
    except Exception as e:
        results["x_holiday_settings"] = {"ok": False, "error": str(e)}
    try:
        rows2 = ctx.db.query_object("x_app_settings", limit=5)
        results["x_app_settings"] = {"ok": True, "sample": (rows2 or [])[:5]}
    except Exception as e:
        results["x_app_settings"] = {"ok": False, "error": str(e)}
    try:
        rows3 = ctx.db.query_object("x_price_log", limit=2)
        results["x_price_log"] = {"ok": True, "sample": (rows3 or [])[:2]}
    except Exception as e:
        results["x_price_log"] = {"ok": False, "error": str(e)}
    ctx.response.json(results)

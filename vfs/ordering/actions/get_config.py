def execute(ctx):
    # 假日設定（跨 app data object）
    try:
        holiday_rows = ctx.db.query_object("x_holiday_settings", limit=1000) or []
    except Exception:
        holiday_rows = []
    holidays = [str(r.get("date", "")) for r in holiday_rows if r.get("date")]

    # 截止時間（跨 app data object）
    try:
        setting_rows = ctx.db.query_object("x_app_settings", limit=100) or []
    except Exception:
        setting_rows = []
    cutoff_time = ""
    for r in setting_rows:
        if r.get("key") == "order_cutoff_time":
            cutoff_time = str(r.get("value", ""))
            break

    # 參考價格（跨 app data object，tmpl_uuid 直接是 template ID）
    try:
        log_rows = ctx.db.query_object("x_price_log", limit=5000) or []
    except Exception:
        log_rows = []
    price_map = {}
    for log in log_rows:
        tmpl_id = str(log.get("tmpl_uuid") or "")
        if not tmpl_id:
            continue
        date = str(log.get("effective_date") or "")
        price = float(log.get("price") or 0)
        if tmpl_id not in price_map or date > price_map[tmpl_id]["date"]:
            price_map[tmpl_id] = {"price": price, "date": date}

    ctx.response.json({
        "holidays": holidays,
        "cutoff_time": cutoff_time,
        "price_map": price_map,
    })

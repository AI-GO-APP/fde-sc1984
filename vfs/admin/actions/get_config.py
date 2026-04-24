def execute(ctx):
    # 假日設定
    try:
        holiday_rows = ctx.db.query("x_holiday_settings", limit=1000) or []
    except Exception:
        holiday_rows = []
    holidays = [str(r.get("date", "")) for r in holiday_rows if r.get("date")]

    # 截止時間
    try:
        setting_rows = ctx.db.query("x_app_settings", limit=100) or []
    except Exception:
        setting_rows = []
    cutoff_time = ""
    for r in setting_rows:
        if r.get("key") == "cutoff_time":
            cutoff_time = str(r.get("value", ""))
            break

    # product_product → tmpl 對應（admin ctx.db 可存取）
    try:
        pp_rows = ctx.db.query("product_product", limit=2000) or []
    except Exception:
        pp_rows = []
    tmpl_to_prod = {}
    prod_to_tmpl = {}
    for r in pp_rows:
        if r.get("active") == False:
            continue
        raw = r.get("product_tmpl_id")
        tmpl_id = str(raw[0] if isinstance(raw, list) else (raw or ""))
        prod_id = str(r.get("id", ""))
        if tmpl_id and prod_id:
            tmpl_to_prod[tmpl_id] = prod_id
            prod_to_tmpl[prod_id] = tmpl_id

    # 參考價格（最新在前）
    try:
        log_rows = ctx.db.query(
            "x_product_product_price_log", limit=5000,
            order_by=[{"column": "effective_date", "direction": "desc"}]
        ) or []
    except Exception:
        log_rows = []
    price_map = {}
    for log in log_rows:
        prod_id = str(log.get("product_product_id") or "")
        tmpl_id = prod_to_tmpl.get(prod_id, "")
        if not tmpl_id:
            continue
        date = str(log.get("effective_date") or "")
        price = float(log.get("lst_price") or 0)
        if tmpl_id not in price_map or date > price_map[tmpl_id]["date"]:
            price_map[tmpl_id] = {"price": price, "date": date}

    ctx.response.json({
        "holidays": holidays,
        "cutoff_time": cutoff_time,
        "tmpl_to_prod": tmpl_to_prod,
        "price_map": price_map,
    })

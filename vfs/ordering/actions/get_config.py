def execute(ctx):
    """
    回傳所有無法透過 /ext/proxy/ 取得的 runtime 設定資料：
    - holidays: 休假日期字串列表
    - cutoff_time: 截止時間字串
    - price_log: 每筆 {product_product_id, lst_price, effective_date}
    - tmpl_to_prod / prod_to_tmpl: product_product 雙向對應
    """
    # 假日
    holiday_rows = ctx.db.query("x_holiday_settings", limit=500) or []
    holidays = [str(r.get("date", "")) for r in holiday_rows if r.get("date")]

    # 截止時間
    setting_rows = ctx.db.query("x_app_settings", limit=100) or []
    cutoff_time = ""
    for r in setting_rows:
        if r.get("key") == "cutoff_time":
            cutoff_time = str(r.get("value", ""))
            break

    # 參考價格日誌
    log_rows = ctx.db.query("x_product_product_price_log", limit=5000) or []
    price_log = [
        {
            "product_product_id": str(r.get("product_product_id", "")),
            "lst_price": r.get("lst_price", 0),
            "effective_date": str(r.get("effective_date", "")),
        }
        for r in log_rows
    ]

    # product_product 對應（Python 側過濾 active，避免前端 Boolean filter 500）
    prod_rows = ctx.db.query("product_product", limit=5000) or []
    tmpl_to_prod = {}
    prod_to_tmpl = {}
    for r in prod_rows:
        if not r.get("active", True):
            continue
        raw = r.get("product_tmpl_id")
        tmpl_id = str(raw[0] if isinstance(raw, list) else (raw or ""))
        prod_id = str(r.get("id", ""))
        if tmpl_id and prod_id:
            tmpl_to_prod[tmpl_id] = prod_id
            prod_to_tmpl[prod_id] = tmpl_id

    ctx.response.json({
        "holidays": holidays,
        "cutoff_time": cutoff_time,
        "price_log": price_log,
        "tmpl_to_prod": tmpl_to_prod,
        "prod_to_tmpl": prod_to_tmpl,
    })

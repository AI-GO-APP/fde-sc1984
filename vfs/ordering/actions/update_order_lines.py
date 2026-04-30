def execute(ctx):
    """修改訂單明細數量與備註，並重算 sale_orders.amount_total。
    params: { order_id: str, lines: [{id: str, qty: number, note?: str}] }
    note 寫入 sale_order_lines.custom_data.note（保留其他既有 custom_data 欄位）。
    """
    order_id = ctx.params.get("order_id", "")
    lines = ctx.params.get("lines", [])

    if not order_id or not lines:
        ctx.response.json({"error": "缺少必要參數"})
        return

    line_updates = {item["id"]: item for item in lines if item.get("id") is not None}

    # 取得現有 lines 以保留 custom_data 其他欄位
    existing = ctx.db.query("sale_order_lines", limit=500) or []
    existing_by_id = {str(l.get("id")): l for l in existing}

    for line_id, payload in line_updates.items():
        try:
            patch = {"product_uom_qty": payload.get("qty", 0)}
            if "note" in payload:
                cur = existing_by_id.get(str(line_id), {}).get("custom_data") or {}
                if not isinstance(cur, dict):
                    cur = {}
                patch["custom_data"] = {**cur, "note": (payload.get("note") or "").strip()}
            ctx.db.update("sale_order_lines", line_id, patch)
        except Exception as e:
            ctx.response.json({"error": f"更新明細 {line_id} 失敗：{str(e)}"})
            return

    # 重取所有明細，重算金額
    def _oid(val):
        if isinstance(val, list): return str(val[0])
        return str(val) if val is not None else ""

    all_lines = ctx.db.query("sale_order_lines", limit=500)
    order_lines = [l for l in (all_lines or []) if _oid(l.get("order_id")) == str(order_id)]
    amount_total = round(sum(
        float(l.get("product_uom_qty") or 0) * float(l.get("price_unit") or 0)
        for l in order_lines
    ), 2)

    # 寫回訂單總金額
    try:
        ctx.db.update("sale_orders", order_id, {"amount_total": amount_total})
    except Exception as e:
        ctx.response.json({"error": f"更新訂單金額失敗：{str(e)}"})
        return

    # 重取該訂單確認寫入結果
    all_orders = ctx.db.query("sale_orders", limit=500)
    order = next((o for o in (all_orders or []) if str(o.get("id")) == str(order_id)), None)
    confirmed_total = float(order.get("amount_total") or 0) if order else amount_total

    ctx.response.json({"updated": len(line_updates), "amount_total": confirmed_total})

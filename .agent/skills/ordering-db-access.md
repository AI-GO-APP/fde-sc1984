---
name: ordering-db-access
trigger: always_on
description: "說明此專案所有資料庫操作必須走 server-side action，以及各表的實際欄位名稱。"
---

# Ordering App 資料庫存取規範

## 核心規則

**所有資料庫操作一律透過 Python server-side action（ctx.db），禁止前端直接呼叫 /ext/proxy/。**

原因：`/ext/proxy/` 對 x_ 前綴 Odoo 自訂模型以及 `product_product` 均回傳 500。

## ctx.db.query 能力

```python
# 基本查詢
rows = ctx.db.query("table_name", limit=1000)

# 支援排序（order_by）
rows = ctx.db.query(
    "x_product_product_price_log", limit=5000,
    order_by=[{"column": "effective_date", "direction": "desc"}]
)
```

- **不支援 server-side filter**：必須在 Python 裡過濾
- **不支援移除 limit**：設夠大的 limit，配合 order_by 確保關鍵資料在前面

## 各表欄位（來自 refs API 實測）

| 表名 | 欄位 |
|------|------|
| `x_holiday_settings` | id, **date**, reason |
| `x_app_settings` | id, **key**, **value** |
| `x_product_product_price_log` | id, **product_product_id**, **lst_price**, **effective_date** |
| `x_price_log` | id, product_id, price, effective_date, created_at |
| `product_product` | id, **product_tmpl_id**, **active** |
| `product_templates` | id, name, default_code, sale_ok, active, categ_id, list_price, uom_id |
| `product_categories` | id, name, parent_id, active |
| `uom_uom` | id, name, active |
| `customers` | id, name, email, ref, customer_type |
| `sale_orders` | id, name, state, date_order, customer_id, note, amount_total |
| `sale_order_lines` | id, order_id, product_id, product_template_id, product_uom_qty, price_unit, name, delivery_date |

## 現有 Action 分工

| Action | 用途 |
|--------|------|
| `get_config` | x_holiday_settings + x_app_settings + product_product + x_product_product_price_log |
| `get_catalog` | product_templates + product_categories + uom_uom |
| `get_orders` | customers + sale_orders + sale_order_lines（by user_email） |
| `place_order` | 新增 sale_order + sale_order_lines |
| `update_order_lines` | 修改 sale_order_lines 數量 |

## 如何確認欄位名稱

```bash
# 取得 ordering app 所有 refs 及欄位
TOKEN=$(curl -s -X POST "https://ordering.apps.ai-go.app/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$AIGO_EMAIL\",\"password\":\"$AIGO_PASSWORD\"}" | python3 -c "import sys,json; print(json.load(sys.stdin).get('access_token',''))")

curl -s -H "Authorization: Bearer $TOKEN" \
  "https://ordering.apps.ai-go.app/api/v1/refs/apps/$ORDERING_APP_ID" \
  | python3 -c "import sys,json; [print(r['table_name'], '|', r.get('published_columns',[])) for r in json.load(sys.stdin)]"
```

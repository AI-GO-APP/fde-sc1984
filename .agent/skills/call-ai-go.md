---
name: call-ai-go
description: 需要串接 AI-GO、修 AI-GO 的 bug、新增功能，或需要了解 AI-GO 資料庫存取規範時使用
trigger: model_decision
---

# 呼叫 AI-GO Agent

## 呼叫方式

```sh
cd /data/urfit-tech/AI-GO && claude -p "<完整任務描述>"
```

背景執行（不阻塞當前工作）：

```sh
cd /data/urfit-tech/AI-GO && claude -p "<完整任務描述>" > /tmp/ai-go-result.txt 2>&1 &
echo "AI-GO agent PID: $!"
```

## 任務描述要包含

- 問題的完整背景與重現步驟
- 相關的 endpoint、模組或欄位名稱
- 預期行為 vs 實際行為（bug 情境）
- 若是新功能，說明輸入/輸出格式

## 不要做的事

- 不要自己去讀 AI-GO 的程式碼再動手改，直接呼叫 agent 處理
- 不要把 AI-GO 的實作細節帶進自己的邏輯，對方的 API 是契約

---

# AI-GO 資料庫存取規範

## 授權層：AppDataReference

所有表存取都必須通過 `AppDataReference` 授權驗證。沒有對應記錄就會回 403，與 DB 層無關。

**REFS 的唯一定義位置：**
- `vfs/scripts/db_ordering.py` — Ordering app
- `vfs/scripts/db_admin.py` — Admin app

部署時 `deploy_lib.py` 的 `ensure_references()` 會自動 create/patch，`publish_app()` 會發布。

## 兩種 sandbox 行為

| 情境 | 路徑 | use_published | 額外條件 |
|------|------|---------------|---------|
| `ctx.db.query`（Action 沙箱） | action_context → _proxy_query_internal | False | AppDataReference 存在 + read 權限 |
| `ext/proxy/` HTTP | ext_proxy → _proxy_query_internal | True | 同上，且 published_columns 不得為 null |

→ **`ctx.db.query` 不需要發布**，ref 存在就能用。  
→ **`ext/proxy/` 需要發布**，deploy 流程的 `publish_app()` 負責這步。

## 常見錯誤對照

| 錯誤訊息 | 原因 | 修法 |
|---------|------|------|
| `UndefinedTableError` | 表名打錯（平台用複數，如 `product_products`） | 修正 db_*.py 的 table_name |
| `App 未被授權存取表 'x'` | AppDataReference 不存在 | 加進 db_*.py → 重新部署 |
| `表 'x' 的引用尚未發布` | ref 存在但未 publish | 執行 deploy（publish_app 會發布） |

## 表名規則

平台對 Odoo 表名統一用**複數**：

| Odoo 模型 | 平台表名 |
|-----------|---------|
| `product.product` | `product_products` |
| `product.template` | `product_templates` |
| `sale.order` | `sale_orders` |
| `sale.order.line` | `sale_order_lines` |

x_ 前綴客製表用 `ctx.db.query_object`，不走 proxy 授權層。

## ctx.db.query_object（x_ 表）

```python
rows = ctx.db.query_object("x_holiday_settings", limit=1000)
```

- 回傳 flat dict（無 data wrapper）
- x_ 表已 promote（app_id = null），任何 app action 皆可存取
- 不需要建立 AppDataReference

## ctx.db 完整方法（實測 2026-04-27）

| 方法 | 存在 | 說明 |
|------|------|------|
| `ctx.db.query(table, limit=N, order_by=[...])` | ✅ | 標準 Odoo 表；x_ 表不可用 |
| `ctx.db.query_object(table, limit=N)` | ✅ | x_ 自訂表專用 |
| `ctx.db.insert(table, data)` | ✅ | 新增記錄 |
| `ctx.db.update(table, id, data)` | ✅ | 更新記錄 |
| `ctx.db.remove(table, row_id)` | ✅ | 硬刪除，回傳 `{"success": True}`；注意是 remove 不是 delete |
| `ctx.db.delete` | ❌ | 不存在，別用這個名稱 |

**軟刪除**：沒有通用軟刪除 API，用 `ctx.db.update(table, id, {"active": false})` 代替。
**前端刪除**：`DELETE /proxy/{app_id}/{table}/{id}` 完全支援（`db.ts` 的 `deleteRow` 就是這條）。

**x_ 表用錯方法的錯誤**：`ctx.db.query("x_xxx")` 會拋 SQL transaction error，必須改用 `ctx.db.query_object`。

## Action 端點（實測確認）

| App 類型 | 端點 |
|---------|------|
| Admin（內部 app） | `POST /api/v1/actions/apps/{app_id}/run/{action_name}` |
| Ordering（外部 app） | `POST /api/v1/ext/actions/run/{action_name}` |

⚠️ Admin `db.ts` 的 `runAction` 原本 URL 格式錯誤（少了 `apps/`），已於 2026-04-27 修正。

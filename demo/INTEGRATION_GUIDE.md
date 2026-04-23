---
source: https://www.ai-go.app/docs/integration-guide
fetched: 2026-04-23
---

# AI GO Integration Guide

## Core API Architecture

The AI GO platform provides three distinct proxy endpoints for data access, each with different authentication mechanisms and use cases:

### Authentication Models

- **API Key (Server-to-Server):** Format `sk_live_` + 64 hex characters, transmitted via `X-API-Key` header for backend integrations.
- **Custom App User Token:** Bearer token authentication for frontend-facing applications, obtained through registration/login endpoints.
- **Tenant Isolation:** All data queries automatically enforce row-level filtering by `tenant_id`.

---

## System Data Tables (Proxy)

### Endpoints

| Method | URL | Description |
|--------|-----|-------------|
| GET | `/api/v1/ext/proxy/{table}?limit=&offset=` | 簡易查詢 |
| POST | `/api/v1/ext/proxy/{table}/query` | 進階查詢（filter / order_by） |
| POST | `/api/v1/ext/proxy/{table}` | 新增（body: `{ data: {...} }`） |
| PUT | `/api/v1/ext/proxy/{table}/{row_id}` | 更新（body: `{ data: {...} }`，merge mode） |
| DELETE | `/api/v1/ext/proxy/{table}/{row_id}` | 刪除 |

> **注意**: 內部 App 使用 `/api/v1/proxy/{app_id}/`；外部 Custom App 使用 `/api/v1/ext/proxy/`。

### Advanced Query Body

```json
{
  "filters": [
    { "column": "status", "op": "eq", "value": "active" }
  ],
  "order_by": [{ "column": "created_at", "direction": "desc" }],
  "select_columns": ["id", "name", "email"],
  "limit": 50,
  "offset": 0
}
```

### Supported Filter Operators

`eq` `ne` `gt` `gte` `lt` `lte` `like` `ilike` `in` `is_null` `is_not_null`

Multiple filters use AND logic only; OR / nested grouping not supported.

### Known Limitations (from field testing)

- Boolean filter（`value: true/false`）在某些表（如 `product_product`）會導致 500，需在 Python action 側過濾或改前端過濾
- `x_` 前綴的 Odoo 自訂模型透過 `/ext/proxy/` 可能返回 500（即使已登記 ref），應改用 server-side action 取得

---

## Custom Tables (AI-Go JSONB Dynamic Tables)

Access via `/api/v1/open/data/objects` — separate from Odoo proxy tables.

```
GET    /api/v1/open/data/objects
GET    /api/v1/open/data/objects/{obj_id}/records
POST   /api/v1/open/data/objects/{obj_id}/records
PATCH  /api/v1/open/data/records/{record_id}
DELETE /api/v1/open/data/records/{record_id}
```

Body format: `{ "data": { "field": "value" } }`

---

## Reference System

Before accessing a table, apps must declare references:

```
POST /api/v1/refs/apps/{app_id}
{
  "table_name": "customers",
  "columns": ["name", "email", "phone"],
  "permissions": ["read", "create", "update"]
}
```

Permission mapping: `read` → GET/query, `create` → POST, `update` → PUT/PATCH, `delete` → DELETE.

---

## Server-Side Actions

Actions run in a Python sandbox with `ctx.db` access (can reach all tables including x_ tables).

### Action URL

| App Type | URL Format |
|----------|-----------|
| External Custom App | `/api/v1/ext/actions/{APP_SLUG}/{action_name}` |
| Internal App | `/api/v1/actions/run/{app_id}/{action_name}` |

> **重要**: External app 的正確格式是 `/ext/actions/{APP_SLUG}/{action_name}`，  
> **不是** `/ext/actions/run/{action_name}`（會 500）。

### Frontend Call

```typescript
const resp = await fetch(`/api/v1/ext/actions/${appSlug}/${actionName}`, {
  method: 'POST',
  headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
  body: JSON.stringify({ params: { key: 'value' } }),
});
const result = await resp.json();
// result.data 為 action 回傳的 JSON
```

### Action Implementation (Python)

```python
def execute(ctx):
    rows = ctx.db.query("some_table", limit=100)
    ctx.response.json({ "rows": rows })
```

`ctx.db` 支援：`query(table, limit=N)`、`insert(table, data)`、`update(table, id, data)`。

---

## Type Auto-Conversion

Proxy automatically casts:
- `YYYY-MM-DD` string → `date`
- ISO timestamp string → `datetime`
- UUID-format string in `*_id` fields → UUID
- Empty string in ID fields → `NULL`

---

## Field Name Constraints

Only `^[a-zA-Z_][a-zA-Z0-9_]*$` pattern allowed (prevents SQL injection).

---

## Approval Workflow

Write operations hitting approval conditions return:

```json
{
  "id": "uuid",
  "updated": false,
  "approval_status": "pending",
  "approval_request_id": "uuid"
}
```

Proxy operations do NOT trigger Odoo business document workflows (e.g. auto invoice creation).

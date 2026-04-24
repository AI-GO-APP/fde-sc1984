# CLAUDE.md

<!-- DISCIPLINE_START: rules -->
<!-- DISCIPLINE_END: rules -->

## 唯一參考標準

- `demo/` 資料夾（官方 SDK 模板）與 `demo/CUSTOM_APP_DEV_GUIDE.md`、`demo/INTEGRATION_GUIDE.md` 是**唯一技術參考標準**。
- **嚴禁修改 demo/ 資料夾。**
- `scripts/` 資料夾的舊 Python 腳本**只能參考業務邏輯流程**（如訂單欄位、資料關係），**不得照抄 API 呼叫方式、URL 或 payload 格式** — 這些已過時且有已知錯誤。

## 專案結構

```
vfs/
  admin/      ← Admin App 前端原始碼（真正的 TSX/TS 檔）
  ordering/   ← Ordering App 前端原始碼（真正的 TSX/TS 檔）
  scripts/
    deploy_admin.py    ← 讀 vfs/admin/ 上傳並發布
    deploy_ordering.py ← 讀 vfs/ordering/ 上傳並發布
demo/         ← AI-Go 官方模板參考（唯讀，禁止修改）
```

## 部署

```bash
set -a && source .env && set +a
python3 vfs/scripts/deploy_admin.py
python3 vfs/scripts/deploy_ordering.py
```

## 資料存取原則

- **前端不准寫死任何資料**，所有資料一律 runtime 從資料庫讀取
- Admin：Odoo 表透過 `/proxy/{APP_ID}/`，custom table 由 `db.ts` 動態查 UUID
- **Ordering：所有資料庫操作一律透過 server-side action（Python ctx.db），禁止前端直接呼叫 `/ext/proxy/`**
  - `/ext/proxy/` 對 x_ 自訂表及 `product_product` 均回傳 500
  - action ctx.db 支援所有表，包含 x_ 前綴的 Odoo 自訂模型
  - 各表實際欄位名稱與 action 分工見 `.agent/skills/ordering-db-access.md`
- deploy script 只負責上傳 VFS，不拉任何資料

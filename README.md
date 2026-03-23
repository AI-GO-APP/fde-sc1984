# FDE-SC1984 雄泉鮮食

蔬果批發營運管理系統，基於 [AI GO](https://aigo.com) 平台的 Custom App 架構。

## 專案結構

```
├── ordering/            ← Custom App 1：客戶點餐系統
│   ├── src/             ← React + Vite 前端
│   └── backend/         ← LINE Login 後端（Node.js/Express）
├── admin/               ← Custom App 2：管理後台
│   └── src/             ← React + Vite 前端
├── scripts/             ← 開發工具腳本（VFS 注入等）
├── docs/                ← 參考文件（資料模型）
└── .agents/             ← AI Agent 工作流程定義
```

## Custom Apps

### Ordering（客戶點餐）
- **用途**：客戶瀏覽商品、加入購物車、下單
- **技術**：React + TypeScript + Vite + Tailwind v4 + Zustand
- **認證**：AI GO Custom App Auth + LINE Login
- **後端**：Node.js Express（LINE OAuth token 交換）
- **API**：透過 AI GO Open Proxy 存取 Odoo 資料

### Admin（管理後台）
- **用途**：訂單管理、採購、庫存、出貨
- **技術**：React + TypeScript + Vite + Tailwind v4
- **API**：透過 AI GO Open Proxy 存取 Odoo 資料

## 開發

```bash
# Ordering App（port 5173）
cd ordering
cp .env.example .env     # 填入環境變數
npm install
npm run dev

# Ordering Backend（port 3001）
cd ordering/backend
cp .env.example .env     # 填入 LINE Channel Secret
npm install
npm run dev

# Admin App（port 5174）
cd admin
cp .env.example .env     # 填入環境變數
npm install
npm run dev
```

## 部署

每個 Custom App 獨立部署：
- `ordering/` → 建置後部署為靜態站點 + `ordering/backend/` 部署為 Node.js 服務
- `admin/` → 建置後部署為靜態站點

## Git 倉庫

- **Repository**: [FDE-SC1984](https://github.com/makarove-urfit/FDE-SC1984)

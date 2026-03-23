"""
雄泉訂單管理 Custom App — v6 P0 核心業務功能
- P0-1: 採購定價（供應商分群 + 定價 UI）
- P0-2: 配貨量調整 + 批次勾選
"""
import httpx, json, sys, os
sys.path.insert(0, os.path.dirname(__file__))
from v5_css import get_app_css, get_confirm_dialog, get_print_provider, get_data_provider
from v5_pages import dashboard, purchase_list, stock, delivery
from v6_pages import procurement, sales_orders

API_BASE = "https://ai-go.app/api/v1"
APP_ID   = "a04d5bd6-7382-41c9-9650-85ec9245f82f"
REFRESH_TOKEN = "vid5xfabw6pk"

def refresh_to_token() -> str:
    r = httpx.post(f"{API_BASE}/auth/refresh", json={"refresh_token": REFRESH_TOKEN}, timeout=15)
    return r.json().get("access_token","") if r.status_code==200 else ""

def ensure_references(h):
    r = httpx.get(f"{API_BASE}/refs/apps/{APP_ID}", headers=h, timeout=15)
    ex = {x["table_name"]:x for x in (r.json() if r.status_code==200 else [])}
    tables = [
        {"table_name":"sale_orders","columns":["id","name","state","date_order","customer_id","note","amount_untaxed","amount_tax","amount_total","created_at","client_order_ref"],"permissions":["read","update"]},
        {"table_name":"sale_order_lines","columns":["id","order_id","product_id","product_template_id","product_uom_qty","price_unit","name","delivery_date","qty_delivered","price_subtotal","sequence"],"permissions":["read","update"]},
        {"table_name":"customers","columns":["id","name","email","phone","customer_type","ref","contact_address","short_name"],"permissions":["read","update"]},
        {"table_name":"product_templates","columns":["id","name","default_code","sale_ok","active","categ_id","list_price","standard_price","uom_id"],"permissions":["read","update"]},
        {"table_name":"suppliers","columns":["id","name","ref","phone","contact_address","vat","status","supplier_type","active","contact_person","email"],"permissions":["read","create","update"]},
        {"table_name":"product_supplierinfo","columns":["id","supplier_id","product_tmpl_id","product_id","price","min_qty","product_code"],"permissions":["read","create"]},
        {"table_name":"purchase_orders","columns":["id","name","state","supplier_id","date_order","amount_total"],"permissions":["read","create","update"]},
        {"table_name":"purchase_order_lines","columns":["id","order_id","product_id","product_qty","price_unit","price_subtotal"],"permissions":["read","create","update"]},
        {"table_name":"stock_quants","columns":["id","product_id","quantity","reserved_quantity","location_id"],"permissions":["read","create","update"]},
        {"table_name":"product_products","columns":["id","product_tmpl_id","default_code","barcode","active"],"permissions":["read","create"]},
        {"table_name":"hr_employees","columns":["id","name","active","job_title","mobile_phone","department_id"],"permissions":["read"]},
        {"table_name":"stock_locations","columns":["id","name","usage","active"],"permissions":["read","create"]},
    ]
    for t in tables:
        tn=t["table_name"]
        if tn in ex:
            # 覆蓋模式：直接使用腳本定義的欄位，不與舊版合併，避免幽靈欄位殘留
            r2=httpx.patch(f"{API_BASE}/refs/{ex[tn]['id']}",headers=h,json={"columns":t["columns"],"permissions":t["permissions"]},timeout=15)
        else:
            r2=httpx.post(f"{API_BASE}/refs/apps/{APP_ID}",headers=h,json=t,timeout=15)
        print(f"  [{tn}] {r2.status_code}")

def get_db_ts() -> str:
    return r'''const API_BASE = (window as any).__API_BASE__ || '/api/v1';
const APP_ID = (window as any).__APP_ID__ || '';
function _h(): Record<string,string> {
  const h: Record<string,string> = {'Content-Type':'application/json'};
  const t = (window as any).__APP_TOKEN__ || '';
  if (t) h['Authorization'] = 'Bearer '+t;
  return h;
}
async function _r(resp: Response): Promise<any> {
  if (!resp.ok) { const b=await resp.json().catch(()=>({})); throw new Error(b.detail||'API Error ('+resp.status+')'); }
  return resp.json();
}
export async function query(table:string, opts?:{limit?:number;offset?:number}): Promise<any[]> {
  const p=new URLSearchParams(); if(opts?.limit)p.set('limit',String(opts.limit)); if(opts?.offset)p.set('offset',String(opts.offset));
  const qs=p.toString()?'?'+p.toString():'';
  return _r(await fetch(API_BASE+'/proxy/'+APP_ID+'/'+table+qs,{headers:_h(),credentials:'include'}));
}
export async function update(table:string,id:string,data:Record<string,any>): Promise<any> {
  return _r(await fetch(API_BASE+'/proxy/'+APP_ID+'/'+table+'/'+id,{method:'PATCH',headers:_h(),credentials:'include',body:JSON.stringify({data})}));
}
export async function insert(table:string,data:Record<string,any>): Promise<any> {
  return _r(await fetch(API_BASE+'/proxy/'+APP_ID+'/'+table,{method:'POST',headers:_h(),credentials:'include',body:JSON.stringify({data})}));
}
'''

def main():
    print("=== 雄泉訂單管理 v6 (P0 核心業務) ===")
    token = refresh_to_token()
    if not token: sys.exit("❌ Token")
    h = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

    print("\n[1/3] 權限...")
    ensure_references(h)

    print("\n[2/3] 組裝 VFS...")
    vfs = {}
    vfs["package.json"] = json.dumps({"name":"xiong-quan-admin","private":True,"version":"4.0.0","type":"module",
        "dependencies":{"react":"^18.2.0","react-dom":"^18.2.0","react-router-dom":"^6.22.0"},
        "devDependencies":{"@types/react":"^18.2.0","@types/react-dom":"^18.2.0","typescript":"^5.0.0"}},indent=2)
    vfs["src/main.tsx"] = 'import React from "react";\nimport ReactDOM from "react-dom/client";\nimport { HashRouter } from "react-router-dom";\nimport App from "./App";\nconst rootEl = (window as any).__CUSTOM_APP_ROOT__ || document.getElementById("root");\nReactDOM.createRoot(rootEl!).render(<React.StrictMode><HashRouter><App /></HashRouter></React.StrictMode>);\n'
    vfs["src/App.tsx"] = 'import { Routes, Route, Navigate } from "react-router-dom";\nimport DataProvider from "./data/DataProvider";\nimport DashboardPage from "./pages/admin/DashboardPage";\nimport PurchaseListPage from "./pages/admin/PurchaseListPage";\nimport ProcurementPage from "./pages/admin/ProcurementPage";\nimport StockPage from "./pages/admin/StockPage";\nimport SalesOrdersPage from "./pages/admin/SalesOrdersPage";\nimport DeliveryPage from "./pages/admin/DeliveryPage";\n\nexport default function App() {\n  return (\n    <DataProvider>\n    <Routes>\n      <Route path="/" element={<DashboardPage />} />\n      <Route path="/admin" element={<DashboardPage />} />\n      <Route path="/admin/purchase-list" element={<PurchaseListPage />} />\n      <Route path="/admin/procurement" element={<ProcurementPage />} />\n      <Route path="/admin/stock" element={<StockPage />} />\n      <Route path="/admin/sales-orders" element={<SalesOrdersPage />} />\n      <Route path="/admin/delivery" element={<DeliveryPage />} />\n      <Route path="*" element={<Navigate to="/" replace />} />\n    </Routes>\n    </DataProvider>\n  );\n}\n'
    vfs["src/App.css"] = get_app_css()
    vfs["src/db.ts"] = get_db_ts()
    vfs["src/components/ConfirmDialog.tsx"] = get_confirm_dialog()
    vfs["src/components/PrintProvider.tsx"] = get_print_provider()
    vfs["src/data/DataProvider.tsx"] = get_data_provider()
    # 頁面
    vfs["src/pages/admin/DashboardPage.tsx"] = dashboard()
    vfs["src/pages/admin/PurchaseListPage.tsx"] = purchase_list()
    vfs["src/pages/admin/ProcurementPage.tsx"] = procurement()  # ← v6 P0-1
    vfs["src/pages/admin/StockPage.tsx"] = stock()
    vfs["src/pages/admin/SalesOrdersPage.tsx"] = sales_orders()  # ← v6 P0-2
    vfs["src/pages/admin/DeliveryPage.tsx"] = delivery()
    # 輔助
    vfs["src/pages/_manifest.json"] = json.dumps({"/":{"title":"管理後台","order":0}},ensure_ascii=False,indent=2)
    vfs["src/data.json"] = "{}"
    vfs["src/db.json"] = "{}"
    vfs["actions/manifest.json"] = json.dumps({},indent=2)
    print(f"  檔案數: {len(vfs)}")

    print("\n  上傳...")
    r = httpx.put(f"{API_BASE}/builder/apps/{APP_ID}/source", headers=h, json={"vfs_state": vfs}, timeout=60)
    print(f"  上傳: {r.status_code}")
    if r.status_code != 200: print(f"  ERR: {r.text[:500]}")

    print("\n[3/3] 發布...")
    r = httpx.post(f"{API_BASE}/builder/apps/{APP_ID}/publish", headers=h, json={"published_assets": {}}, timeout=30)
    print(f"  發布: {r.status_code}")
    print("\n✅ v6 P0 核心業務功能版已上線")

if __name__ == "__main__":
    main()

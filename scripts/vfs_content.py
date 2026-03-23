"""
雄泉下單系統 — VFS 檔案內容

所有前端頁面、元件、樣式、Action 的原始碼。
由 inject_app.py 匯入使用。
"""
import json


def get_vfs() -> dict:
    """回傳完整的 VFS dict"""
    app_name = "雄泉下單系統"
    slug = "xiong-quan-ordering"

    vfs = {}

    # ── package.json ──
    vfs["package.json"] = json.dumps({
        "name": slug,
        "private": True,
        "version": "0.0.1",
        "type": "module",
        "dependencies": {
            "react": "^18.2.0",
            "react-dom": "^18.2.0",
            "lucide-react": "^0.460.0"
        },
        "devDependencies": {
            "@types/react": "^18.2.0",
            "@types/react-dom": "^18.2.0",
            "typescript": "^5.0.0"
        }
    }, indent=2)

    # ── src/main.tsx ──
    vfs["src/main.tsx"] = '''import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./App.css";
import { getCurrentUser } from "./auth";

const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
document.documentElement.setAttribute("data-theme", prefersDark ? "dark" : "light");

getCurrentUser().then((user) => {
  (window as any).__CURRENT_USER__ = user;
  const rootEl = (window as any).__CUSTOM_APP_ROOT__ || document.getElementById("root");
  ReactDOM.createRoot(rootEl!).render(
    <React.StrictMode><App /></React.StrictMode>
  );
}).catch(() => {
  const rootEl = (window as any).__CUSTOM_APP_ROOT__ || document.getElementById("root");
  ReactDOM.createRoot(rootEl!).render(
    <React.StrictMode><App /></React.StrictMode>
  );
});
'''

    # ── src/App.tsx ──
    vfs["src/App.tsx"] = '''import React, { useState, useEffect } from "react";
import { getCurrentUser, AppUser } from "./auth";
import LoginPage from "./pages/LoginPage";
import CatalogPage from "./pages/CatalogPage";
import CartPage from "./pages/CartPage";
import OrdersPage from "./pages/OrdersPage";
import BottomNav from "./components/BottomNav";

export default function App() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPath, setCurrentPath] = useState("/");
  const [cart, setCart] = useState<Record<string, number>>({});

  useEffect(() => {
    const u = (window as any).__CURRENT_USER__;
    if (u) { setUser(u); setLoading(false); return; }
    getCurrentUser().then((u) => { setUser(u); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleLogin = (u: AppUser) => { setUser(u); };

  const addToCart = (productId: string, qty: number) => {
    setCart((prev) => {
      const cur = prev[productId] || 0;
      const next = Number((cur + qty).toFixed(1));
      if (next <= 0) { const { [productId]: _, ...rest } = prev; return rest; }
      return { ...prev, [productId]: next };
    });
  };

  const setCartExact = (productId: string, exactQty: number) => {
    setCart((prev) => {
      const next = Number(exactQty.toFixed(1));
      if (next <= 0 || isNaN(next)) { const { [productId]: _, ...rest } = prev; return rest; }
      return { ...prev, [productId]: next };
    });
  };

  const clearCart = () => setCart({});
  const cartCount = Object.values(cart).reduce((a, b) => a + b, 0);

  if (loading) return <div className="loading-screen"><div className="spinner" /><p>載入中...</p></div>;
  if (!user) return <LoginPage onLogin={handleLogin} />;

  const pages: Record<string, React.ReactNode> = {
    "/": <CatalogPage cart={cart} addToCart={addToCart} setCartExact={setCartExact} />,
    "/cart": <CartPage cart={cart} addToCart={addToCart} setCartExact={setCartExact} clearCart={clearCart} onNavigate={setCurrentPath} />,
    "/orders": <OrdersPage />,
  };

  return (
    <div className="app-shell">
      <header className="app-topbar">
        <h1>''' + app_name + '''</h1>
        <span className="user-badge">{user.display_name || user.email}</span>
      </header>
      <main className="app-page">{pages[currentPath] || pages["/"]}</main>
      <BottomNav currentPath={currentPath} onNavigate={setCurrentPath} cartCount={cartCount} />
    </div>
  );
}
'''

    # ── src/types.ts ──
    vfs["src/types.ts"] = '''export interface Category {
  id: string;
  name: string;
  code: string | null;
  parent_id: string | null;
  active: boolean;
}

export interface Product {
  id: string;
  name: string;
  default_code: string | null;
  description_sale: string | null;
  categ_id: string | null;
  sale_ok: boolean;
  active: boolean;
}

export interface CartItem {
  productId: string;
  qty: number;
}

export interface SaleOrder {
  id: string;
  name: string;
  state: string;
  date_order: string;
  note: string | null;
  amount_total: number;
}
'''

    # ── src/routes.ts ──
    vfs["src/routes.ts"] = '''import { ShoppingCart, ClipboardList, Package } from "lucide-react";

export interface RouteItem {
  path: string;
  title: string;
  icon?: any;
  children?: RouteItem[];
}

export const routes: RouteItem[] = [
  { path: "/", title: "商品目錄", icon: Package },
  { path: "/cart", title: "購物車", icon: ShoppingCart },
  { path: "/orders", title: "訂單紀錄", icon: ClipboardList },
];
'''

    # ── src/pages/LoginPage.tsx ──
    vfs["src/pages/LoginPage.tsx"] = '''import React, { useState, useEffect } from "react";
import { AppUser } from "../auth";

const API_BASE = (window as any).__API_BASE__ || "/api/v1";
const APP_SLUG = (window as any).__APP_SLUG__ || "";

interface Props { onLogin: (u: AppUser) => void; }

export default function LoginPage({ onLogin }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [providers, setProviders] = useState<string[]>([]);

  useEffect(() => {
    // 檢查 URL 是否帶 OAuth token
    const params = new URLSearchParams(window.location.search);
    const oauthToken = params.get("oauth_token");
    if (oauthToken) {
      try {
        const decoded = JSON.parse(atob(oauthToken));
        const storageKey = `custom_app_auth_${APP_SLUG}`;
        localStorage.setItem(storageKey, JSON.stringify(decoded));
        (window as any).__APP_TOKEN__ = decoded.access_token;
        if (decoded.user) onLogin(decoded.user);
        window.history.replaceState({}, "", window.location.pathname);
      } catch {}
    }
    // 取得 OAuth providers
    fetch(`${API_BASE}/custom-app-oauth/${APP_SLUG}/auth-providers`)
      .then(r => r.json())
      .then(data => setProviders(data.map((p: any) => p.provider)))
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setLoading(true);
    const endpoint = isRegister ? "register" : "login";
    const body: any = { email, password };
    if (isRegister) body.display_name = displayName || email.split("@")[0];
    try {
      const resp = await fetch(`${API_BASE}/custom-app-auth/${APP_SLUG}/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.detail || "登入失敗");
      const storageKey = `custom_app_auth_${APP_SLUG}`;
      localStorage.setItem(storageKey, JSON.stringify(data));
      (window as any).__APP_TOKEN__ = data.access_token;
      onLogin(data.user);
    } catch (err: any) {
      setError(err.message);
    } finally { setLoading(false); }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">🐟</div>
        <h2>雄泉下單系統</h2>
        <p className="login-subtitle">{isRegister ? "建立帳號" : "客戶登入"}</p>
        <form onSubmit={handleSubmit}>
          {isRegister && (
            <input type="text" placeholder="顯示名稱" value={displayName}
              onChange={(e) => setDisplayName(e.target.value)} className="login-input" />
          )}
          <input type="email" placeholder="Email" value={email} required
            onChange={(e) => setEmail(e.target.value)} className="login-input" />
          <input type="password" placeholder="密碼" value={password} required minLength={6}
            onChange={(e) => setPassword(e.target.value)} className="login-input" />
          {error && <p className="login-error">{error}</p>}
          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? "處理中..." : isRegister ? "註冊" : "登入"}
          </button>
        </form>
        {providers.includes("line") && (
          <a href={`${API_BASE}/custom-app-oauth/${APP_SLUG}/line/authorize`}
            className="login-btn line-btn">
            <span>LINE 登入</span>
          </a>
        )}
        <p className="login-toggle" onClick={() => { setIsRegister(!isRegister); setError(""); }}>
          {isRegister ? "已有帳號？點此登入" : "沒有帳號？點此註冊"}
        </p>
      </div>
    </div>
  );
}
'''

    # ── src/pages/CatalogPage.tsx ──
    vfs["src/pages/CatalogPage.tsx"] = '''import React, { useState, useEffect } from "react";
import * as db from "../db";
import { Category, Product } from "../types";
import { Minus, Plus } from "lucide-react";

interface Props {
  cart: Record<string, number>;
  addToCart: (id: string, qty: number) => void;
  setCartExact: (id: string, qty: number) => void;
}

export default function CatalogPage({ cart, addToCart, setCartExact }: Props) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      db.query("product_categories"),
      db.query("product_templates"),
    ]).then(([catRes, prodRes]) => {
      let cats = (catRes?.data || catRes || []).filter((c: any) => c.active !== false);
      let prods = (prodRes?.data || prodRes || []).filter((p: any) => p.active !== false && p.sale_ok !== false);
      
      // 去重 (依賴名稱)
      const uniqueCats = [];
      const seenCatNames = new Set();
      for (const c of cats) {
        if (!seenCatNames.has(c.name)) { seenCatNames.add(c.name); uniqueCats.push(c); }
      }
      const uniqueProds = [];
      const seenProdNames = new Set();
      for (const p of prods) {
        if (!seenProdNames.has(p.name)) { seenProdNames.add(p.name); uniqueProds.push(p); }
      }
      
      setCategories(uniqueCats);
      setProducts(uniqueProds);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const filtered = products.filter((p) => {
    if (activeCat && p.categ_id !== activeCat) return false;
    if (search && !p.name.includes(search) && !(p.default_code || "").includes(search)) return false;
    return true;
  });

  if (loading) return <div className="page-loading"><div className="spinner" /></div>;

  return (
    <div className="catalog-page">
      <input type="text" className="search-bar" placeholder="搜尋商品..."
        value={search} onChange={(e) => setSearch(e.target.value)} />
      <div className="cat-tabs">
        <button className={`cat-tab ${!activeCat ? "active" : ""}`} onClick={() => setActiveCat(null)}>全部</button>
        {categories.map((c) => (
          <button key={c.id} className={`cat-tab ${activeCat === c.id ? "active" : ""}`}
            onClick={() => setActiveCat(c.id)}>{c.name}</button>
        ))}
      </div>
      <div className="product-grid">
        {filtered.length === 0 && <p className="empty-msg">沒有符合的商品</p>}
        {filtered.map((p) => {
          const qty = cart[p.id] || 0;
          return (
            <div key={p.id} className="product-card">
              <div className="product-info">
                <span className="product-code">{p.default_code || ""}</span>
                <h3 className="product-name">{p.name}</h3>
              </div>
              <div className="qty-control">
                {qty > 0 && (
                  <button className="qty-btn" onClick={() => addToCart(p.id, -1)}><Minus size={16} /></button>
                )}
                {qty > 0 && (
                  <input type="number" step="0.1" className="qty-input" value={qty} 
                    onChange={(e) => setCartExact(p.id, parseFloat(e.target.value))} 
                    onBlur={(e) => { if (parseFloat(e.target.value) <= 0 || !e.target.value) setCartExact(p.id, 0); }} />
                )}
                <button className="qty-btn add" onClick={() => addToCart(p.id, 1)}><Plus size={16} /></button>
                {qty > 0 && <span className="qty-unit">台斤</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
'''

    # ── src/pages/CartPage.tsx ──
    vfs["src/pages/CartPage.tsx"] = '''import React, { useState, useEffect } from "react";
import * as db from "../db";
import { runAction } from "../action";
import { Minus, Plus, Trash2, Send } from "lucide-react";

interface Props {
  cart: Record<string, number>;
  addToCart: (id: string, qty: number) => void;
  setCartExact: (id: string, qty: number) => void;
  clearCart: () => void;
  onNavigate: (p: string) => void;
}

export default function CartPage({ cart, addToCart, setCartExact, clearCart, onNavigate }: Props) {
  const [products, setProducts] = useState<Record<string, any>>({});
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [loadingProducts, setLoadingProducts] = useState(true);

  const entries = Object.entries(cart).filter(([_, qty]) => qty > 0);

  useEffect(() => {
    if (entries.length === 0) { setLoadingProducts(false); return; }
    db.query("product_templates").then((res) => {
      const list = res?.data || res || [];
      const map: Record<string, any> = {};
      for (const p of list) map[p.id] = p;
      setProducts(map);
      setLoadingProducts(false);
    }).catch(() => setLoadingProducts(false));
  }, []);

  const handleSubmit = async () => {
    if (entries.length === 0) return;
    setSubmitting(true);
    try {
      const items = entries.map(([productId, qty]) => ({
        product_id: productId,
        product_name: products[productId]?.name || "",
        qty,
      }));
      const user_email = currentUser?.email || ""; // Get user email from props
      const res = await runAction("place_order", { items, note, user_email });
      setResult(res.data);
      clearCart();
    } catch (err: any) {
      alert("下單失敗：" + (err.message || "未知錯誤"));
    } finally { setSubmitting(false); }
  };

  if (result) {
    return (
      <div className="result-page">
        <div className="result-card">
          <div className="result-icon">✅</div>
          <h2>訂單已送出</h2>
          <p className="result-order">訂單編號：{result.order_name || "—"}</p>
          <button className="login-btn" onClick={() => onNavigate("/orders")}>查看訂單</button>
          <button className="login-btn secondary" onClick={() => { setResult(null); onNavigate("/"); }}>繼續點餐</button>
        </div>
      </div>
    );
  }

  if (loadingProducts) return <div className="page-loading"><div className="spinner" /></div>;

  return (
    <div className="cart-page">
      {entries.length === 0 ? (
        <div className="empty-cart">
          <p>🛒 購物車是空的</p>
          <button className="login-btn" onClick={() => onNavigate("/")}>去點餐</button>
        </div>
      ) : (
        <>
          <div className="cart-list">
            {entries.map(([productId, qty]) => {
              const p = products[productId];
              if (!p) return null; // 隱藏無效的產品或等待資料載入
              return (
                <div key={productId} className="cart-item">
                  <div className="cart-item-info">
                    <span className="product-code">{p?.default_code || ""}</span>
                    <span className="product-name">{p?.name || productId}</span>
                  </div>
                  <div className="qty-control cart-qty">
                    <button className="qty-btn" onClick={() => addToCart(productId, -1)}><Minus size={16} /></button>
                    <input type="number" step="0.1" className="qty-input" value={qty} 
                      onChange={(e) => setCartExact(productId, parseFloat(e.target.value))} />
                    <button className="qty-btn add" onClick={() => addToCart(productId, 1)}><Plus size={16} /></button>
                    <button className="qty-btn del" onClick={() => setCartExact(productId, 0)}><Trash2 size={16} /></button>
                    <span className="qty-unit">台斤</span>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="cart-note">
            <textarea placeholder="備註（選填）" value={note} onChange={(e) => setNote(e.target.value)} rows={2} />
          </div>
          <button className="submit-btn" onClick={handleSubmit} disabled={submitting}>
            <Send size={18} />
            <span>{submitting ? "送出中..." : `確認送出 (${entries.length} 項)`}</span>
          </button>
        </>
      )}
    </div>
  );
}
'''

    # ── src/pages/OrdersPage.tsx ──
    vfs["src/pages/OrdersPage.tsx"] = '''import React, { useState, useEffect } from "react";
import * as db from "../db";
import { SaleOrder } from "../types";
import { RefreshCw, AlertCircle } from "lucide-react";

const STATE_LABELS: Record<string, string> = {
  draft: "草稿", sent: "已送出", sale: "已確認", done: "完成", cancel: "已取消",
};
const STATE_COLORS: Record<string, string> = {
  draft: "#f59e0b", sent: "#3b82f6", sale: "#10b981", done: "#6b7280", cancel: "#ef4444",
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<SaleOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorInfo, setErrorInfo] = useState("");

  const load = () => {
    setLoading(true);
    setErrorInfo("");
    db.query("sale_orders").then((res) => {
      const list = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
      list.sort((a: any, b: any) =>
        new Date(b.date_order || 0).getTime() - new Date(a.date_order || 0).getTime()
      );
      setOrders(list);
      setLoading(false);
    }).catch((err) => {
      console.error(err);
      setErrorInfo(err.message || "載入失敗");
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="orders-page">
      <div className="orders-header">
        <h2>訂單紀錄</h2>
        <button className="refresh-btn" onClick={load} disabled={loading}><RefreshCw size={18} /></button>
      </div>
      {errorInfo && (
         <div style={{ color: "var(--danger)", padding: "10px", background: "rgba(239,68,68,0.1)", borderRadius: "8px", display: "flex", gap: "8px" }}>
           <AlertCircle size={18}/><span>無法讀取訂單: {errorInfo}</span>
         </div>
      )}
      {loading ? <div className="page-loading"><div className="spinner" /></div> : (
        (!errorInfo && orders.length === 0) ? <p className="empty-msg">尚無訂單</p> : (
          <div className="order-list">
            {orders.map((o) => (
              <div key={o.id} className="order-card">
                <div className="order-top">
                  <span className="order-name">{o.name || `訂單 ${o.id.substring(0,8)}`}</span>
                  <span className="order-state" style={{ background: STATE_COLORS[o.state] || "#999" }}>
                    {STATE_LABELS[o.state] || o.state}
                  </span>
                </div>
                <div className="order-bottom">
                  <span>{new Date(o.date_order || Date.now()).toLocaleDateString("zh-TW")}</span>
                  {o.note && <span className="order-note">📝 {o.note}</span>}
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
'''

    # ── src/pages/NotFoundPage.tsx ──
    vfs["src/pages/NotFoundPage.tsx"] = '''import React from "react";
export default function NotFoundPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", textAlign: "center" }}>
      <p style={{ fontSize: "4rem", margin: "0 0 0.5rem" }}>🔍</p>
      <h2 style={{ fontSize: "1.5rem", fontWeight: 600, margin: "0 0 0.5rem" }}>404 — 找不到頁面</h2>
    </div>
  );
}
'''

    # ── src/components/BottomNav.tsx ──
    vfs["src/components/BottomNav.tsx"] = '''import React from "react";
import { Package, ShoppingCart, ClipboardList } from "lucide-react";

interface Props {
  currentPath: string;
  onNavigate: (p: string) => void;
  cartCount: number;
}

const tabs = [
  { path: "/", icon: Package, label: "商品" },
  { path: "/cart", icon: ShoppingCart, label: "購物車" },
  { path: "/orders", icon: ClipboardList, label: "訂單" },
];

export default function BottomNav({ currentPath, onNavigate, cartCount }: Props) {
  return (
    <nav className="bottom-nav">
      {tabs.map((t) => (
        <button key={t.path} className={`nav-item ${currentPath === t.path ? "active" : ""}`}
          onClick={() => onNavigate(t.path)}>
          <div className="nav-icon-wrap">
            <t.icon size={22} />
            {t.path === "/cart" && cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </div>
          <span className="nav-label">{t.label}</span>
        </button>
      ))}
    </nav>
  );
}
'''

    # ── src/pages/_manifest.json ──
    vfs["src/pages/_manifest.json"] = json.dumps({
        "/": {"title": "商品目錄", "order": 0},
        "/cart": {"title": "購物車", "order": 1},
        "/orders": {"title": "訂單紀錄", "order": 2},
    }, ensure_ascii=False, indent=2)

    vfs["src/data.json"] = "{}"
    vfs["src/db.json"] = "{}"

    # ── App.css ──
    vfs["src/App.css"] = _get_css()

    # ── SDK 檔案（保持原始模板，不修改）──
    vfs["src/auth.ts"] = _sdk_auth()
    vfs["src/api.ts"] = _sdk_api()
    vfs["src/db.ts"] = _sdk_db()
    vfs["src/action.ts"] = _sdk_action()

    # ── Actions ──
    vfs["actions/place_order.py"] = '''def execute(ctx):
    """客戶下單 — 建立銷貨單 (sale_order) 與明細行 (sale_order_lines)

    前端傳入參數：
      items: [{ product_id, product_name, qty }]
      note: 備註（選填）

    流程：
      1. 取得當前 CustomAppUser → 查/建 Customer → 綁定
      2. 建立 sale_order (state=draft)
      3. 建立 sale_order_lines
      4. 回傳訂單資訊
    """
    from datetime import datetime, timezone

    items = ctx.params.get("items", [])
    note = ctx.params.get("note", "")
    user_email = ctx.params.get("user_email", "") # 新增 user_email 參數

    if not items:
        ctx.response.error("請至少選擇一項商品")
        return

    # 若 ctx.user 不存在，就依賴前端傳過來的 user_email 查詢 (做個臨時向下相容)
    c_user = getattr(ctx, "user", None)
    if not c_user and not user_email:
        ctx.response.error("未登入或缺少 user_email 參數")
        return

    db = ctx.db  # SQLAlchemy AsyncSession

    import asyncio
    loop = asyncio.get_event_loop()

    async def _do():
        from sqlalchemy import select, and_

        try:
            from app.models.custom_app_auth import CustomAppUser
            nonlocal c_user
            if not c_user:
                u_q = await db.execute(select(CustomAppUser).filter(
                    CustomAppUser.email == user_email,
                    CustomAppUser.tenant_id == ctx.tenant_id
                ))
                c_user = u_q.scalars().first()
                if not c_user:
                    raise Exception(f"資料庫找不到 {user_email} 這個使用者")

            # 1. 查找或建立 Customer
            from app.models.client import Customer
            from app.models.customer_app_user_rel import CustomerCustomAppUserRel

            # 先查綁定
            rel_q = await db.execute(
                select(CustomerCustomAppUserRel).filter(
                    CustomerCustomAppUserRel.custom_app_user_id == c_user.id
                )
            )
            rel = rel_q.scalars().first()
            customer_id = None

            if rel:
                customer_id = rel.customer_id
            else:
                # 用 email 查 Customer
                cust_q = await db.execute(
                    select(Customer).filter(
                        and_(
                            Customer.email == c_user.email,
                            Customer.tenant_id == ctx.tenant_id,
                        )
                    )
                )
                cust = cust_q.scalars().first()

                if not cust:
                    # 自動建立 Customer
                    cust = Customer(
                        tenant_id=ctx.tenant_id,
                        name=c_user.display_name or c_user.email.split("@")[0],
                        email=c_user.email,
                        customer_type="company",
                    )
                    db.add(cust)
                    await db.flush()

                customer_id = cust.id

                # 建立綁定
                new_rel = CustomerCustomAppUserRel(
                    tenant_id=ctx.tenant_id,
                    customer_id=customer_id,
                    custom_app_user_id=c_user.id,
                )
                db.add(new_rel)
                await db.flush()

            # 2. 建立 SaleOrder
            from app.models.sale import SaleOrder, SaleOrderLine

            now = datetime.now(timezone.utc)
            order = SaleOrder(
                tenant_id=ctx.tenant_id,
                customer_id=customer_id,
                date_order=now,
                state="draft",
                note=note or None,
            )
            db.add(order)
            await db.flush()

        from app.models.sale import SaleOrder, SaleOrderLine

        now = datetime.now(timezone.utc)
        order = SaleOrder(
            tenant_id=user.tenant_id,
            customer_id=customer_id,
            date_order=now,
            state="draft",
            note=note or None,
        )
        db.add(order)
        await db.flush()

        # 3. 建立 SaleOrderLines
        import uuid
        for item in items:
            line = SaleOrderLine(
                tenant_id=user.tenant_id,
                order_id=order.id,
                product_id=uuid.UUID(item["product_id"]),
                product_uom_qty=item.get("qty", 1),
                price_unit=0,  # 下單系統不處理價格
                name=item.get("product_name", ""),
                delivery_date=now.date(),
            )
            db.add(line)

        await db.commit()
        await db.refresh(order)

        return {
            "order_id": str(order.id),
            "order_name": order.name or f"SO-{str(order.id)[:8]}",
            "state": order.state,
            "items_count": len(items),
        }
        
    except Exception as e:
        import traceback
        return {
            "status": "error",
            "error": str(e) + "\\n" + traceback.format_exc(),
            "result": None
        }

result = loop.run_until_complete(_do())
ctx.response.json(result)
'''

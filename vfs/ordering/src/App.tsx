import React, { useState, useEffect } from "react";
import LoginPage from "./pages/LoginPage";
import CatalogPage from "./pages/CatalogPage";
import CartPage from "./pages/CartPage";
import OrdersPage from "./pages/OrdersPage";
import BottomNav from "./components/BottomNav";
import * as db from "./db";

function toYMD(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
function getFirstAvailableDate(holidays: Set<string>): string {
  const today = new Date();
  for (let i = 1; i <= 60; i++) {
    const d = new Date(today); d.setDate(today.getDate() + i);
    const ymd = toYMD(d);
    if (!holidays.has(ymd)) return ymd;
  }
  return toYMD(new Date(today.setDate(today.getDate() + 1)));
}

const APP_SLUG = (window as any).__APP_SLUG__ || "";
const STORAGE_KEY = `custom_app_auth_${APP_SLUG}`;
const CART_KEY = `cart_${APP_SLUG}`;

function loadUser(): AppUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data.access_token) (window as any).__APP_TOKEN__ = data.access_token;
    return data.user || null;
  } catch { return null; }
}

export interface CartItem {
  productId: string;
  productProductId?: string;
  deliveryDate: string;
  qty: number;
  name?: string;
  defaultCode?: string;
  uomId?: string;
}

function loadCart(): CartItem[] {
  try {
    const raw = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
    if (Array.isArray(raw)) return raw as CartItem[];
    return Object.entries(raw as Record<string, number>)
      .filter(([, q]) => q > 0)
      .map(([productId, qty]) => ({ productId, deliveryDate: "", qty }));
  } catch { return []; }
}

export interface AppUser {
  id: string;
  email: string;
  display_name?: string;
}

export interface PriceEntry { price: number; date: string; }

const VALID_PATHS = ["/order", "/cart", "/orders"];

function getPath(): string {
  const h = window.location.hash.replace(/^#/, "");
  return VALID_PATHS.includes(h) ? h : "/order";
}

export default function App() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPath, setCurrentPath] = useState<string>(getPath);
  const [cart, setCart] = useState<CartItem[]>(loadCart);
  const [uomMap, setUomMap] = useState<Record<string, string>>({});
  const [holidays, setHolidays] = useState<Set<string>>(new Set());
  const [deliveryDate, setDeliveryDate] = useState<string>(() => getFirstAvailableDate(new Set()));
  const [tmplToProd, setTmplToProd] = useState<Record<string, string>>({});
  const [priceMap, setPriceMap] = useState<Record<string, PriceEntry>>({});
  const [cutoffTime, setCutoffTime] = useState<string>("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const oauthToken = params.get("oauth_token");
    if (oauthToken) {
      try {
        const decoded = JSON.parse(atob(oauthToken));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(decoded));
        if (decoded.access_token) (window as any).__APP_TOKEN__ = decoded.access_token;
        if (decoded.user) setUser(decoded.user);
        window.history.replaceState({}, "", window.location.pathname);
      } catch {}
    } else {
      const u = loadUser();
      if (u) setUser(u);
    }
    setLoading(false);
  }, []);

  // 登入後載入所有 runtime 資料
  useEffect(() => {
    if (!user) return;

    // 計量單位（標準 Odoo 表，直接查）
    db.query("uom_uom", { filters: [{ column: "active", op: "eq", value: true }] })
      .then(rows => {
        const map: Record<string, string> = {};
        for (const u of Array.isArray(rows) ? rows : []) map[String(u.id)] = u.name;
        setUomMap(map);
      }).catch(() => {});

    // x_ 自訂表 + product_product 對應 → 統一由 get_config action 取得
    db.runAction("get_config", {})
      .then((d: any) => {
        // 假日
        const dates = (Array.isArray(d.holidays) ? d.holidays : []).filter(Boolean);
        const hset = new Set<string>(dates);
        setHolidays(hset);
        setDeliveryDate(prev => hset.has(prev) ? getFirstAvailableDate(hset) : prev);

        // 截止時間
        if (d.cutoff_time) setCutoffTime(String(d.cutoff_time));

        // product_product 對應
        setTmplToProd(d.tmpl_to_prod ?? {});

        // 參考價：price_log + prod_to_tmpl → 每個 tmplId 取最新
        const prodToTmpl: Record<string, string> = d.prod_to_tmpl ?? {};
        const latest: Record<string, PriceEntry> = {};
        for (const log of Array.isArray(d.price_log) ? d.price_log : []) {
          const prodId = String(log.product_product_id || "");
          const tmplId = prodToTmpl[prodId];
          if (!tmplId) continue;
          const date = String(log.effective_date || "");
          const price = Number(log.lst_price || 0);
          if (!latest[tmplId] || date > latest[tmplId].date) {
            latest[tmplId] = { price, date };
          }
        }
        setPriceMap(latest);
      }).catch(() => {});
  }, [user]);

  const navigate = (path: string) => {
    window.location.hash = path;
    setCurrentPath(path);
  };
  useEffect(() => {
    const onHash = () => setCurrentPath(getPath());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const handleLogin = (u: AppUser) => setUser(u);

  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(CART_KEY);
    (window as any).__APP_TOKEN__ = "";
    setUser(null);
    setCart([]);
    setUomMap({});
    setHolidays(new Set());
    setPriceMap({});
    navigate("/order");
  };

  const addToCart = (productId: string, qty: number, delivDate: string, meta?: { name?: string; defaultCode?: string; uomId?: string; productProductId?: string }) => {
    setCart(prev => {
      const idx = prev.findIndex(i => i.productId === productId && i.deliveryDate === delivDate);
      if (idx >= 0) {
        const newQty = Number((prev[idx].qty + qty).toFixed(2));
        if (newQty <= 0) return prev.filter((_, i) => i !== idx);
        return prev.map((item, i) => i === idx ? { ...item, qty: newQty } : item);
      }
      if (qty > 0) return [...prev, { productId, deliveryDate: delivDate, qty: Number(qty.toFixed(2)), ...meta }];
      return prev;
    });
  };

  const setCartExact = (productId: string, exactQty: number, delivDate: string) => {
    setCart(prev => {
      const next = Number(exactQty.toFixed(2));
      if (next <= 0 || isNaN(next)) return prev.filter(i => !(i.productId === productId && i.deliveryDate === delivDate));
      const idx = prev.findIndex(i => i.productId === productId && i.deliveryDate === delivDate);
      if (idx >= 0) return prev.map((item, i) => i === idx ? { ...item, qty: next } : item);
      return [...prev, { productId, deliveryDate: delivDate, qty: next }];
    });
  };

  const clearCartDate = (date: string) => setCart(prev => prev.filter(i => i.deliveryDate !== date));

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }, [cart]);

  const cartCount = new Set(cart.map(i => i.deliveryDate)).size;

  if (loading) return (
    <div className="loading-screen">
      <div className="spinner" />
      <p>載入中...</p>
    </div>
  );

  if (!user) return <LoginPage onLogin={handleLogin} />;

  const pages: Record<string, React.ReactNode> = {
    "/order": (
      <CatalogPage
        cart={cart} addToCart={addToCart} setCartExact={setCartExact}
        uomMap={uomMap} deliveryDate={deliveryDate} setDeliveryDate={setDeliveryDate}
        holidays={holidays} tmplToProd={tmplToProd} priceMap={priceMap}
      />
    ),
    "/cart": (
      <CartPage
        cart={cart} addToCart={addToCart} setCartExact={setCartExact}
        clearCartDate={clearCartDate} onNavigate={navigate} setDeliveryDate={setDeliveryDate}
        uomMap={uomMap} user={user} priceMap={priceMap}
      />
    ),
    "/orders": <OrdersPage user={user!} cutoffTime={cutoffTime} />,
  };

  return (
    <div className="app-shell">
      <header className="app-topbar">
        <h1>雄泉鮮食</h1>
        <button className="logout-btn" onClick={handleLogout}>登出</button>
      </header>
      <main className="app-page">{pages[currentPath] || pages["/order"]}</main>
      <BottomNav currentPath={currentPath} onNavigate={navigate} cartCount={cartCount} />
    </div>
  );
}

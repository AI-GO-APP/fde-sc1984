import React from "react";
import { Minus, Plus, Star } from "lucide-react";
import { CartItem, PriceEntry } from "../App";

export interface Product {
  id: string; name: string; default_code: string | null;
  categ_id: string | null; uom_id?: string | null;
  sale_ok: boolean; active: boolean; list_price?: number;
  orderStep?: number; minQty?: number; maxQty?: number;
}

export function SkeletonCard() {
  return (
    <div className="product-card skeleton">
      <div className="product-info">
        <span className="skeleton-line short" />
        <span className="skeleton-line" />
      </div>
      <div className="qty-control"><div className="skeleton-btn" /></div>
    </div>
  );
}

export function ProductCard({ p, cart, addToCart, setCartExact, uomMap, deliveryDate, priceMap, isFavorite, onToggleFavorite }: {
  p: Product; cart: CartItem[];
  addToCart: (id: string, qty: number, deliveryDate: string) => void;
  setCartExact: (id: string, qty: number, deliveryDate: string) => void;
  uomMap: Record<string, string>; deliveryDate: string;
  priceMap: Record<string, PriceEntry>;
  isFavorite: boolean;
  onToggleFavorite: (tmplId: string) => void;
}) {
  const qty = cart.find(i => i.productId === p.id && i.deliveryDate === deliveryDate)?.qty ?? 0;
  const price = priceMap[p.id]?.price ?? p.list_price ?? 0;
  const step = p.orderStep || 1;
  const minQty = p.minQty || 0;
  const maxQty = p.maxQty || 0;

  const handleMinus = () => {
    const next = qty - step;
    if (next <= 0 || (minQty > 0 && next < minQty)) setCartExact(p.id, 0, deliveryDate);
    else setCartExact(p.id, next, deliveryDate);
  };
  const handlePlus = () => {
    const next = qty === 0 && minQty > 0 ? minQty : qty + step;
    setCartExact(p.id, maxQty > 0 ? Math.min(maxQty, next) : next, deliveryDate);
  };
  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = parseFloat(e.target.value) || 0;
    if (raw <= 0) { setCartExact(p.id, 0, deliveryDate); return; }
    const snapped = step > 1 ? Math.round(raw / step) * step : raw;
    setCartExact(p.id, maxQty > 0 ? Math.min(maxQty, snapped) : snapped, deliveryDate);
  };

  return (
    <div className="product-card">
      <button className="fav-btn" onClick={() => onToggleFavorite(p.id)} aria-label="收藏">
        <Star size={16} fill={isFavorite ? "currentColor" : "none"} className={isFavorite ? "fav-active" : ""} />
      </button>
      <div className="product-info">
        <span className="product-code">{p.default_code || ""}</span>
        <span className="product-name">{p.name}</span>
      </div>
      <div className="product-price-block">
        {price > 0 && <span className="product-price">${price}</span>}
        {priceMap[p.id]?.date && <span className="price-date">參考日期 {priceMap[p.id].date.slice(5).replace("-", "/")}</span>}
      </div>
      <div className="qty-control">
        <button className="qty-btn" disabled={qty === 0} onClick={handleMinus}><Minus size={14} /></button>
        <input type="number" step={step} min="0" max={maxQty > 0 ? maxQty : undefined}
          className="qty-input" value={qty} onChange={handleInput} />
        <button className="qty-btn add" disabled={maxQty > 0 && qty >= maxQty} onClick={handlePlus}><Plus size={14} /></button>
        <span className="qty-unit">{uomMap[p.uom_id ?? ""] || "件"}</span>
      </div>
    </div>
  );
}

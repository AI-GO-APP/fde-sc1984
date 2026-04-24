import React from "react";
import { CartItem, PriceEntry, AppUser } from "../App";
import { ProductCard, SkeletonCard, Product } from "./CatalogProductCard";
import { useCatalogData, Category } from "./useCatalogData";
import { useFavorites } from "./useFavorites";

const DAY_NAMES = ["日","一","二","三","四","五","六"];
function toYMD(d: Date) { return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; }
function getAvailableDates(holidays: Set<string>, count = 7): string[] {
  const result: string[] = [], today = new Date();
  for (let i = 1; result.length < count && i <= 60; i++) {
    const d = new Date(today); d.setDate(today.getDate() + i);
    const ymd = toYMD(d);
    if (!holidays.has(ymd)) result.push(ymd);
  }
  return result;
}
function fmtDateChip(ymd: string): string {
  const [y, m, d] = ymd.split("-").map(Number);
  return `${m}/${d}（週${DAY_NAMES[new Date(y, m-1, d).getDay()]}）`;
}

interface Props {
  user: AppUser;
  cart: CartItem[];
  addToCart: (id: string, qty: number, deliveryDate: string) => void;
  setCartExact: (id: string, qty: number, deliveryDate: string) => void;
  uomMap: Record<string, string>;
  deliveryDate: string; setDeliveryDate: (d: string) => void;
  holidays: Set<string>; priceMap: Record<string, PriceEntry>;
  allTemplates: Product[]; categories: Category[]; configLoaded: boolean;
}

export default function CatalogPage({ user, cart, addToCart, setCartExact, uomMap, deliveryDate, setDeliveryDate, holidays, priceMap, allTemplates, categories, configLoaded }: Props) {
  const { favoriteSet, toggleFavorite } = useFavorites(user.id);
  const { activeCat, setActiveCat, search, handleSearch, visibleProducts } = useCatalogData(allTemplates, categories, favoriteSet);
  const availableDates = configLoaded ? getAvailableDates(holidays) : [];

  return (
    <div className="catalog-page">
      <div className="catalog-sticky">
        <input type="text" className="search-bar" placeholder="搜尋商品..." value={search} onChange={e => handleSearch(e.target.value)} />
        <div className="date-row">
          <span className="date-label">配送日期</span>
          <div className="date-chips">
            {availableDates.map(d => {
              const dateQty = cart.filter(i => i.deliveryDate === d).reduce((s, i) => s + i.qty, 0);
              return (
                <button key={d} className={`date-chip${deliveryDate === d ? " active" : ""}`}
                  onClick={() => setDeliveryDate(d)} style={{ position: "relative" }}>
                  {fmtDateChip(d)}
                  {dateQty > 0 && <span className="date-chip-badge">{dateQty % 1 === 0 ? dateQty : dateQty.toFixed(1)}</span>}
                </button>
              );
            })}
          </div>
        </div>
        <div className="cat-tabs">
          <button className={`cat-tab${activeCat === null ? " active" : ""}`} onClick={() => setActiveCat(null)}>全部</button>
          {categories.map(c => <button key={c.id} className={`cat-tab${activeCat === c.id ? " active" : ""}`} onClick={() => setActiveCat(c.id)}>{c.name}</button>)}
        </div>
      </div>
      <div className="product-grid">
        {allTemplates.length === 0
          ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
          : visibleProducts.length === 0
            ? <p className="empty-msg">{search ? "找不到符合的商品" : "沒有商品"}</p>
            : visibleProducts.map(p => (
                <ProductCard key={p.id} p={p} cart={cart} addToCart={addToCart} setCartExact={setCartExact}
                  uomMap={uomMap} deliveryDate={deliveryDate} priceMap={priceMap}
                  isFavorite={favoriteSet.has(p.id)} onToggleFavorite={toggleFavorite} />
              ))
        }
      </div>
    </div>
  );
}

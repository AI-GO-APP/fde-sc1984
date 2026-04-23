import React from "react";
import { CartItem, PriceEntry } from "../App";
import { ProductCard, SkeletonCard, Product } from "./CatalogProductCard";
import { useCatalogData } from "./useCatalogData";

const DAY_NAMES = ["日","一","二","三","四","五","六"];
function toYMD(d: Date) { return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; }
function getAvailableDates(holidays: Set<string>, lookahead = 30): string[] {
  const result: string[] = [], today = new Date();
  for (let i = 1; i <= lookahead; i++) {
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
  cart: CartItem[];
  addToCart: (id: string, qty: number, deliveryDate: string, meta?: { name?: string; defaultCode?: string; uomId?: string; productProductId?: string }) => void;
  setCartExact: (id: string, qty: number, deliveryDate: string) => void;
  uomMap: Record<string, string>;
  deliveryDate: string; setDeliveryDate: (d: string) => void;
  holidays: Set<string>; tmplToProd: Record<string, string>; priceMap: Record<string, PriceEntry>;
}

export default function CatalogPage({ cart, addToCart, setCartExact, uomMap, deliveryDate, setDeliveryDate, holidays, tmplToProd, priceMap }: Props) {
  const { categories, activeCat, setActiveCat, search, handleSearch, searchResults, searchLoading, catLoading, poolRef, catDataRef, catsRef } = useCatalogData();
  const availableDates = getAvailableDates(holidays);
  const catOrder = new Map(catsRef.current.map((c, i) => [c.id, i]));

  let displayed: Product[];
  if (searchResults !== null) {
    displayed = activeCat ? searchResults.filter(p => p.categ_id === activeCat) : searchResults;
  } else if (activeCat === null) {
    displayed = Array.from(poolRef.current.values()).sort((a, b) => {
      const ao = catOrder.get(a.categ_id ?? "") ?? 999, bo = catOrder.get(b.categ_id ?? "") ?? 999;
      return ao !== bo ? ao - bo : (a.default_code || a.name).localeCompare(b.default_code || b.name);
    });
  } else {
    const d = catDataRef.current[activeCat];
    displayed = (d?.ids ?? []).map(id => poolRef.current.get(id)!).filter(Boolean);
  }

  const activeCatData = activeCat ? catDataRef.current[activeCat] : null;
  const poolLoading = Object.values(catDataRef.current).some(d => d.loading);
  const showSkeleton = catLoading || (searchResults === null && (activeCat === null
    ? poolRef.current.size === 0 && Object.values(catDataRef.current).some(d => d.loading)
    : !activeCatData || (activeCatData.ids.length === 0 && activeCatData.loading)));
  const allDone = !poolLoading && Object.values(catDataRef.current).length > 0 && Object.values(catDataRef.current).every(d => !d.hasMore);

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
        {catLoading ? (
          <div className="cat-tabs"><div className="skeleton-line" style={{ width: "200px", height: "32px", borderRadius: "20px" }} /></div>
        ) : (
          <div className="cat-tabs">
            <button className={`cat-tab ${activeCat === null ? "active" : ""}`} onClick={() => setActiveCat(null)}>全部</button>
            {categories.map(c => <button key={c.id} className={`cat-tab ${activeCat === c.id ? "active" : ""}`} onClick={() => setActiveCat(c.id)}>{c.name}</button>)}
          </div>
        )}
      </div>
      <div className="product-grid">
        {(showSkeleton || searchLoading)
          ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
          : displayed.length === 0
            ? <p className="empty-msg">{search ? "找不到符合的商品" : "沒有商品"}</p>
            : displayed.map(p => <ProductCard key={p.id} p={p} cart={cart} addToCart={addToCart} setCartExact={setCartExact} uomMap={uomMap} deliveryDate={deliveryDate} tmplToProd={tmplToProd} priceMap={priceMap} />)
        }
        {!showSkeleton && !searchLoading && poolLoading && (
          <p className="empty-msg" style={{ fontSize: "12px", color: "var(--text-muted)", padding: "8px 0" }}>背景載入中… 已取得 {poolRef.current.size} 項</p>
        )}
        {!showSkeleton && !searchLoading && allDone && !search && (
          <p className="empty-msg" style={{ fontSize: "12px", padding: "16px 0" }}>已載入全部 {poolRef.current.size} 項商品</p>
        )}
      </div>
    </div>
  );
}

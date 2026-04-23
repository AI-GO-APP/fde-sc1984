import React, { useState, useMemo } from "react";
import * as db from "../db";
import { CartItem, AppUser, PriceEntry } from "../App";
import CartDateGroup from "./CartDateGroup";

function Toast({ msg, isError }: { msg: string; isError?: boolean }) {
  return <div className={`toast-msg${isError ? " error" : ""}`}>{msg}</div>;
}

interface Props {
  cart: CartItem[];
  addToCart: (id: string, qty: number, deliveryDate: string) => void;
  setCartExact: (id: string, qty: number, deliveryDate: string) => void;
  clearCartDate: (date: string) => void;
  onNavigate: (p: string) => void;
  setDeliveryDate: (d: string) => void;
  uomMap: Record<string, string>;
  user: AppUser;
  priceMap: Record<string, PriceEntry>;
}

export default function CartPage({ cart, addToCart, setCartExact, clearCartDate, onNavigate, setDeliveryDate, uomMap, user, priceMap }: Props) {
  const [groupNotes, setGroupNotes] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; error: boolean } | null>(null);

  const showToast = (msg: string, error = false) => {
    setToast({ msg, error });
    setTimeout(() => setToast(null), 3500);
  };

  const dateGroups = useMemo(() => {
    const groups: Record<string, CartItem[]> = {};
    for (const item of cart) {
      const key = item.deliveryDate || "";
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    }
    return Object.entries(groups)
      .sort(([a], [b]) => { if (!a) return 1; if (!b) return -1; return a.localeCompare(b); })
      .map(([date, items]) => ({ date, items }));
  }, [cart]);

  const handleSubmit = async (date: string) => {
    const items = cart.filter(i => i.deliveryDate === date);
    if (!date) { showToast("此組未指定配送日期，請回商品頁重新選擇日期後加入", true); return; }
    setSubmitting(date);
    try {
      const custs = await db.query("customers", { filters: [{ column: "email", op: "eq", value: user.email }] });
      if (!custs || custs.length === 0) throw new Error("帳號未開通下單權限，請聯絡管理員");
      const customerId = custs[0].id;
      const note = groupNotes[date] || "";
      const order = await db.insert("sale_orders", {
        customer_id: customerId,
        date_order: new Date().toISOString().slice(0, 10),
        note: `配送日期：${date}${note ? `\n${note}` : ""}`,
        state: "draft",
      });
      if (!order?.id) throw new Error("建立訂單失敗");
      const lineResults = await Promise.allSettled(items.map(item =>
        db.insert("sale_order_lines", {
          order_id: order.id,
          product_template_id: item.productId,
          ...(item.productProductId ? { product_id: item.productProductId } : {}),
          name: item.name || item.productId,
          product_uom_qty: item.qty,
          price_unit: priceMap[item.productId]?.price ?? 0,
          delivery_date: date,
        })
      ));
      const failCount = lineResults.filter(r => r.status === "rejected").length;
      if (failCount > 0) throw new Error(`${failCount} 筆明細建立失敗`);
      const total = items.reduce((sum, item) => sum + (priceMap[item.productId]?.price ?? 0) * item.qty, 0);
      if (total > 0) await db.update("sale_orders", order.id, { amount_total: Math.round(total * 100) / 100 });
      clearCartDate(date);
      const [, m, d] = date.split("-").map(Number);
      showToast(`${m}/${d} 訂單已送出 ✅`);
    } catch (err: any) {
      showToast("下單失敗：" + (err.message || "未知錯誤"), true);
    } finally {
      setSubmitting(null);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="empty-cart">
        <p>🛒 購物車是空的</p>
        <button className="login-btn" onClick={() => onNavigate("/order")}>去點餐</button>
      </div>
    );
  }

  return (
    <div className="cart-page">
      {toast && <Toast msg={toast.msg} isError={toast.error} />}
      {dateGroups.map(({ date, items }) => (
        <CartDateGroup key={date} date={date} items={items} priceMap={priceMap} uomMap={uomMap}
          addToCart={addToCart} setCartExact={setCartExact}
          note={groupNotes[date] || ""} onNoteChange={n => setGroupNotes(prev => ({ ...prev, [date]: n }))}
          isSubmitting={submitting === date} onSubmit={() => handleSubmit(date)}
          setDeliveryDate={setDeliveryDate} onNavigate={onNavigate} />
      ))}
    </div>
  );
}

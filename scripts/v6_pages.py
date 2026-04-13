"""v6 pages — P0 核心業務功能（全面 SVG icon + light mode）"""

# SVG 箭頭
_ARROW = '''const Arrow = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>;'''

def procurement() -> str:
    """P0-1: 採購定價 — 供應商分群 + 進貨價/加成率/售價輸入"""
    return r'''import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import * as db from '../../db';
import { useData } from '../../data/DataProvider';
''' + _ARROW + r'''
const CheckIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>;
const PricingIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>;
const PackageIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>;

interface PricingItem {
  productId: string; productName: string; code: string;
  supplierId: string; supplierName: string;
  estimatedQty: number; actualQty: number;
  purchasePrice: number; markupRate: number; sellingPrice: number;
  state: 'pending' | 'priced' | 'stocked';
}

export default function ProcurementPage() {
  const nav = useNavigate();
  const { orderLines, products, supplierInfos, suppliers, stockQuants, stockLocations, productProducts, loading } = useData();
  const [items, setItems] = useState<PricingItem[]>([]);
  const [expanded, setExpanded] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // #5 從全域快取資料建立 PricingItem — 使用 initialized 防重複執行
  const olKey = orderLines.length;
  const prKey = products.length;
  useEffect(() => {
    if (loading || initialized) return;
    const prodMap: Record<string,any> = {};
    for (const p of products) prodMap[p.id] = p;
    const prodSup: Record<string,string> = {};
    for (const si of supplierInfos) { if (si.product_tmpl_id) prodSup[si.product_tmpl_id] = si.supplier_id; }
    const defaultSupId = Object.keys(suppliers)[0] || 'unknown';
    const itemMap = new Map<string, PricingItem>();
    for (const l of orderLines) {
      const pid = l.product_template_id || l.product_id;
      if (!pid) continue;
      const prod = prodMap[pid];
      const supId = prodSup[pid] || (supplierInfos.length === 0 ? defaultSupId : 'unknown');
      const existing = itemMap.get(pid);
      if (existing) { existing.estimatedQty += Number(l.product_uom_qty || 0); existing.actualQty = existing.estimatedQty; }
      else { itemMap.set(pid, { productId: pid, productName: prod?.name || l.name || '—', code: prod?.default_code || '', supplierId: supId, supplierName: suppliers[supId]?.name || '未指定供應商', estimatedQty: Number(l.product_uom_qty || 0), actualQty: Number(l.product_uom_qty || 0), purchasePrice: Number(prod?.standard_price || 0), markupRate: 130, sellingPrice: Number(prod?.list_price || 0), state: Number(prod?.standard_price || 0) > 0 ? 'priced' : 'pending' }); }
    }
    setItems(Array.from(itemMap.values()));
    setExpanded([...new Set(Array.from(itemMap.values()).map(i => i.supplierId))]);
    setInitialized(true);
  }, [loading, initialized, olKey, prKey]);

  // 分群
  const groups = new Map<string, PricingItem[]>();
  for (const item of items) {
    const list = groups.get(item.supplierId) || [];
    list.push(item);
    groups.set(item.supplierId, list);
  }

  const updateItem = (pid: string, field: string, value: number) => {
    setItems(prev => prev.map(i => {
      if (i.productId !== pid) return i;
      const updated = {...i, [field]: value};
      if (field === 'purchasePrice' || field === 'markupRate') {
        const pp = field === 'purchasePrice' ? value : i.purchasePrice;
        const mr = field === 'markupRate' ? value : i.markupRate;
        updated.sellingPrice = pp > 0 ? Math.round(pp * mr / 100) : 0;
      }
      return updated;
    }));
  };

  const applyPricing = async (pid: string) => {
    const item = items.find(i => i.productId === pid);
    if (!item || item.purchasePrice <= 0 || item.state !== 'pending') return;
    setSaving(true);
    try {
      const today = new Date().toISOString().slice(0, 10);
      await db.update('product_templates', pid, { standard_price: item.purchasePrice, list_price: item.sellingPrice });
      // 寫入價格稽核 log
      await db.insertCustom('x_price_log', { product_id: pid, price: item.sellingPrice, effective_date: today });
      // 同步當日配送的訂單明細售價
      const matchingLines = orderLines.filter((l: any) =>
        (l.product_template_id === pid || l.product_id === pid) &&
        l.delivery_date && l.delivery_date.slice(0, 10) === today
      );
      await Promise.all(matchingLines.map((l: any) => db.update('sale_order_lines', l.id, { price_unit: item.sellingPrice })));
      if (item.actualQty > 0) {
        // 確保有 product_products 變體紀錄（FK 約束）
        let variantId = productProducts.find((v:any) => v.product_tmpl_id === pid)?.id;
        if (!variantId) {
          const created = await db.insert('product_products', { product_tmpl_id: pid, active: true });
          if (created?.id) variantId = created.id;
        }
        if (variantId) {
          const locId = stockLocations.find((l:any) => l.usage === 'internal')?.id || stockLocations[0]?.id;
          const sq = stockQuants.find(q => q.product_id === variantId);
          if (sq) { await db.update('stock_quants', sq.id, { quantity: Number(sq.quantity||0) + item.actualQty }); }
          else if (locId) { await db.insert('stock_quants', { product_id: variantId, location_id: locId, quantity: item.actualQty }); }
        }
      }
      setItems(prev => prev.map(i => i.productId === pid ? {...i, state: 'priced'} : i));
    } catch(e: any) { console.error('定價失敗:', e.message); }
    setSaving(false);
  };

  const applyAll = async () => {
    const priceable = items.filter(i => i.purchasePrice > 0 && i.state === 'pending');
    if (priceable.length === 0) return;
    setSaving(true);
    const today = new Date().toISOString().slice(0, 10);
    for (const item of priceable) {
      try {
        await db.update('product_templates', item.productId, { standard_price: item.purchasePrice, list_price: item.sellingPrice });
        // 寫入價格稽核 log
        await db.insert('x_price_log', { product_id: item.productId, price: item.sellingPrice, effective_date: today });
        // 同步當日配送的訂單明細售價
        const matchingLines = orderLines.filter((l: any) =>
          (l.product_template_id === item.productId || l.product_id === item.productId) &&
          l.delivery_date && l.delivery_date.slice(0, 10) === today
        );
        await Promise.all(matchingLines.map((l: any) => db.update('sale_order_lines', l.id, { price_unit: item.sellingPrice })));
        if (item.actualQty > 0) {
          let variantId = productProducts.find((v:any) => v.product_tmpl_id === item.productId)?.id;
          if (!variantId) {
            const created = await db.insert('product_products', { product_tmpl_id: item.productId, active: true });
            if (created?.id) variantId = created.id;
          }
          if (variantId) {
            const locId = stockLocations.find((l:any) => l.usage === 'internal')?.id || stockLocations[0]?.id;
            const sq = stockQuants.find(q => q.product_id === variantId);
            if (sq) { await db.update('stock_quants', sq.id, { quantity: Number(sq.quantity||0) + item.actualQty }); }
            else if (locId) { await db.insert('stock_quants', { product_id: variantId, location_id: locId, quantity: item.actualQty }); }
          }
        }
        setItems(prev => prev.map(i => i.productId === item.productId ? {...i, state: 'priced'} : i));
      } catch(e) { console.error(e); }
    }
    setSaving(false);
  };

  const toggleGroup = (sid: string) => {
    setExpanded(prev => prev.includes(sid) ? prev.filter(id => id !== sid) : [...prev, sid]);
  };

  const pendingCount = items.filter(i => i.state === 'pending').length;
  const pricedCount = items.filter(i => i.state === 'priced').length;

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><p className="text-gray-400">載入中...</p></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <button onClick={()=>nav('/')} className="text-gray-400 hover:text-gray-600 w-8 h-8 flex items-center justify-center rounded-lg bg-transparent hover:bg-gray-100 transition-colors border-none"><Arrow/></button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">採購定價</h1>
            <p className="text-sm text-gray-400">{items.length} 品項 · {pendingCount} 待定價 · {pricedCount} 已定價</p>
          </div>
        </div>
        <div className="flex gap-2">
          {pendingCount > 0 && (
            <button onClick={applyAll} disabled={saving}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${saving ? 'bg-gray-200 text-gray-400' : 'bg-primary text-white hover:bg-green-700'}`}>
              <PricingIcon />
              {saving ? '處理中...' : `一鍵全部定價 (${pendingCount})`}
            </button>
          )}
        </div>
      </header>

      <div className="p-6 max-w-6xl mx-auto">
        {items.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <PackageIcon />
            <p className="text-gray-500 font-medium">尚無採購品項</p>
            <p className="text-sm text-gray-400">訂單明細將在此彙總顯示</p>
            <button onClick={()=>nav('/admin/purchase-list')} className="text-primary hover:underline text-sm mt-2">先去查看訂單接收 →</button>
          </div>
        ) : (
          <div className="space-y-4">
            {Array.from(groups.entries()).map(([sid, groupItems]) => {
              const sup = suppliers[sid];
              const isOpen = expanded.includes(sid);
              const groupPriced = groupItems.filter(i => i.state === 'priced').length;
              const groupTotal = groupItems.reduce((s, i) => s + i.purchasePrice * i.actualQty, 0);
              return (
                <div key={sid} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                  <div role="button" onClick={() => toggleGroup(sid)} className="w-full px-4 py-4 flex justify-between items-center bg-white hover:bg-gray-50 cursor-pointer">
                    <div className="text-left">
                      <p className="font-bold text-gray-900">{sup?.name || sid}</p>
                      <p className="text-sm text-gray-400">{sup?.ref ? `${sup.ref} · ` : ''}{groupItems.length} 品項 · {groupPriced}/{groupItems.length} 已定價</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {groupTotal > 0 && <span className="text-sm font-bold text-primary">${Math.round(groupTotal).toLocaleString()}</span>}
                      <span className="text-gray-400 text-xl">{isOpen ? '▾' : '▸'}</span>
                    </div>
                  </div>
                  {isOpen && (
                    <div className="border-t border-gray-100">
                      <table className="w-full text-sm">
                        <thead><tr className="bg-gray-50 text-gray-500 text-xs">
                          <th className="py-2 px-3 text-left font-medium">品名</th>
                          <th className="py-2 px-3 text-right font-medium w-20">預估量</th>
                          <th className="py-2 px-3 text-right font-medium w-20">實際量</th>
                          <th className="py-2 px-3 text-right font-medium w-24">進貨價</th>
                          <th className="py-2 px-3 text-center font-medium w-16">加成%</th>
                          <th className="py-2 px-3 text-right font-medium w-20">售價</th>
                          <th className="py-2 px-3 text-right font-medium w-24">小計</th>
                          <th className="py-2 px-3 text-center font-medium w-20">操作</th>
                        </tr></thead>
                        <tbody>
                          {groupItems.map(item => {
                            const subtotal = item.purchasePrice * item.actualQty;
                            const isPriced = item.state === 'priced';
                            return (
                              <tr key={item.productId} className={`border-b border-gray-50 ${isPriced ? 'bg-green-50' : ''}`}>
                                <td className="py-2 px-3">
                                  <p className="font-medium">{item.productName}</p>
                                  {item.code && <p className="text-xs text-gray-400 font-mono">{item.code}</p>}
                                </td>
                                <td className="py-2 px-3 text-right text-gray-400">{item.estimatedQty.toFixed(1)}</td>
                                <td className="py-2 px-3 text-right">
                                  <input type="number" value={item.actualQty} step="0.5" min="0"
                                    onChange={e => updateItem(item.productId, 'actualQty', Number(e.target.value))}
                                    className="w-16 text-right py-1 px-1.5 border border-gray-200 rounded text-sm" />
                                </td>
                                <td className="py-2 px-3 text-right">
                                  <input type="number" value={item.purchasePrice || ''} step="1" min="0" placeholder="$"
                                    onChange={e => updateItem(item.productId, 'purchasePrice', Number(e.target.value))}
                                    className="w-20 text-right py-1 px-1.5 border border-gray-200 rounded text-sm" />
                                </td>
                                <td className="py-2 px-3 text-center">
                                  <input type="number" value={item.markupRate} step="5" min="100"
                                    onChange={e => updateItem(item.productId, 'markupRate', Number(e.target.value))}
                                    className="w-14 text-center py-1 px-1 border border-gray-200 rounded text-sm" />
                                </td>
                                <td className="py-2 px-3 text-right font-bold text-primary">
                                  {item.sellingPrice > 0 ? `$${item.sellingPrice}` : '—'}
                                </td>
                                <td className="py-2 px-3 text-right font-medium">
                                  {subtotal > 0 ? `$${Math.round(subtotal).toLocaleString()}` : '—'}
                                </td>
                                <td className="py-2 px-3 text-center">
                                  {isPriced ? (
                                    <span className="text-green-600 text-xs font-medium flex items-center justify-center gap-1"><CheckIcon /> 已定</span>
                                  ) : (
                                    <button onClick={() => applyPricing(item.productId)} disabled={item.purchasePrice <= 0 || saving}
                                      className={`px-2 py-1 rounded text-xs transition-colors ${item.purchasePrice > 0 ? 'bg-primary text-white hover:bg-green-700' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}>
                                      確認
                                    </button>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot><tr className="bg-gray-50 font-bold border-t border-gray-200">
                          <td className="py-2 px-3 text-right" colSpan={6}>小計</td>
                          <td className="py-2 px-3 text-right text-primary">${Math.round(groupTotal).toLocaleString()}</td>
                          <td></td>
                        </tr></tfoot>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
'''


def sales_orders() -> str:
    """P0-2: 銷貨單管理 — 含配貨數量調整"""
    return r'''import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as db from '../../db';
import { useData } from '../../data/DataProvider';
import ConfirmDialog from '../../components/ConfirmDialog';
''' + _ARROW + r'''
const RefreshIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>;
const SearchIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>;
const EmptySearchIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>;
const CheckAllIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>;
const ST: Record<string,{label:string;color:string;bg:string}> = {
  draft:{label:'草稿',color:'#92400e',bg:'#fef3c7'},sent:{label:'已送出',color:'#1e40af',bg:'#dbeafe'},
  sale:{label:'已確認',color:'#065f46',bg:'#d1fae5'},done:{label:'完成',color:'#374151',bg:'#f3f4f6'},
  cancel:{label:'已取消',color:'#991b1b',bg:'#fee2e2'},
};
export default function SalesOrdersPage() {
  const nav = useNavigate();
  const { orders: allOrders, customers: custs, orderLines, stockQuants, productProducts, loading, refresh } = useData();
  const [orders, setOrders] = useState<any[]>([]);
  const [localLines, setLocalLines] = useState<Record<string,any>>({});
  // #3 合併全域 orderLines 與本地修改
  const lines = orderLines.map(l => localLines[l.id] ? {...l, ...localLines[l.id]} : l);
  const [search,setSearch]=useState(''); const [filter,setFilter]=useState('all');
  const [expanded,setExpanded]=useState<string|null>(null);
  const [selectedOrders,setSelectedOrders]=useState<Set<string>>(new Set());
  const [confirm,setConfirm]=useState<{id:string;action:string}|null>(null);
  const [editingLine,setEditingLine]=useState<string|null>(null);

  // 同步 allOrders 到本地 state
  useEffect(() => {
    if (!loading && allOrders.length > 0) {
      const sorted = [...allOrders].sort((a:any,b:any) => new Date(b.date_order||b.created_at||0).getTime() - new Date(a.date_order||a.created_at||0).getTime());
      setOrders(sorted);
    }
  }, [allOrders, loading]);


  // stockMap: template_id -> total quantity (支援 variant 間接映射)
  const stockMap = useMemo(() => {
    // variant_id -> template_id 映射
    const vtMap: Record<string, string> = {};
    for (const v of productProducts) { if (v.product_tmpl_id) vtMap[v.id] = v.product_tmpl_id; }
    const sm: Record<string, number> = {};
    for (const q of stockQuants) {
      if (!q.product_id) continue;
      const tmplId = vtMap[q.product_id] || q.product_id; // fallback: 直接用 product_id
      sm[tmplId] = (sm[tmplId]||0) + Number(q.quantity||0);
    }
    return sm;
  }, [stockQuants, productProducts]);

  const doAction = async () => {
    if (!confirm) return;
    const oldState = orders.find(o => o.id === confirm.id)?.state;
    if (confirm.action === 'sale' && oldState === 'draft') {
      const ol = lines.filter(l => l.order_id === confirm.id);
      let oversold = false; let msg = '';
      for (const l of ol) {
        const pid = l.product_template_id || l.product_id; const req = Number(l.product_uom_qty||0);
        const avail = stockMap[pid] || 0;
        if (avail < req) { oversold = true; msg += `[${l.name||'商品'}] 庫存不足 (需 ${req}, 餘 ${avail})\n`; }
      }
      if (oversold) { alert(msg + '請先補足庫存再確認訂單。'); setConfirm(null); return; }
      
      try {
        for (const l of ol) {
          const pid = l.product_template_id || l.product_id; let req = Number(l.product_uom_qty||0);
          const quants = stockQuants.filter(q => q.product_id === pid);
          for (const q of quants) {
            if (req <= 0) break;
            const qqty = Number(q.quantity||0);
            if (qqty > 0) {
              const deduct = Math.min(qqty, req);
              await db.update('stock_quants', q.id, { quantity: qqty - deduct });
              req -= deduct; q.quantity = qqty - deduct;
            }
          }
        }
      } catch(e:any) { console.error(e); alert('扣除庫存失敗，查無紀錄或網路異常'); return; }
    }

    try { await db.update('sale_orders', confirm.id, {state: confirm.action}); setOrders(prev => prev.map(o => o.id===confirm.id ? {...o, state: confirm.action} : o)); }
    catch(e:any) { console.error('失敗:', e.message); }
    setConfirm(null);
  };

  const updateLineQty = async (lineId: string, qty: number) => {
    try {
      await db.update('sale_order_lines', lineId, {qty_delivered: qty});
      setLocalLines(prev => ({...prev, [lineId]: {qty_delivered: qty}}));
      setEditingLine(null);
    } catch(e:any) { console.error('更新失敗:', e.message); }
  };

  const toggleSelect = (id: string) => {
    setSelectedOrders(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };
  const selectAll = () => {
    if (selectedOrders.size === filtered.length) setSelectedOrders(new Set());
    else setSelectedOrders(new Set(filtered.map(o => o.id)));
  };

  const batchAction = async (action: string) => {
    const targetOrders = orders.filter(o => selectedOrders.has(o.id));
    if (action === 'sale') {
      const draftOrders = targetOrders.filter(o => o.state === 'draft');
      const demand: Record<string, number> = {};
      const demandNames: Record<string, string> = {};
      for (const o of draftOrders) {
        for (const l of lines.filter(x => x.order_id === o.id)) {
          const pid = l.product_template_id || l.product_id;
          if (pid) { demand[pid] = (demand[pid]||0) + Number(l.product_uom_qty||0); demandNames[pid] = l.name||'商品'; }
        }
      }
      let oversold = false; let msg = '';
      for (const [pid, req] of Object.entries(demand)) {
        const avail = stockMap[pid] || 0;
        if (avail < req) { oversold = true; msg += `[${demandNames[pid]}] 總需 ${req}, 僅餘 ${avail}\n`; }
      }
      if (oversold) { alert(msg + '庫存不足，無法批次確認訂單！\n(尚未扣除任何庫存)'); return; }

      try {
        for (const [pid, totalReq] of Object.entries(demand)) {
          let req = totalReq;
          const quants = stockQuants.filter(q => q.product_id === pid);
          for (const q of quants) {
            if (req <= 0) break;
            const qqty = Number(q.quantity||0);
            if (qqty > 0) { const deduct = Math.min(qqty, req); await db.update('stock_quants', q.id, { quantity: qqty - deduct }); req -= deduct; q.quantity = qqty - deduct; }
          }
        }
      } catch(e:any) { console.error(e); alert('批次扣除庫存失敗'); return; }
    }

    for (const id of selectedOrders) {
      const o = targetOrders.find(x => x.id === id);
      if (action === 'sale' && o?.state !== 'draft') continue; // only process draft ones
      try { await db.update('sale_orders', id, {state: action}); } catch(e) {}
    }
    setOrders(prev => prev.map(o => selectedOrders.has(o.id) && (action !== 'sale' || o.state === 'draft') ? {...o, state: action} : o));
    setSelectedOrders(new Set());
  };

  const filtered = orders.filter(o => {
    if (filter !== 'all' && o.state !== filter) return false;
    if (search) { const s = search.toLowerCase(); if (!(custs[o.customer_id]?.name||'').toLowerCase().includes(s) && !(o.name||'').toLowerCase().includes(s)) return false; }
    return true;
  });
  const co = confirm ? orders.find(o => o.id===confirm.id) : null;
  const draftSelected = [...selectedOrders].filter(id => orders.find(o => o.id===id)?.state === 'draft').length;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <button onClick={()=>nav('/')} className="text-gray-400 hover:text-gray-600 w-8 h-8 flex items-center justify-center rounded-lg bg-transparent hover:bg-gray-100 transition-colors border-none"><Arrow/></button>
          <div><h1 className="text-xl font-bold text-gray-900">銷貨單管理</h1><p className="text-sm text-gray-400">{orders.length} 筆訂單</p></div>
        </div>
        <div className="flex gap-2">
          {draftSelected > 0 && (
            <button onClick={()=>batchAction('sale')} className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center gap-1.5">
              <CheckAllIcon /> 批次確認 ({draftSelected})
            </button>
          )}
          <button onClick={()=>refresh(true)} className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200 transition-colors flex items-center gap-1.5"><RefreshIcon /> 重新整理</button>
        </div>
      </header>
      <div className="px-6 pt-4 flex gap-3 flex-wrap">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 flex-1 min-w-[200px]">
          <SearchIcon />
          <input type="text" placeholder="搜尋訂單編號或客戶..." value={search} onChange={e=>setSearch(e.target.value)} className="border-none outline-none bg-transparent flex-1 text-sm" />
        </div>
        <select className="px-3 pr-8 py-2 border border-gray-200 rounded-lg bg-white text-sm" value={filter} onChange={e=>setFilter(e.target.value)}>
          <option value="all">全部狀態</option><option value="draft">草稿</option><option value="sale">已確認</option><option value="done">完成</option><option value="cancel">已取消</option>
        </select>
      </div>
      {filtered.length > 0 && (
        <div className="px-6 pt-3 flex items-center gap-2">
          <button onClick={selectAll} className="text-sm text-primary hover:bg-green-50 px-3 py-1.5 rounded-md transition-colors border border-transparent hover:border-green-200 focus:outline-none">{selectedOrders.size === filtered.length ? '取消全選' : '全選'}</button>
          {selectedOrders.size > 0 && <span className="text-sm text-gray-400">{selectedOrders.size} 已選</span>}
        </div>
      )}
      <div className="p-6 max-w-6xl mx-auto">
        {loading ? <div className="text-center text-gray-400 py-12">載入中...</div>
        : filtered.length === 0 ? (
          <div className="text-center py-12 space-y-3"><EmptySearchIcon /><p className="text-gray-500 font-medium">沒有符合的訂單</p></div>
        ) : <div className="space-y-3">{filtered.map(o => {
          const st = ST[o.state] || ST.draft; const cust = custs[o.customer_id]; const ol = lines.filter(l => l.order_id===o.id); const exp = expanded===o.id;
          return (<div key={o.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div role="button" className="px-4 py-4 flex justify-between items-center bg-white hover:bg-gray-50 cursor-pointer" onClick={()=>setExpanded(exp?null:o.id)}>
              <div className="flex items-center gap-3">
                <input type="checkbox" checked={selectedOrders.has(o.id)} onChange={e=>{e.stopPropagation();toggleSelect(o.id);}} className="accent-primary" onClick={e=>e.stopPropagation()} />
                <div className="text-left"><p className="font-bold text-gray-900">{o.name||`SO-${(o.id||'').slice(0,8)}`}</p>
                <p className="text-sm text-gray-400">{cust?.name||'—'} · {o.date_order?new Date(o.date_order).toLocaleDateString('zh-TW'):'—'}</p></div>
              </div>
              <div className="flex items-center gap-3">
                <span style={{color:st.color,background:st.bg,padding:'3px 10px',borderRadius:'20px',fontSize:'12px',fontWeight:600}}>{st.label}</span>
                <span className="font-bold text-gray-900">{o.amount_total!=null?`$${Number(o.amount_total).toLocaleString()}`:'—'}</span>
                <span className="text-gray-400">{exp?'▾':'▸'}</span>
              </div>
            </div>
            {exp && <div className="border-t border-gray-200 px-4 py-3">
              {ol.length===0?<p className="text-sm text-gray-400">無明細行</p>:(
                <table className="w-full text-sm"><thead><tr className="text-gray-400 text-xs border-b border-gray-100">
                  <th className="py-2 text-left">品名</th><th className="py-2 text-right">需求量</th><th className="py-2 text-right">配貨量</th><th className="py-2 text-right">單價</th><th className="py-2 text-right">金額</th>
                </tr></thead><tbody>{ol.map(l => {
                  const qty = Number(l.product_uom_qty||0);
                  const allocated = l.qty_delivered != null ? Number(l.qty_delivered) : qty;
                  const price = Number(l.price_unit||0);
                  const amount = allocated * price;
                  const isEditing = editingLine === l.id;
                  return (<tr key={l.id} className="border-b border-gray-50">
                    <td className="py-2 font-medium">{l.name||'—'}</td>
                    <td className="py-2 text-right text-gray-400">{qty.toFixed(1)}</td>
                    <td className="py-2 text-right">
                      {isEditing ? (
                        <input type="number" defaultValue={allocated} step="0.5" min="0" autoFocus className="w-16 text-right py-0.5 px-1 border border-gray-300 rounded text-sm"
                          onBlur={e => updateLineQty(l.id, Number(e.target.value))} onKeyDown={e => { if(e.key==='Enter') updateLineQty(l.id, Number((e.target as HTMLInputElement).value)); if(e.key==='Escape') setEditingLine(null); }} />
                      ) : (
                        <span className={`cursor-pointer hover:bg-gray-100 px-1 py-0.5 rounded ${allocated !== qty ? 'text-orange-600 font-bold' : ''}`}
                          onClick={e => { e.stopPropagation(); setEditingLine(l.id); }}>{allocated.toFixed(1)}</span>
                      )}
                    </td>
                    <td className="py-2 text-right">${price.toLocaleString()}</td>
                    <td className="py-2 text-right font-bold text-primary">{amount > 0 ? `$${Math.round(amount).toLocaleString()}` : '—'}</td>
                  </tr>);
                })}</tbody></table>
              )}
              {o.state==='draft' && <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                <button onClick={()=>setConfirm({id:o.id,action:'sale'})} className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors">確認訂單</button>
                <button onClick={()=>setConfirm({id:o.id,action:'cancel'})} className="px-4 py-2 bg-gray-100 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors">取消訂單</button>
              </div>}
            </div>}
          </div>);
        })}</div>}
      </div>
      <ConfirmDialog open={!!confirm} title={confirm?.action==='sale'?`確認訂單 ${co?.name||''}？`:`取消訂單 ${co?.name||''}？`}
        message={confirm?.action==='sale'?'確認後訂單將進入已確認狀態。':'取消後訂單將被標記為已取消。'}
        confirmText={confirm?.action==='sale'?'確認':'取消訂單'} variant={confirm?.action==='cancel'?'danger':'info'}
        onConfirm={doAction} onCancel={()=>setConfirm(null)} />
    </div>
  );
}
'''

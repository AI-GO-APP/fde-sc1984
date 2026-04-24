import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../data/DataProvider';
import DatePickerWithCounts from '../../components/DatePickerWithCounts';
import * as db from '../../db';

const Arrow = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>;
const BoxIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>;
const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>;

const ALL_TAB = '__all__';

function _normId(v: any): string {
  return Array.isArray(v) ? String(v[0]) : String(v || '');
}

function AddStockModal({ products, categories, productProducts, stockQuants, stockLocations, onClose, onDone }: {
  products: any[]; categories: Record<string, string>;
  productProducts: any[]; stockQuants: any[]; stockLocations: any[];
  onClose: () => void; onDone: (tmplId: string) => void;
}) {
  const [selectedTmplId, setSelectedTmplId] = useState('');
  const [qty, setQty] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const tmplToPp = useMemo(() => {
    const m: Record<string, string> = {};
    for (const pp of productProducts) {
      const tmplId = _normId(pp.product_tmpl_id);
      if (tmplId && pp.id) m[tmplId] = String(pp.id);
    }
    return m;
  }, [productProducts]);

  const _getLocId = async (): Promise<string> => {
    let locId = stockLocations.find((l: any) => l.usage === 'internal')?.id || stockLocations[0]?.id;
    if (!locId) {
      const fresh: any[] = await db.query('stock_locations').catch(() => []);
      locId = fresh.find((l: any) => l.usage === 'internal')?.id || fresh[0]?.id;
    }
    if (!locId) {
      const created = await db.insert('stock_locations', { name: 'WH/Stock', usage: 'internal', active: true });
      locId = created?.id;
    }
    return locId || '';
  };

  const handleSubmit = async () => {
    if (!selectedTmplId) { setError('請選擇商品'); return; }
    const qtyNum = Number(qty);
    if (!qty || isNaN(qtyNum) || qtyNum === 0) { setError('請輸入有效數量'); return; }
    setSaving(true);
    setError('');
    try {
      const ppId = tmplToPp[selectedTmplId] || selectedTmplId;
      let sq = stockQuants.find((q: any) => _normId(q.product_id) === ppId);
      if (!sq) {
        const fresh: any[] = await db.queryFiltered('stock_quants', [{ column: 'product_id', op: 'eq', value: ppId }]).catch(() => []);
        sq = fresh[0];
      }
      if (sq) {
        await db.update('stock_quants', sq.id, { quantity: Number(sq.quantity || 0) + qtyNum });
      } else {
        const locId = await _getLocId();
        if (!locId) throw new Error('無法取得庫位');
        await db.insert('stock_quants', { product_id: ppId, location_id: locId, quantity: qtyNum });
      }
      onDone(selectedTmplId);
    } catch (e: any) {
      setError(e.message || '新增失敗');
    } finally {
      setSaving(false);
    }
  };

  // 依分類分組商品
  const grouped = useMemo(() => {
    const g: Record<string, any[]> = {};
    for (const p of products) {
      const catId = _normId(p.categ_id);
      const catName = categories[catId] || '未分類';
      if (!g[catName]) g[catName] = [];
      g[catName].push(p);
    }
    return g;
  }, [products, categories]);

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-bold text-gray-900 mb-4">新增庫存</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">商品</label>
            <select
              value={selectedTmplId}
              onChange={e => setSelectedTmplId(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">請選擇商品...</option>
              {Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b, 'zh-TW')).map(([catName, prods]) => (
                <optgroup key={catName} label={catName}>
                  {prods.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.default_code ? `[${p.default_code}] ` : ''}{p.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">數量（正數增加，負數扣減）</label>
            <input
              type="number"
              value={qty}
              step="0.5"
              onChange={e => setQty(e.target.value)}
              placeholder="輸入數量..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
            取消
          </button>
          <button onClick={handleSubmit} disabled={saving} className="flex-1 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-green-700 transition-colors disabled:bg-gray-300">
            {saving ? '儲存中...' : '確認新增'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function StockPage() {
  const nav = useNavigate();
  const { products, productProducts, stockQuants, stockLocations, loading, selectedDate, setSelectedDate, refresh } = useData();
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState(ALL_TAB);
  const [categories, setCategories] = useState<Record<string, string>>({});

  useEffect(() => {
    db.query('product_categories').then((rows: any[]) => {
      const m: Record<string, string> = {};
      for (const r of rows) if (r.id && r.name) m[String(r.id)] = r.name;
      setCategories(m);
    }).catch(() => {});
  }, []);

  const stockMap = useMemo(() => {
    const vtMap: Record<string, string> = {};
    for (const v of productProducts) {
      const tmplId = _normId(v.product_tmpl_id);
      if (tmplId && v.id) vtMap[String(v.id)] = tmplId;
    }
    const sm: Record<string, number> = {};
    for (const q of stockQuants) {
      if (!q.product_id) continue;
      const tmplId = vtMap[_normId(q.product_id)] || _normId(q.product_id);
      sm[tmplId] = (sm[tmplId] || 0) + Number(q.quantity || 0);
    }
    return sm;
  }, [productProducts, stockQuants]);

  // 分類 tab 清單（依分類名排序）
  const tabs = useMemo(() => {
    const catSet = new Set<string>();
    for (const p of products) {
      const catId = _normId(p.categ_id);
      const name = categories[catId];
      if (name) catSet.add(name);
    }
    return Array.from(catSet).sort((a, b) => a.localeCompare(b, 'zh-TW'));
  }, [products, categories]);

  // 依 tab 過濾商品
  const filteredProducts = useMemo(() => {
    if (activeTab === ALL_TAB) return products;
    return products.filter(p => {
      const catId = _normId(p.categ_id);
      return categories[catId] === activeTab;
    });
  }, [products, categories, activeTab]);

  const handleAddDone = (tmplId: string) => {
    setShowModal(false);
    refresh(true);
    // 切換到該商品所屬分類的頁籤
    const prod = products.find(p => p.id === tmplId);
    if (prod) {
      const catId = _normId(prod.categ_id);
      const catName = categories[catId];
      if (catName && tabs.includes(catName)) setActiveTab(catName);
    }
  };

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><p className="text-gray-400">載入中...</p></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <button onClick={() => nav('/admin/daily')} className="text-gray-400 hover:text-gray-600 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"><Arrow /></button>
          <div><h1 className="text-xl font-bold text-gray-900">庫存總表</h1><p className="text-sm text-gray-400">{products.length} 個商品</p></div>
        </div>
        <div className="flex items-center gap-2">
          <DatePickerWithCounts value={selectedDate} onChange={setSelectedDate} />
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
          >
            <PlusIcon />
            新增庫存
          </button>
        </div>
      </header>

      {/* 分類頁籤 */}
      {tabs.length > 0 && (
        <div className="bg-white border-b border-gray-200 px-6">
          <div className="flex gap-0 overflow-x-auto">
            <button
              onClick={() => setActiveTab(ALL_TAB)}
              className={`py-3 px-4 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${activeTab === ALL_TAB ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              全部
            </button>
            {tabs.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-3 px-4 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="p-6 max-w-5xl mx-auto">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12 space-y-3"><BoxIcon /><p className="text-gray-500 font-medium">尚無商品紀錄</p><p className="text-sm text-gray-400">商品匯入後將顯示在此</p></div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <table className="w-full text-sm"><thead><tr className="bg-gray-50 border-b border-gray-100 text-gray-500">
              <th className="py-3 px-4 text-left font-medium">#</th>
              <th className="py-3 px-4 text-left font-medium">編號</th>
              <th className="py-3 px-4 text-left font-medium">品名</th>
              <th className="py-3 px-4 text-right font-medium">進貨價</th>
              <th className="py-3 px-4 text-right font-medium">售價</th>
              <th className="py-3 px-4 text-right font-medium">庫存數量</th>
            </tr></thead><tbody>
              {filteredProducts.map((p, i) => {
                const qty = stockMap[p.id] || 0;
                return (<tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-2.5 px-4 text-gray-400">{i + 1}</td>
                  <td className="py-2.5 px-4 font-mono text-xs text-gray-400">{p.default_code || '—'}</td>
                  <td className="py-2.5 px-4 font-medium">{p.name}</td>
                  <td className="py-2.5 px-4 text-right">{Number(p.standard_price || 0) > 0 ? `$${Number(p.standard_price).toLocaleString()}` : '—'}</td>
                  <td className="py-2.5 px-4 text-right font-bold text-primary">{Number(p.list_price || 0) > 0 ? `$${Number(p.list_price).toLocaleString()}` : '—'}</td>
                  <td className="py-2.5 px-4 text-right"><span className={`font-bold ${qty > 0 ? 'text-green-600' : 'text-gray-400'}`}>{qty > 0 ? qty.toFixed(1) : '0'}</span></td>
                </tr>);
              })}
            </tbody></table>
          </div>
        )}
      </div>

      {showModal && (
        <AddStockModal
          products={products}
          categories={categories}
          productProducts={productProducts}
          stockQuants={stockQuants}
          stockLocations={stockLocations}
          onClose={() => setShowModal(false)}
          onDone={handleAddDone}
        />
      )}
    </div>
  );
}

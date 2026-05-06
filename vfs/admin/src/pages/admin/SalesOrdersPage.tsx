import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import * as db from '../../db';
import { useData } from '../../data/DataProvider';
import { fmtQty } from '../../utils/displayHelpers';
import ConfirmDialog from '../../components/ConfirmDialog';
import DatePickerWithCounts from '../../components/DatePickerWithCounts';
const Arrow = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>;
const RefreshIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>;
const SearchIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>;
const EmptySearchIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>;
const CheckAllIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>;
const ST: Record<string,{label:string;color:string;bg:string}> = {
  draft:{label:'已接收',color:'#92400e',bg:'#fef3c7'},sent:{label:'已送出',color:'#1e40af',bg:'#dbeafe'},
  sale:{label:'已確認',color:'#065f46',bg:'#d1fae5'},confirm:{label:'已確認',color:'#065f46',bg:'#d1fae5'},
  done:{label:'完成',color:'#374151',bg:'#f3f4f6'},cancel:{label:'已取消',color:'#991b1b',bg:'#fee2e2'},
};
export default function SalesOrdersPage() {
  const nav = useNavigate();
  const { orders: allOrders, customers: custs, orderLines, stockQuants, productProducts, loading, refresh, selectedDate, setSelectedDate } = useData();
  const [orders, setOrders] = useState<any[]>([]);
  const [localLines, setLocalLines] = useState<Record<string,any>>({});
  // #3 合併全域 orderLines 與本地修改
  const lines = orderLines.map(l => localLines[l.id] ? {...l, ...localLines[l.id]} : l);
  const [search,setSearch]=useState(''); const [filter,setFilter]=useState('all');
  const [expanded,setExpanded]=useState<string|null>(null);
  const [selectedOrders,setSelectedOrders]=useState<Set<string>>(new Set());
  const [confirm,setConfirm]=useState<{id:string;action:string}|null>(null);
  const [editingLine,setEditingLine]=useState<string|null>(null);
  const [editingNote,setEditingNote]=useState<string|null>(null);
  const [confirmingOrder,setConfirmingOrder]=useState<string|null>(null);

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
      try {
        const r = await db.runAction('confirm_order', { order_ids: [confirm.id] });
        const detail = r?.data || r;
        if ((detail?.errors || 0) > 0) {
          const msg = (detail.error_details || []).map((e:any) => {
            if (e.error === 'oversold') {
              return (e.shortage||[]).map((s:any)=>`[${s.name||s.product_id}] 需 ${s.need}, 餘 ${s.have}`).join('\n');
            }
            return `${e.order_id}: ${e.error}`;
          }).join('\n');
          alert(msg + '\n確認訂單失敗。');
          setConfirm(null); return;
        }
        setOrders(prev => prev.map(o => o.id===confirm.id ? {...o, state: 'sale'} : o));
        await refresh();
      } catch(e:any) {
        console.error('確認訂單失敗:', e.message);
        alert(`確認訂單失敗：${e.message}`);
      }
      setConfirm(null); return;
    }

    try {
      await db.update('sale_orders', confirm.id, {state: confirm.action});
      setOrders(prev => prev.map(o => o.id===confirm.id ? {...o, state: confirm.action} : o));
    } catch(e:any) {
      console.error('狀態更新失敗:', e.message);
      alert(`狀態更新失敗：${e.message}`);
    }
    setConfirm(null);
  };

  const updateLineQty = async (lineId: string, qty: number) => {
    try {
      await db.update('sale_order_lines', lineId, {qty_delivered: qty});
      setLocalLines(prev => ({...prev, [lineId]: {...(prev[lineId]||{}), qty_delivered: qty}}));
      setEditingLine(null);
      const ordLine = lines.find(l => l.id === lineId);
      if (ordLine) {
        const oid = Array.isArray(ordLine.order_id) ? String(ordLine.order_id[0]) : String(ordLine.order_id || '');
        await db.recalcOrderTotal([oid]);
      }
    } catch(e:any) { console.error('更新失敗:', e.message); }
  };

  const confirmOrder = async (oid: string) => {
    setConfirmingOrder(oid);
    try {
      const r = await db.runAction('confirm_order', { order_ids: [oid] });
      const detail = r?.data || r;
      if ((detail?.errors || 0) > 0) {
        const msg = (detail.error_details || []).map((e:any) => `${e.order_id}: ${e.error}`).join('\n');
        alert(`產銷貨單失敗：\n${msg}`);
        return;
      }
      setOrders(prev => prev.map(o => o.id === oid ? {...o, state: 'sale'} : o));
      await refresh();
    } catch(e:any) { alert(`產銷貨單失敗：${e.message}`); }
    finally { setConfirmingOrder(null); }
  };

  const updateLineNote = async (lineId: string, note: string) => {
    try {
      const cur = lines.find(l => l.id === lineId);
      const cd = (cur?.custom_data && typeof cur.custom_data === 'object') ? cur.custom_data : {};
      const next = {...cd, note};
      await db.update('sale_order_lines', lineId, {custom_data: next});
      setLocalLines(prev => ({...prev, [lineId]: {...(prev[lineId]||{}), custom_data: next}}));
      setEditingNote(null);
    } catch(e:any) { console.error('備註更新失敗:', e.message); }
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
      const draftIds = targetOrders.filter(o => o.state === 'sent').map(o => o.id);
      if (draftIds.length === 0) { setSelectedOrders(new Set()); return; }
      try {
        const r = await db.runAction('confirm_order', { order_ids: draftIds });
        const detail = r?.data || r;
        if ((detail?.errors || 0) > 0) {
          const msg = (detail.error_details || []).map((e:any) => {
            if (e.error === 'oversold') {
              return `${e.order_id}:\n` + (e.shortage||[]).map((s:any)=>`  [${s.name||s.product_id}] 需 ${s.need}, 餘 ${s.have}`).join('\n');
            }
            return `${e.order_id}: ${e.error}`;
          }).join('\n');
          alert(`部分訂單失敗（成功 ${detail.confirmed||0} / 失敗 ${detail.errors}）：\n${msg}`);
        }
        const okIds = new Set((detail.results || []).map((x:any) => String(x.order_id)));
        setOrders(prev => prev.map(o => okIds.has(String(o.id)) ? {...o, state: 'sale'} : o));
        await refresh();
      } catch(e:any) { console.error(e); alert('批次確認失敗：' + e.message); }
      setSelectedOrders(new Set()); return;
    }

    for (const id of selectedOrders) {
      const o = targetOrders.find(x => x.id === id);
      if (action === 'sale' && o && !isDraft(o)) continue;
      try { await db.update('sale_orders', id, {state: action}); } catch(e) {}
    }
    setOrders(prev => prev.map(o => selectedOrders.has(o.id) && (action !== 'sale' || isDraft(o)) ? {...o, state: action} : o));
    setSelectedOrders(new Set());
  };

  const isDraft = (o:any) => !o.state || o.state === 'draft';
  const dateIds = useMemo(() =>
    new Set(lines.filter((l:any) => String(l.delivery_date||'').slice(0,10) === selectedDate).map((l:any) => { const v = l.order_id; return Array.isArray(v) ? String(v[0]) : String(v||''); })),
    [lines, selectedDate]
  );
  const filtered = orders.filter(o => {
    if (filter !== 'all') {
      if (filter === 'draft' ? !isDraft(o) : o.state !== filter) return false;
    }
    if (!dateIds.has(String(o.id))) return false;
    if (search) { const s = search.toLowerCase(); if (!(custs[o.customer_id]?.name||'').toLowerCase().includes(s) && !(o.name||'').toLowerCase().includes(s)) return false; }
    return true;
  });
  const co = confirm ? orders.find(o => o.id===confirm.id) : null;
  const draftSelected = [...selectedOrders].filter(id => { const o = orders.find(x => x.id===id); return o ? o.state === 'sent' : false; }).length;

  return (
    <div style={{height:'100vh',display:'flex',flexDirection:'column',overflow:'hidden',background:'#f9fafb'}}>
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center" style={{flexShrink:0}}>
        <div className="flex items-center gap-3">
          <button onClick={()=>nav('/admin/daily')} className="text-gray-400 hover:text-gray-600 w-8 h-8 flex items-center justify-center rounded-lg bg-transparent hover:bg-gray-100 transition-colors border-none"><Arrow/></button>
          <div><h1 className="text-xl font-bold text-gray-900">銷貨單管理</h1><p className="text-sm text-gray-400">{orders.length} 筆訂單</p></div>
        </div>
        <div className="flex items-center gap-2">
          <DatePickerWithCounts value={selectedDate} onChange={setSelectedDate} />
          {draftSelected > 0 && (
            <button onClick={()=>batchAction('sale')} className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center gap-1.5">
              <CheckAllIcon /> 批次確認 ({draftSelected})
            </button>
          )}
          <button onClick={()=>refresh(true)} className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200 transition-colors flex items-center gap-1.5"><RefreshIcon /> 重新整理</button>
        </div>
      </header>
      <div style={{flexShrink:0}} className="px-6 pt-4 flex gap-3 flex-wrap">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 flex-1 min-w-[200px]">
          <SearchIcon />
          <input type="text" placeholder="搜尋訂單編號或客戶..." value={search} onChange={e=>setSearch(e.target.value)} className="border-none outline-none bg-transparent flex-1 text-sm" />
        </div>
        <select className="py-2 pr-6 text-sm text-gray-600 bg-transparent border-b border-gray-300 outline-none cursor-pointer" value={filter} onChange={e=>setFilter(e.target.value)}>
          <option value="all">全部狀態</option>
          <option value="draft">已接收</option>
          <option value="sale">已確認</option>
          <option value="done">完成</option>
          <option value="cancel">已取消</option>
        </select>
      </div>
      {filtered.length > 0 && (
        <div style={{flexShrink:0}} className="px-6 pt-3 flex items-center gap-2">
          <button onClick={selectAll} className="text-sm text-primary hover:bg-green-50 px-3 py-1.5 rounded-md transition-colors border border-transparent hover:border-green-200 focus:outline-none">{selectedOrders.size === filtered.length ? '取消全選' : '全選'}</button>
          {selectedOrders.size > 0 && <span className="text-sm text-gray-400">{selectedOrders.size} 已選</span>}
        </div>
      )}
      <div style={{flex:1,overflowY:'auto'}}>
      <div className="p-6 pb-6 max-w-6xl mx-auto">
        {loading ? <div className="text-center text-gray-400 py-12">載入中...</div>
        : filtered.length === 0 ? (
          <div className="text-center py-12 space-y-3"><EmptySearchIcon /><p className="text-gray-500 font-medium">沒有符合的訂單</p></div>
        ) : <div className="space-y-3">{filtered.map(o => {
          const st = ST[o.state as string] || ST.draft; const cust = custs[o.customer_id]; const ol = lines.filter(l => l.order_id===o.id); const exp = expanded===o.id;
          return (<div key={o.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div role="button" className="px-4 py-4 flex justify-between items-center bg-white hover:bg-gray-50 cursor-pointer" onClick={()=>setExpanded(exp?null:o.id)}>
              <div className="flex items-center gap-3">
                <input type="checkbox" checked={selectedOrders.has(o.id)} onChange={e=>{e.stopPropagation();toggleSelect(o.id);}} className="accent-primary" onClick={e=>e.stopPropagation()} />
                <div className="text-left"><p className="font-bold text-gray-900">{o.name||`SO-${(o.id||'').slice(0,8)}`}</p>
                <p className="text-sm text-gray-400">{cust?.name||'—'} · {o.date_order?new Date(o.date_order).toLocaleDateString('zh-TW'):'—'}</p></div>
              </div>
              <div className="flex items-center gap-2">
                {isDraft(o) && (
                  <button onClick={e=>{e.stopPropagation();setConfirm({id:o.id,action:'cancel'});}} className="px-3 py-1.5 bg-gray-100 text-red-600 rounded-lg text-xs font-medium hover:bg-red-50 transition-colors">取消</button>
                )}
                {o.state === 'sent' && (<>
                  <button onClick={e=>{e.stopPropagation();setConfirm({id:o.id,action:'sale'});}} className="px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-medium hover:bg-green-700 transition-colors">確認</button>
                  <button onClick={e=>{e.stopPropagation();setConfirm({id:o.id,action:'cancel'});}} className="px-3 py-1.5 bg-gray-100 text-red-600 rounded-lg text-xs font-medium hover:bg-red-50 transition-colors">取消</button>
                </>)}
                <span style={{color:st.color,background:st.bg,padding:'3px 10px',borderRadius:'20px',fontSize:'12px',fontWeight:600}}>{st.label}</span>
                <span className="font-bold text-gray-900">{o.amount_total!=null?`$${Number(o.amount_total).toLocaleString()}`:'—'}</span>
                <span className="text-gray-400">{exp?'▾':'▸'}</span>
              </div>
            </div>
            {exp && <div className="border-t border-gray-200 px-4 py-3">
              {ol.length===0?<p className="text-sm text-gray-400">無明細行</p>:(
                <>
                <table className="w-full text-sm"><thead><tr className="text-gray-400 text-xs border-b border-gray-100">
                  <th className="py-2 text-left">品名</th><th className="py-2 text-right">需求量</th><th className="py-2 text-right">配貨量</th><th className="py-2 text-right">單價</th><th className="py-2 text-right">金額</th><th className="py-2 text-left">備註</th>
                </tr></thead><tbody>{ol.map(l => {
                  const qty = Number(l.product_uom_qty||0);
                  const allocated = l.qty_delivered != null ? Number(l.qty_delivered) : qty;
                  const price = Number(l.price_unit||0);
                  const amount = allocated * price;
                  const isEditing = editingLine === l.id;
                  const note = ((l.custom_data && typeof l.custom_data === 'object') ? l.custom_data.note : '') || '';
                  const isEditingNote = editingNote === l.id;
                  return (<tr key={l.id} className="border-b border-gray-50">
                    <td className="py-2 font-medium">{l.name||'—'}</td>
                    <td className="py-2 text-right text-gray-400">{fmtQty(qty)}</td>
                    <td className="py-2 text-right">
                      {isEditing ? (
                        <input type="number" defaultValue={allocated} step="0.5" min="0" autoFocus className="w-16 text-right py-0.5 px-1 border border-gray-300 rounded text-sm"
                          onBlur={e => updateLineQty(l.id, Number(e.target.value))} onKeyDown={e => { if(e.key==='Enter') updateLineQty(l.id, Number((e.target as HTMLInputElement).value)); if(e.key==='Escape') setEditingLine(null); }} />
                      ) : (
                        <span className={`cursor-pointer hover:bg-gray-100 px-1 py-0.5 rounded ${allocated !== qty ? 'text-orange-600 font-bold' : ''}`}
                          onClick={e => { e.stopPropagation(); setEditingLine(l.id); }}>{fmtQty(allocated)}</span>
                      )}
                    </td>
                    <td className="py-2 text-right">${price.toLocaleString()}</td>
                    <td className="py-2 text-right font-bold text-primary">{amount > 0 ? `$${Math.round(amount).toLocaleString()}` : '—'}</td>
                    <td className="py-2">
                      {isEditingNote ? (
                        <input type="text" defaultValue={note} autoFocus className="w-40 px-1 py-0.5 border border-gray-300 rounded text-sm"
                          onBlur={e => updateLineNote(l.id, e.target.value)} onKeyDown={e => { if(e.key==='Enter') updateLineNote(l.id, (e.target as HTMLInputElement).value); if(e.key==='Escape') setEditingNote(null); }} />
                      ) : (
                        <span className="cursor-pointer hover:bg-gray-100 px-1 py-0.5 rounded text-gray-600 text-xs" onClick={e => { e.stopPropagation(); setEditingNote(l.id); }}>{note || <span className="text-gray-300">＋備註</span>}</span>
                      )}
                    </td>
                  </tr>);
                })}</tbody></table>
                {isDraft(o) && (
                  <div className="mt-3 flex justify-end">
                    <button onClick={()=>confirmOrder(o.id)} disabled={confirmingOrder===o.id}
                      className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-1.5">
                      {confirmingOrder===o.id ? '產銷貨單中...' : '產銷貨單'}
                    </button>
                  </div>
                )}
                </>
              )}
            </div>}
          </div>);
        })}</div>}
      </div>
      </div>
      <ConfirmDialog open={!!confirm} title={confirm?.action==='sale'?`確認訂單 ${co?.name||''}？`:`取消訂單 ${co?.name||''}？`}
        message={confirm?.action==='sale'?'確認後訂單將進入已確認狀態。':'取消後訂單將被標記為已取消。'}
        confirmText={confirm?.action==='sale'?'確認':'取消訂單'} variant={confirm?.action==='cancel'?'danger':'info'}
        onConfirm={doAction} onCancel={()=>setConfirm(null)} />
    </div>
  );
}

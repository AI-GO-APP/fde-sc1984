"""v5 pages — 全部頁面使用 SVG icon + 統一 light mode"""

# SVG 箭頭（修復 ← 方框問題）
_ARROW = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>'

def dashboard() -> str:
    return r'''import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../data/DataProvider';
const Arrow = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>;
const LeafIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.9C15.5 4.9 17 3.5 19 1a13 13 0 0 1 .8 13c-1 1.8-2 3.1-3.8 4.5"/><path d="M5 20c.5-1 1.4-3 2-4.5"/></svg>;
const ClipboardIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/></svg>;
export default function DashboardPage() {
  const nav = useNavigate();
  const { orders, loading } = useData();
  const c = (s:string) => orders.filter(o=>o.state===s).length;
  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><p className="text-gray-400">載入中...</p></div>;
  const steps = [
    {step:'1',label:'訂單接收',desc:`${c('draft')} 筆待處理`,href:'/admin/purchase-list',count:c('draft')},
    {step:'2',label:'採購定價',desc:'管理採購',href:'/admin/procurement',count:0},
    {step:'3',label:'庫存總表',desc:'查看庫存',href:'/admin/stock',count:0},
    {step:'4',label:'銷貨單',desc:`${c('sale')} 筆已確認`,href:'/admin/sales-orders',count:c('sale')},
    {step:'5',label:'配送管理',desc:'出貨追蹤',href:'/admin/delivery',count:0},
  ];
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-2">
          <LeafIcon />
          <h1 className="text-2xl font-bold text-gray-900">雄泉鮮食 管理後台</h1>
        </div>
        <p className="text-sm text-gray-400">{new Date().toISOString().slice(0,10)} 今日總覽</p>
      </header>
      <div className="p-6 space-y-6 max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[{l:'全部訂單',v:orders.length,c:'text-gray-900'},{l:'草稿',v:c('draft'),c:'text-orange-600'},{l:'已確認',v:c('sale'),c:'text-blue-600'},{l:'完成',v:c('done'),c:'text-green-600'},{l:'已取消',v:c('cancel'),c:'text-red-600'}].map(s=>(
            <div key={s.l} className="bg-white rounded-xl border border-gray-100 p-4">
              <p className="text-sm text-gray-400">{s.l}</p><p className={`text-3xl font-bold ${s.c}`}>{s.v}</p>
            </div>
          ))}
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <ClipboardIcon />
            <h2 className="font-bold text-gray-900">今日流程</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {steps.map(s=>(
              <button key={s.label} onClick={()=>nav(s.href)} className="rounded-xl border border-gray-100 bg-white hover:bg-gray-50 p-4 text-left transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400 font-medium bg-gray-100 rounded-full w-5 h-5 flex items-center justify-center">{s.step}</span>
                  {s.count>0&&<span className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold">{s.count}</span>}
                </div>
                <p className="font-medium mt-1 text-gray-900 text-sm">{s.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{s.desc}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
'''

def purchase_list() -> str:
    return r'''import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../data/DataProvider';
const Arrow = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>;
const InboxIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>;
export default function PurchaseListPage() {
  const nav = useNavigate();
  const { orders, customers, orderLines: lines, loading } = useData();
  const [view, setView] = useState<'customer'|'product'>('customer');
  const [expanded, setExpanded] = useState<string|null>(null);
  const draftOrders = orders.filter(o=>o.state==='draft');
  const custGroups = new Map<string,any[]>();
  for(const o of draftOrders){const l=custGroups.get(o.customer_id)||[];l.push(o);custGroups.set(o.customer_id,l);}
  const prodSummary = new Map<string,{name:string;totalQty:number;count:number}>();
  for(const l of lines.filter(l=>draftOrders.some(o=>o.id===l.order_id))){
    const ex=prodSummary.get(l.product_template_id||l.product_id)||{name:l.name||'—',totalQty:0,count:0};
    ex.totalQty+=Number(l.product_uom_qty||0); ex.count++;
    prodSummary.set(l.product_template_id||l.product_id,ex);
  }
  if(loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><p className="text-gray-400">載入中...</p></div>;
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <button onClick={()=>nav('/')} className="text-gray-400 hover:text-gray-600 w-8 h-8 flex items-center justify-center rounded-lg bg-transparent hover:bg-gray-100 transition-colors border-none"><Arrow/></button>
          <div><h1 className="text-xl font-bold text-gray-900">今日訂單接收</h1>
          <p className="text-sm text-gray-400">{draftOrders.length} 筆訂單 · {custGroups.size} 位客戶 · {prodSummary.size} 品項</p></div>
        </div>
      </header>
      <div className="px-6 pt-4 flex gap-2">
        <button onClick={()=>setView('customer')} className={`px-4 py-1.5 rounded-full text-sm transition-colors ${view==='customer'?'bg-primary text-white':'bg-gray-100 text-gray-600'}`}>按客戶</button>
        <button onClick={()=>setView('product')} className={`px-4 py-1.5 rounded-full text-sm transition-colors ${view==='product'?'bg-primary text-white':'bg-gray-100 text-gray-600'}`}>按品項彙總</button>
      </div>
      <div className="p-6 max-w-5xl mx-auto">
        {draftOrders.length===0?(
          <div className="text-center py-12 space-y-3">
            <InboxIcon />
            <p className="text-gray-500 font-medium">暫無待處理訂單</p>
            <p className="text-sm text-gray-400">當客戶提交新訂單後，將會出現在這裡</p>
          </div>
        ):view==='customer'?(
          <div className="space-y-3">{Array.from(custGroups.entries()).map(([cid,cos])=>{
            const cust=customers[cid]; const exp=expanded===cid;
            const orderLines = lines.filter(l=>cos.some(o=>o.id===l.order_id));
            return (
              <div key={cid} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <div role="button" onClick={()=>setExpanded(exp?null:cid)} className="w-full px-4 py-4 flex justify-between items-center bg-white hover:bg-gray-50 cursor-pointer">
                  <div className="text-left"><p className="font-bold text-gray-900">{cust?.name||cid}</p><p className="text-sm text-gray-400">{cos.length} 筆訂單 · {orderLines.length} 品項</p></div>
                  <span className="text-gray-400 text-xl">{exp?'▾':'▸'}</span>
                </div>
                {exp&&<div className="border-t border-gray-100 px-4 py-3">
                  <table className="w-full text-sm"><thead><tr className="text-gray-400 text-xs"><th className="py-1 text-left">品名</th><th className="py-1 text-right">數量</th><th className="py-1 text-right">單價</th><th className="py-1 text-right">小計</th></tr></thead><tbody>
                    {orderLines.map(l=>(<tr key={l.id} className="border-t border-gray-50"><td className="py-1.5 font-medium">{l.name||'—'}</td><td className="py-1.5 text-right">{Number(l.product_uom_qty||0).toFixed(1)}</td><td className="py-1.5 text-right">${Number(l.price_unit||0).toLocaleString()}</td><td className="py-1.5 text-right font-bold text-primary">${Number(l.price_subtotal||0).toLocaleString()}</td></tr>))}
                  </tbody></table>
                </div>}
              </div>
            );
          })}</div>
        ):(
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <table className="w-full text-sm"><thead><tr className="bg-gray-50 border-b border-gray-100 text-gray-500">
              <th className="py-3 px-4 text-left font-medium">#</th><th className="py-3 px-4 text-left font-medium">品名</th>
              <th className="py-3 px-4 text-right font-medium">需求總量</th><th className="py-3 px-4 text-right font-medium">筆數</th>
            </tr></thead><tbody>
              {Array.from(prodSummary.entries()).map(([id,d],i)=>(<tr key={id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="py-3 px-4 text-gray-400">{i+1}</td><td className="py-3 px-4 font-medium">{d.name}</td>
                <td className="py-3 px-4 text-right font-bold text-primary">{d.totalQty.toFixed(1)}</td><td className="py-3 px-4 text-right">{d.count}</td>
              </tr>))}
            </tbody></table>
          </div>
        )}
      </div>
    </div>
  );
}
'''

def procurement() -> str:
    return r'''import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../data/DataProvider';
const Arrow = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>;
const PackageIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>;
export default function ProcurementPage() {
  const nav = useNavigate();
  const { orderLines: lines, loading } = useData();
  const summary = new Map<string,{name:string;totalQty:number;totalAmount:number;count:number}>();
  for(const l of lines){ const pid=l.product_template_id||l.product_id||'x';
    const ex=summary.get(pid)||{name:l.name||'—',totalQty:0,totalAmount:0,count:0};
    ex.totalQty+=Number(l.product_uom_qty||0);ex.totalAmount+=Number(l.price_subtotal||0);ex.count++;
    summary.set(pid,ex);
  }
  if(loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><p className="text-gray-400">載入中...</p></div>;
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-3">
        <button onClick={()=>nav('/')} className="text-gray-400 hover:text-gray-600 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"><Arrow/></button>
        <div><h1 className="text-xl font-bold text-gray-900">採購定價</h1><p className="text-sm text-gray-400">{summary.size} 品項 · {lines.length} 明細行</p></div>
      </header>
      <div className="p-6 max-w-6xl mx-auto">
        {summary.size===0?(
          <div className="text-center py-12 space-y-3"><PackageIcon /><p className="text-gray-500 font-medium">尚無採購品項</p><p className="text-sm text-gray-400">訂單明細將在此彙總顯示</p></div>
        ):(
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <table className="w-full text-sm"><thead><tr className="bg-gray-50 border-b border-gray-100 text-gray-500 text-xs">
              <th className="py-2 px-3 text-left font-medium w-8">#</th><th className="py-2 px-3 text-left font-medium">品名</th>
              <th className="py-2 px-3 text-right font-medium">總需求量</th><th className="py-2 px-3 text-right font-medium">總金額</th><th className="py-2 px-3 text-right font-medium">筆數</th>
            </tr></thead><tbody>
              {Array.from(summary.entries()).map(([pid,d],i)=>(<tr key={pid} className="border-b border-gray-50">
                <td className="py-2 px-3 text-gray-400 text-xs">{i+1}</td><td className="py-2 px-3 font-medium">{d.name}</td>
                <td className="py-2 px-3 text-right">{d.totalQty.toFixed(1)}</td>
                <td className="py-2 px-3 text-right font-bold text-primary">${Math.round(d.totalAmount).toLocaleString()}</td>
                <td className="py-2 px-3 text-right text-gray-400">{d.count}</td>
              </tr>))}
            </tbody><tfoot><tr className="bg-gray-50 font-bold border-t border-gray-200">
              <td colSpan={2} className="py-2 px-3 text-right">合計</td>
              <td className="py-2 px-3 text-right">{Array.from(summary.values()).reduce((s,d)=>s+d.totalQty,0).toFixed(1)}</td>
              <td className="py-2 px-3 text-right text-primary">${Math.round(Array.from(summary.values()).reduce((s,d)=>s+d.totalAmount,0)).toLocaleString()}</td>
              <td className="py-2 px-3 text-right">{lines.length}</td>
            </tr></tfoot></table>
          </div>
        )}
      </div>
    </div>
  );
}
'''

def stock() -> str:
    """庫存總表 — 移除可銷售/啟用，改為顯示庫存數量"""
    return r'''import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../data/DataProvider';
const Arrow = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>;
const BoxIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>;
export default function StockPage() {
  const nav = useNavigate();
  const { products, productProducts, stockQuants, loading } = useData();
  const stockMap = useMemo(() => {
    // variant_id -> template_id 映射
    const vtMap: Record<string, string> = {};
    for (const v of productProducts) { if (v.product_tmpl_id) vtMap[v.id] = v.product_tmpl_id; }
    const sm: Record<string, number> = {};
    for (const q of stockQuants) {
      if (!q.product_id) continue;
      const tmplId = vtMap[q.product_id] || q.product_id;
      sm[tmplId] = (sm[tmplId] || 0) + Number(q.quantity || 0);
    }
    return sm;
  }, [productProducts, stockQuants]);
  if(loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><p className="text-gray-400">載入中...</p></div>;
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-3">
        <button onClick={()=>nav('/')} className="text-gray-400 hover:text-gray-600 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"><Arrow/></button>
        <div><h1 className="text-xl font-bold text-gray-900">庫存總表</h1><p className="text-sm text-gray-400">{products.length} 個商品</p></div>
      </header>
      <div className="p-6 max-w-5xl mx-auto">
        {products.length===0?(
          <div className="text-center py-12 space-y-3"><BoxIcon /><p className="text-gray-500 font-medium">尚無商品紀錄</p><p className="text-sm text-gray-400">商品匯入後將顯示在此</p></div>
        ):(
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <table className="w-full text-sm"><thead><tr className="bg-gray-50 border-b border-gray-100 text-gray-500">
              <th className="py-3 px-4 text-left font-medium">#</th>
              <th className="py-3 px-4 text-left font-medium">編號</th>
              <th className="py-3 px-4 text-left font-medium">品名</th>
              <th className="py-3 px-4 text-right font-medium">進貨價</th>
              <th className="py-3 px-4 text-right font-medium">售價</th>
              <th className="py-3 px-4 text-right font-medium">庫存數量</th>
            </tr></thead><tbody>
              {products.map((p,i)=>{
                const qty = stockMap[p.id] || 0;
                return (<tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="py-2.5 px-4 text-gray-400">{i+1}</td>
                <td className="py-2.5 px-4 font-mono text-xs text-gray-400">{p.default_code||'—'}</td>
                <td className="py-2.5 px-4 font-medium">{p.name}</td>
                <td className="py-2.5 px-4 text-right">{Number(p.standard_price||0)>0 ? `$${Number(p.standard_price).toLocaleString()}` : '—'}</td>
                <td className="py-2.5 px-4 text-right font-bold text-primary">{Number(p.list_price||0)>0 ? `$${Number(p.list_price).toLocaleString()}` : '—'}</td>
                <td className="py-2.5 px-4 text-right"><span className={`font-bold ${qty > 0 ? 'text-green-600' : 'text-gray-400'}`}>{qty > 0 ? qty.toFixed(1) : '0'}</span></td>
              </tr>);
              })}
            </tbody></table>
          </div>
        )}
      </div>
    </div>
  );
}
'''

def sales_orders() -> str:
    return r'''import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as db from '../../db';
import ConfirmDialog from '../../components/ConfirmDialog';
const Arrow = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>;
const RefreshIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>;
const SearchIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>;
const EmptySearchIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>;
const NoteIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z"/></svg>;
const ST: Record<string,{label:string;color:string;bg:string}> = {
  draft:{label:'草稿',color:'#92400e',bg:'#fef3c7'},sent:{label:'已送出',color:'#1e40af',bg:'#dbeafe'},
  sale:{label:'已確認',color:'#065f46',bg:'#d1fae5'},done:{label:'完成',color:'#374151',bg:'#f3f4f6'},
  cancel:{label:'已取消',color:'#991b1b',bg:'#fee2e2'},
};
export default function SalesOrdersPage() {
  const nav = useNavigate();
  const [orders,setOrders]=useState<any[]>([]); const [custs,setCusts]=useState<Record<string,any>>({});
  const [lines,setLines]=useState<any[]>([]); const [loading,setLoading]=useState(true);
  const [search,setSearch]=useState(''); const [filter,setFilter]=useState('all');
  const [expanded,setExpanded]=useState<string|null>(null);
  const [confirm,setConfirm]=useState<{id:string;action:string}|null>(null);
  const load=()=>{setLoading(true);Promise.all([db.query('sale_orders'),db.query('customers'),db.query('sale_order_lines')])
  .then(([o,c,l])=>{
    const ol=Array.isArray(o)?o:[]; ol.sort((a:any,b:any)=>new Date(b.date_order||b.created_at||0).getTime()-new Date(a.date_order||a.created_at||0).getTime());
    setOrders(ol); const cm:any={}; for(const x of (Array.isArray(c)?c:[])) cm[x.id]=x; setCusts(cm); setLines(Array.isArray(l)?l:[]);
  }).catch(()=>{}).finally(()=>setLoading(false));};
  useEffect(()=>{load();},[]);
  const doAction=async()=>{if(!confirm)return;try{await db.update('sale_orders',confirm.id,{state:confirm.action});setOrders(prev=>prev.map(o=>o.id===confirm.id?{...o,state:confirm.action}:o));}catch(e:any){console.error('失敗:',e.message)}setConfirm(null);};
  const filtered=orders.filter(o=>{if(filter!=='all'&&o.state!==filter)return false;if(search){const s=search.toLowerCase();if(!(custs[o.customer_id]?.name||'').toLowerCase().includes(s)&&!(o.name||'').toLowerCase().includes(s))return false;}return true;});
  const co=confirm?orders.find(o=>o.id===confirm.id):null;
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <button onClick={()=>nav('/')} className="text-gray-400 hover:text-gray-600 w-8 h-8 flex items-center justify-center rounded-lg bg-transparent hover:bg-gray-100 transition-colors border-none"><Arrow/></button>
          <div><h1 className="text-xl font-bold text-gray-900">銷貨單管理</h1><p className="text-sm text-gray-400">{orders.length} 筆訂單</p></div>
        </div>
        <button onClick={load} className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200 transition-colors flex items-center gap-1.5"><RefreshIcon /> 重新整理</button>
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
      <div className="p-6 max-w-6xl mx-auto">
        {loading?<div className="text-center text-gray-400 py-12">載入中...</div>
        :filtered.length===0?(
          <div className="text-center py-12 space-y-3"><EmptySearchIcon /><p className="text-gray-500 font-medium">沒有符合的訂單</p><p className="text-sm text-gray-400">嘗試調整搜尋條件或篩選</p></div>
        ):<div className="space-y-3">{filtered.map(o=>{const st=ST[o.state]||ST.draft;const cust=custs[o.customer_id];const ol=lines.filter(l=>l.order_id===o.id);const exp=expanded===o.id;
          return(<div key={o.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div role="button" onClick={()=>setExpanded(exp?null:o.id)} className="w-full px-4 py-4 flex justify-between items-center bg-white hover:bg-gray-50 cursor-pointer">
              <div className="text-left"><p className="font-bold text-gray-900">{o.name||`SO-${(o.id||'').slice(0,8)}`}</p>
              <p className="text-sm text-gray-400">{cust?.name||'—'} · {o.date_order?new Date(o.date_order).toLocaleDateString('zh-TW'):'—'}</p></div>
              <div className="flex items-center gap-3">
                <span style={{color:st.color,background:st.bg,padding:'3px 10px',borderRadius:'20px',fontSize:'12px',fontWeight:600}}>{st.label}</span>
                <span className="font-bold text-gray-900">{o.amount_total!=null?`$${Number(o.amount_total).toLocaleString()}`:'—'}</span>
                <span className="text-gray-400 text-xl">{exp?'▾':'▸'}</span>
              </div>
            </div>
            {exp&&<div className="border-t border-gray-200 px-4 py-3">
              {o.note&&<p className="text-xs text-gray-400 mb-2 bg-gray-50 px-2 py-1 rounded flex items-center gap-1"><NoteIcon /> {o.note}</p>}
              {ol.length===0?<p className="text-sm text-gray-400">此訂單尚無明細行</p>:(
                <table className="w-full text-sm"><thead><tr className="text-gray-400 text-xs border-b border-gray-100">
                  <th className="py-2 text-left">品名</th><th className="py-2 text-right">數量</th><th className="py-2 text-right">單價</th><th className="py-2 text-right">小計</th>
                </tr></thead><tbody>{ol.map(l=>(<tr key={l.id} className="border-b border-gray-50">
                  <td className="py-2 font-medium">{l.name||'—'}</td><td className="py-2 text-right">{Number(l.product_uom_qty||0).toFixed(1)}</td>
                  <td className="py-2 text-right">${Number(l.price_unit||0).toLocaleString()}</td><td className="py-2 text-right font-bold text-primary">${Number(l.price_subtotal||0).toLocaleString()}</td>
                </tr>))}</tbody></table>
              )}
              {o.state==='draft'&&<div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
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

def delivery() -> str:
    return r'''import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import * as db from '../../db';
import { useData } from '../../data/DataProvider';
import ConfirmDialog from '../../components/ConfirmDialog';
const Arrow = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>;
const TruckIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg>;
const CheckCircleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>;
const MapPinIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>;
const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z"/></svg>;
const SaveIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/><path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7"/><path d="M7 3v4a1 1 0 0 0 1 1h7"/></svg>;
const UserIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const stCfg: Record<string,{label:string;color:string}> = {sale:{label:'待出貨',color:'bg-orange-100 text-orange-700'},done:{label:'已完成',color:'bg-green-100 text-green-700'}};
export default function DeliveryPage() {
  const nav = useNavigate();
  const { orders: allOrders, customers, orderLines: lines, employees, loading, refresh } = useData();
  const [orders, setOrders] = useState<any[]>([]);
  const [localCusts, setLocalCusts] = useState<Record<string,any>>({});
  const [expanded, setExpanded] = useState<string|null>(null);
  const [confirm, setConfirm] = useState<{id:string;action:string}|null>(null);
  const [editingAddr, setEditingAddr] = useState<string|null>(null);
  const [addrDraft, setAddrDraft] = useState('');
  const [savingAddr, setSavingAddr] = useState(false);
  const [driverFilter, setDriverFilter] = useState('all');
  const [savingDriver, setSavingDriver] = useState<string|null>(null);

  // #6 empMap 用 useMemo 避免每次 render 重建
  const empMap = useMemo(() => Object.fromEntries(employees.map(e=>[e.id, e])), [employees]);

  // #1 用 useEffect 同步 allOrders → 本地 state（修復 render body setState 無限迴圈）
  useEffect(() => {
    if (!loading && allOrders.length > 0) {
      setOrders(allOrders.filter((x:any)=>['sale','done'].includes(x.state)));
    }
  }, [allOrders, loading]);

  // #3 同步全域 customers → 本地 custs（用於地址寫入後更新 UI）
  const custs = useMemo(() => ({...customers, ...localCusts}), [customers, localCusts]);

  const doAction=async()=>{if(!confirm)return;try{await db.update('sale_orders',confirm.id,{state:confirm.action});setOrders(prev=>prev.map(o=>o.id===confirm.id?{...o,state:confirm.action}:o));}catch(e:any){console.error('失敗:',e.message)}setConfirm(null);};

  // 地址 — #3 修復：用 setLocalCusts 取代不存在的 setCusts
  const saveAddress=async(cid:string)=>{
    setSavingAddr(true);
    try{ await db.update('customers',cid,{contact_address:addrDraft}); setLocalCusts(prev=>({...prev,[cid]:{...(customers[cid]||prev[cid]||{}),contact_address:addrDraft}})); setEditingAddr(null); }
    catch(e:any){console.error('地址儲存失敗:',e.message)} setSavingAddr(false);
  };
  const startEditAddr=(cid:string)=>{ setEditingAddr(cid); setAddrDraft(custs[cid]?.contact_address||''); };

  // 配送負責人（存員工 ID 到 client_order_ref）
  const assignDriver=async(oid:string,empId:string)=>{
    setSavingDriver(oid);
    try{
      await db.update('sale_orders',oid,{client_order_ref:empId||null});
      setOrders(prev=>prev.map(o=>o.id===oid?{...o,client_order_ref:empId||null}:o));
    }catch(e:any){console.error('指派失敗:',e.message)} setSavingDriver(null);
  };

  // 過濾
  const filteredOrders=driverFilter==='all'?orders:driverFilter==='unassigned'?orders.filter(o=>!o.client_order_ref):orders.filter(o=>o.client_order_ref===driverFilter);
  const assignedEmpIds=[...new Set(orders.map(o=>o.client_order_ref).filter(Boolean))];

  const custGroups=new Map<string,any[]>();
  for(const o of filteredOrders){const l=custGroups.get(o.customer_id)||[];l.push(o);custGroups.set(o.customer_id,l);}
  const co=confirm?orders.find(o=>o.id===confirm.id):null;

  // 統計（按員工 ID）
  const driverStats=new Map<string,number>();
  for(const o of orders){const d=o.client_order_ref||'_unassigned';driverStats.set(d,(driverStats.get(d)||0)+1);}

  if(loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><p className="text-gray-400">載入中...</p></div>;
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <button onClick={()=>nav('/')} className="text-gray-400 hover:text-gray-600 w-8 h-8 flex items-center justify-center rounded-lg bg-transparent hover:bg-gray-100 transition-colors border-none"><Arrow/></button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">配送管理</h1>
            <p className="text-sm text-gray-400">{filteredOrders.length} 筆訂單{driverFilter!=='all'?` · ${driverFilter==='unassigned'?'未指派':empMap[driverFilter]?.name||driverFilter}`:''}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <UserIcon />
          <select className="px-3 pr-8 py-2 border border-gray-200 rounded-lg bg-white text-sm" value={driverFilter} onChange={e=>setDriverFilter(e.target.value)}>
            <option value="all">全部負責人 ({orders.length})</option>
            <option value="unassigned">未指派 ({driverStats.get('_unassigned')||0})</option>
            {assignedEmpIds.map(eid=>{const emp=empMap[eid]; return(<option key={eid} value={eid}>{emp?.name||eid} ({driverStats.get(eid)||0})</option>);})}
          </select>
        </div>
      </header>

      {/* 負責人摘要卡片 */}
      {assignedEmpIds.length>0 && driverFilter==='all' && (
        <div className="px-6 pt-4 flex gap-2 flex-wrap">
          <button onClick={()=>setDriverFilter('unassigned')}
            className="px-3 py-1.5 bg-white border border-gray-200 rounded-full text-xs font-medium hover:bg-gray-50 transition-colors flex items-center gap-1.5">
            <UserIcon /><span>未指派</span><span className="bg-gray-100 px-1.5 py-0.5 rounded-full text-gray-500">{driverStats.get('_unassigned')||0}</span>
          </button>
          {assignedEmpIds.map(eid=>{const emp=empMap[eid]; return(
            <button key={eid} onClick={()=>setDriverFilter(eid)}
              className="px-3 py-1.5 bg-white border border-blue-200 rounded-full text-xs font-medium hover:bg-blue-50 transition-colors flex items-center gap-1.5 text-blue-700">
              <UserIcon /><span>{emp?.name||eid}</span>{emp?.job_title&&<span className="text-blue-400">({emp.job_title})</span>}<span className="bg-blue-50 px-1.5 py-0.5 rounded-full">{driverStats.get(eid)||0}</span>
            </button>
          );})}
        </div>
      )}

      <div className="p-6 max-w-5xl mx-auto">
        {custGroups.size===0?(
          <div className="text-center py-12 space-y-3"><TruckIcon /><p className="text-gray-500 font-medium">尚無待配送訂單</p><p className="text-sm text-gray-400">確認銷貨單後訂單將出現在此</p></div>
        ):(
          <div className="space-y-3">{Array.from(custGroups.entries()).map(([cid,cos])=>{
            const cust=custs[cid]; const exp=expanded===cid;
            const addr=cust?.contact_address;
            const isEditingThis=editingAddr===cid;
            return(<div key={cid} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div role="button" onClick={()=>setExpanded(exp?null:cid)} className="w-full px-4 py-4 flex justify-between items-center bg-white hover:bg-gray-50 cursor-pointer">
                <div className="text-left">
                  <p className="font-bold text-gray-900">{cust?.name||cid}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <MapPinIcon />
                    <p className="text-xs text-gray-400">{addr || '地址未設定'}</p>
                  </div>
                  <p className="text-sm text-gray-400 mt-0.5">{cos.length} 筆</p>
                </div>
                <span className="text-gray-400 text-xl">{exp?'▾':'▸'}</span>
              </div>
              {exp&&<div className="border-t border-gray-100">
                {/* 地址區塊 */}
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                  {isEditingThis ? (
                    <div className="flex gap-2 items-center">
                      <MapPinIcon />
                      <input type="text" value={addrDraft} onChange={e=>setAddrDraft(e.target.value)} placeholder="請輸入送貨地址..."
                        className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm" autoFocus
                        onKeyDown={e=>{if(e.key==='Enter')saveAddress(cid);if(e.key==='Escape')setEditingAddr(null);}} />
                      <button onClick={()=>saveAddress(cid)} disabled={savingAddr}
                        className="px-3 py-1 bg-primary text-white rounded text-xs hover:bg-green-700 transition-colors flex items-center gap-1">
                        <SaveIcon /> {savingAddr?'儲存中...':'儲存'}
                      </button>
                      <button onClick={()=>setEditingAddr(null)} className="px-2 py-1 bg-gray-200 text-gray-600 rounded text-xs hover:bg-gray-300 transition-colors">取消</button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <MapPinIcon />
                      <span className={`text-sm ${addr ? 'text-gray-700' : 'text-gray-400'}`}>{addr || '地址未設定'}</span>
                      <button onClick={e=>{e.stopPropagation();startEditAddr(cid);}}
                        className="px-2 py-0.5 bg-gray-200 text-gray-600 rounded text-xs hover:bg-gray-300 transition-colors flex items-center gap-1">
                        <EditIcon /> {addr ? '編輯' : '設定地址'}
                      </button>
                    </div>
                  )}
                </div>
                {/* 訂單列表 */}
                {cos.map(o=>{const cfg=stCfg[o.state]||stCfg.sale;const ol=lines.filter(l=>l.order_id===o.id);
                  const driverEmpId=o.client_order_ref;
                  const driverEmp=driverEmpId?empMap[driverEmpId]:null;
                  const isSavingThis=savingDriver===o.id;
                  return(<div key={o.id} className="border-t border-gray-200">
                    <div className="px-4 py-3 flex justify-between items-center">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{o.name||o.id}</p>
                        <p className="text-xs text-gray-400">{ol.length} 品項</p>
                        {/* 配送負責人下拉 */}
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <UserIcon />
                          <select value={driverEmpId||''} onChange={e=>assignDriver(o.id,e.target.value)} disabled={isSavingThis}
                            className={`text-xs px-2 pr-8 py-1 border rounded transition-colors ${driverEmp ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white text-gray-400'}`}>
                            <option value="">-- 選擇負責人 --</option>
                            {employees.map(emp=>(<option key={emp.id} value={emp.id}>{emp.name}{emp.job_title?` (${emp.job_title})`:''}</option>))}
                          </select>
                          {isSavingThis && <span className="text-xs text-gray-400">儲存中...</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
                        {o.state==='sale'&&<button onClick={()=>setConfirm({id:o.id,action:'done'})} className="px-3 py-1 bg-primary text-white rounded text-xs hover:bg-green-700 transition-colors flex items-center gap-1"><CheckCircleIcon /> 完成配送</button>}
                      </div>
                    </div>
                    <div className="px-4 py-2"><div className="flex flex-wrap gap-1.5">
                      {ol.map((l:any)=>(<span key={l.id} className="px-2 py-0.5 bg-gray-50 rounded text-xs text-gray-500">{l.name} x{Number(l.product_uom_qty||0).toFixed(1)}</span>))}
                    </div></div>
                  </div>);
                })}
              </div>}
            </div>);
          })}</div>
        )}
      </div>
      <ConfirmDialog open={!!confirm} title={`確認完成配送 ${co?.name||''}？`}
        message="標記為已完成後無法復原。" confirmText="確認完成" variant="info"
        onConfirm={doAction} onCancel={()=>setConfirm(null)} />
    </div>
  );
}
'''


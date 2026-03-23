/**
 * 採購加總數量表 — 列印版面
 * 全品項彙總（跨供應商跨客戶）
 */
import type { Order } from '../store/useStore'
import { products, suppliers } from '../data/mockData'

interface Props {
  orders: Order[]
}

export default function PurchaseListPrint({ orders }: Props) {
  const draftOrders = orders.filter(o => o.state === 'draft')

  // 按品項彙總
  const summary = new Map<string, { name: string; totalQty: number; unit: string; supplier: string; customerCount: number }>()
  for (const order of draftOrders) {
    for (const line of order.lines) {
      const p = products.find(pp => pp.id === line.productId)!
      const existing = summary.get(line.productId) || {
        name: p.name, totalQty: 0, unit: p.unit,
        supplier: suppliers.find(s => s.id === p.supplierId)?.name || '-',
        customerCount: 0,
      }
      existing.totalQty = Math.round((existing.totalQty + line.qty) * 100) / 100
      existing.customerCount++
      summary.set(line.productId, existing)
    }
  }

  const items = Array.from(summary.values())

  return (
    <div>
      <div className="print-header">
        <h1>雄泉鮮食企業股份有限公司</h1>
        <p>採購加總數量表</p>
      </div>
      <div className="print-meta">
        <div>日期: {new Date().toISOString().slice(0, 10)}</div>
        <div>品項數: {items.length} | 訂單數: {draftOrders.length}</div>
      </div>
      <table className="print-table">
        <thead>
          <tr>
            <th style={{ width: '5%' }}>#</th>
            <th style={{ width: '30%' }}>品名規格</th>
            <th style={{ width: '15%', textAlign: 'right' }}>需求總量</th>
            <th style={{ width: '10%' }}>單位</th>
            <th style={{ width: '10%', textAlign: 'right' }}>客戶數</th>
            <th style={{ width: '20%' }}>供應商</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr key={i}>
              <td>{i + 1}</td>
              <td>{item.name}</td>
              <td className="num bold">{item.totalQty.toFixed(2)}</td>
              <td>{item.unit}</td>
              <td className="num">{item.customerCount}</td>
              <td>{item.supplier}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="print-footer">
        <div>列印時間: {new Date().toLocaleString('zh-TW')}</div>
      </div>
    </div>
  )
}

/**
 * 供應商採購單 — 列印版面
 * 每個供應商一張，含供應商聯絡資訊、產品編號、客戶×品項拆行明細、合計
 */
import type { Order } from '../store/useStore'
import { products, suppliers, customers } from '../data/mockData'

interface Props {
  /** 按供應商 ID 分群的訂單 */
  supplierIds: string[]
  orders: Order[]
}

export default function PurchaseOrderPrint({ supplierIds, orders }: Props) {
  const draftOrders = orders.filter(o => o.state === 'draft')

  return (
    <>
      {supplierIds.map((suppId, idx) => {
        const sup = suppliers.find(s => s.id === suppId)
        // 收集該供應商的品項明細（按客戶×品項拆行）
        const lines: { customer: string; productCode: string; productName: string; qty: number; unit: string; note: string }[] = []
        for (const order of draftOrders) {
          const cust = customers.find(c => c.id === order.customerId)
          for (const line of order.lines) {
            const p = products.find(pp => pp.id === line.productId)
            if (p && p.supplierId === suppId) {
              lines.push({
                customer: cust ? `${cust.ref} ${cust.name}` : order.customerId,
                productCode: p.defaultCode,
                productName: p.name,
                qty: line.qty,
                unit: p.unit,
                note: line.note,
              })
            }
          }
        }
        if (lines.length === 0) return null

        // 按品項加總
        const totals = new Map<string, number>()
        for (const l of lines) {
          totals.set(l.productName, (totals.get(l.productName) || 0) + l.qty)
        }
        const totalQty = lines.reduce((sum, l) => sum + l.qty, 0)

        return (
          <div key={suppId} className={idx > 0 ? 'print-page-break' : ''}>
            <div className="print-header">
              <h1>雄泉鮮食企業股份有限公司</h1>
              <p>供應商採購單</p>
            </div>
            <div className="print-meta">
              <div>
                <div>供應商: <strong>{sup?.ref} {sup?.name}</strong></div>
                <div>統一編號: {sup?.vat || '-'}</div>
                <div>地址: {sup?.address || '-'}</div>
                <div>電話: {sup?.phone || '-'}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div>日期: {new Date().toISOString().slice(0, 10)}</div>
                <div>品項數: {totals.size}</div>
                <div>明細行: {lines.length}</div>
              </div>
            </div>
            <table className="print-table">
              <thead>
                <tr>
                  <th style={{ width: '4%' }}>#</th>
                  <th style={{ width: '20%' }}>客戶</th>
                  <th style={{ width: '8%' }}>編號</th>
                  <th style={{ width: '28%' }}>品名規格</th>
                  <th style={{ width: '10%', textAlign: 'right' }}>數量</th>
                  <th style={{ width: '8%' }}>單位</th>
                  <th style={{ width: '22%' }}>備註</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((l, i) => (
                  <tr key={i}>
                    <td>{i + 1}</td>
                    <td>{l.customer}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: '9pt' }}>{l.productCode}</td>
                    <td>{l.productName}</td>
                    <td className="num">{l.qty.toFixed(2)}</td>
                    <td>{l.unit}</td>
                    <td>{l.note || ''}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ fontWeight: 'bold', borderTop: '2px solid #333' }}>
                  <td colSpan={4} style={{ textAlign: 'right' }}>合計</td>
                  <td className="num">{totalQty.toFixed(2)}</td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
            <div style={{ marginTop: '12pt', fontSize: '10pt' }}>
              <strong>品項加總：</strong>
              {Array.from(totals.entries()).map(([name, qty]) => `${name} ${qty.toFixed(2)}`).join('、')}
            </div>
            <div className="print-footer">
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>採購人員:________</span>
                <span>列印時間: {new Date().toLocaleString('zh-TW')}</span>
              </div>
            </div>
          </div>
        )
      })}
    </>
  )
}

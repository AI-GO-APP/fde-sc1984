/**
 * 客戶銷貨憑單 — 列印版面
 * 正式格式：公司抬頭、客戶統編、產品編號、行號、品項、單價、金額、合計/稅金/總計
 */
import type { Order, StockItem } from '../store/useStore'
import { customers, products } from '../data/mockData'

interface Props {
  orders: Order[]
  stockItems: StockItem[]
}

export default function SalesInvoicePrint({ orders, stockItems }: Props) {
  const getPrice = (productId: string) => stockItems.find(s => s.productId === productId)?.sellingPrice || 0

  return (
    <>
      {orders.map((order, idx) => {
        const cust = customers.find(c => c.id === order.customerId)
        const total = order.lines.reduce((sum, l) => sum + l.allocatedQty * getPrice(l.productId), 0)
        const totalQty = order.lines.reduce((sum, l) => sum + l.allocatedQty, 0)

        return (
          <div key={order.id} className={idx > 0 ? 'print-page-break' : ''}>
            <div className="print-header">
              <h1>雄泉鮮食企業股份有限公司</h1>
              <p>銷 貨 憑 單</p>
            </div>
            <div className="print-meta">
              <div>
                <div>銷貨日期: <strong>{order.date}</strong></div>
                <div>客戶名稱: <strong>{cust?.ref} {cust?.name}</strong></div>
                <div>統一編號: {cust?.vat || '-'}</div>
                <div>送貨地址: {cust?.address}</div>
                <div>聯絡人: {cust?.contactPerson || '-'}　電話: {cust?.phone}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div>銷貨單號: <strong>{order.id}</strong></div>
                <div>課稅類別: 免稅</div>
                <div style={{ marginTop: '4pt', color: '#999', fontSize: '9pt' }}>
                  第 {idx + 1} 頁 / 共 {orders.length} 頁
                </div>
              </div>
            </div>
            <table className="print-table">
              <thead>
                <tr>
                  <th style={{ width: '4%' }}>#</th>
                  <th style={{ width: '10%' }}>編號</th>
                  <th style={{ width: '24%' }}>品名規格</th>
                  <th style={{ width: '10%', textAlign: 'right' }}>數量</th>
                  <th style={{ width: '7%' }}>單位</th>
                  <th style={{ width: '11%', textAlign: 'right' }}>單價</th>
                  <th style={{ width: '14%', textAlign: 'right' }}>金額</th>
                  <th style={{ width: '20%' }}>備註</th>
                </tr>
              </thead>
              <tbody>
                {order.lines.map((line, i) => {
                  const price = getPrice(line.productId)
                  const amount = Math.round(line.allocatedQty * price)
                  const prod = products.find(pp => pp.id === line.productId)
                  return (
                    <tr key={i}>
                      <td>{i + 1}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: '9pt' }}>{prod?.defaultCode}</td>
                      <td>{line.productName}</td>
                      <td className="num">{line.allocatedQty.toFixed(2)}</td>
                      <td>{line.unit}</td>
                      <td className="num">{price > 0 ? price.toFixed(1) : '-'}</td>
                      <td className="num bold">{price > 0 ? `$${amount.toLocaleString()}` : '-'}</td>
                      <td>{line.note || ''}</td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr style={{ fontWeight: 'bold', borderTop: '2px solid #333' }}>
                  <td colSpan={3} style={{ textAlign: 'right' }}>合計</td>
                  <td className="num">{totalQty.toFixed(2)}</td>
                  <td></td>
                  <td></td>
                  <td className="num">${Math.round(total).toLocaleString()}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
            <div style={{ textAlign: 'right', marginTop: '8pt', fontSize: '11pt' }}>
              <div>未稅合計: <strong>${Math.round(total).toLocaleString()}</strong></div>
              <div style={{ color: '#666' }}>稅金: $0</div>
              <div style={{ fontSize: '14pt', marginTop: '4pt' }}>
                總計: <strong>${Math.round(total).toLocaleString()}</strong>
              </div>
            </div>
            {order.note && (
              <div style={{ marginTop: '8pt', fontSize: '9pt', color: '#666' }}>
                📝 {order.note}
              </div>
            )}
            <div className="print-footer">
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>製單:________　覆核:________</span>
                <span>列印時間: {new Date().toLocaleString('zh-TW')}</span>
              </div>
            </div>
          </div>
        )
      })}
    </>
  )
}

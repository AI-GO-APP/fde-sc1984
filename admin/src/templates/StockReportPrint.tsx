/**
 * 庫存總表 — 列印版面
 */
import type { StockItem } from '../store/useStore'

interface Props {
  stockItems: StockItem[]
}

export default function StockReportPrint({ stockItems }: Props) {
  const totalCost = stockItems.reduce((sum, s) => sum + s.purchasePrice * s.qty, 0)
  const totalRevenue = stockItems.reduce((sum, s) => sum + s.sellingPrice * s.qty, 0)

  return (
    <div>
      <div className="print-header">
        <h1>雄泉鮮食企業股份有限公司</h1>
        <p>今日庫存總表</p>
      </div>
      <div className="print-meta">
        <div>日期: {new Date().toISOString().slice(0, 10)}</div>
        <div>品項數: {stockItems.length}</div>
      </div>
      <table className="print-table">
        <thead>
          <tr>
            <th style={{ width: '5%' }}>#</th>
            <th style={{ width: '22%' }}>品名</th>
            <th style={{ width: '10%', textAlign: 'right' }}>數量</th>
            <th style={{ width: '8%' }}>單位</th>
            <th style={{ width: '10%', textAlign: 'right' }}>進貨價</th>
            <th style={{ width: '10%', textAlign: 'right' }}>售價</th>
            <th style={{ width: '12%', textAlign: 'right' }}>進貨成本</th>
            <th style={{ width: '12%', textAlign: 'right' }}>預計營收</th>
            <th style={{ width: '11%', textAlign: 'right' }}>預計毛利</th>
          </tr>
        </thead>
        <tbody>
          {stockItems.map((item, i) => {
            const cost = Math.round(item.purchasePrice * item.qty)
            const revenue = Math.round(item.sellingPrice * item.qty)
            const profit = revenue - cost
            return (
              <tr key={item.productId}>
                <td>{i + 1}</td>
                <td>{item.productName}</td>
                <td className="num">{item.qty.toFixed(2)}</td>
                <td>{item.unit}</td>
                <td className="num">${item.purchasePrice}</td>
                <td className="num">${item.sellingPrice}</td>
                <td className="num">${cost.toLocaleString()}</td>
                <td className="num">${revenue.toLocaleString()}</td>
                <td className="num bold">${profit.toLocaleString()}</td>
              </tr>
            )
          })}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={6} style={{ textAlign: 'right', fontWeight: 'bold' }}>合計</td>
            <td className="num bold">${Math.round(totalCost).toLocaleString()}</td>
            <td className="num bold">${Math.round(totalRevenue).toLocaleString()}</td>
            <td className="num bold">${Math.round(totalRevenue - totalCost).toLocaleString()}</td>
          </tr>
        </tfoot>
      </table>
      <div className="print-footer">
        <div>列印時間: {new Date().toLocaleString('zh-TW')}</div>
      </div>
    </div>
  )
}

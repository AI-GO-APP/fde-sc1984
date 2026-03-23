/**
 * PrintProvider — 列印邏輯封裝
 * 
 * 使用方式:
 *   <PrintProvider content={<SalesInvoicePrint orders={selected} />}>
 *     {(handlePrint) => <button onClick={handlePrint}>列印</button>}
 *   </PrintProvider>
 * 
 * 或使用 hook:
 *   const { print } = usePrint()
 *   print(<SalesInvoicePrint orders={selected} />)
 */
import { useCallback, useRef } from 'react'
import type { ReactNode } from 'react'

// 確保 print-root 存在
function ensurePrintRoot(): HTMLDivElement {
  let root = document.getElementById('print-root') as HTMLDivElement
  if (!root) {
    root = document.createElement('div')
    root.id = 'print-root'
    document.body.appendChild(root)
  }
  return root
}

/**
 * 觸發列印：將 ReactNode 渲染到 #print-root，呼叫 window.print()
 */
export function triggerPrint(contentElement: HTMLElement | null) {
  if (!contentElement) return
  const root = ensurePrintRoot()
  // 複製內容到列印容器
  root.innerHTML = contentElement.innerHTML
  // 延遲一拍等瀏覽器渲染完成
  requestAnimationFrame(() => {
    window.print()
    // 列印完成後清空
    setTimeout(() => { root.innerHTML = '' }, 500)
  })
}

/**
 * PrintArea — 包裹列印內容（螢幕上隱藏）
 */
export function PrintArea({ children, printRef }: { children: ReactNode; printRef: React.RefObject<HTMLDivElement | null> }) {
  return (
    <div ref={printRef} style={{ display: 'none' }}>
      {children}
    </div>
  )
}

/**
 * usePrint — React Hook
 */
export function usePrint() {
  const contentRef = useRef<HTMLDivElement>(null)

  const print = useCallback(() => {
    triggerPrint(contentRef.current)
  }, [])

  return { contentRef, print }
}

/**
 * 直接列印 — 傳入 HTML string
 */
export function printHTML(html: string) {
  const root = ensurePrintRoot()
  root.innerHTML = html
  requestAnimationFrame(() => {
    window.print()
    setTimeout(() => { root.innerHTML = '' }, 500)
  })
}

/**
 * 確認 Dialog — 共用元件
 * 支援 loading 狀態（spinner + 禁用按鈕）
 */
import { useEffect, useRef } from 'react'

interface Props {
  open: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'info'
  showIrreversibleWarning?: boolean
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog({
  open, title, message,
  confirmText = '確認',
  cancelText = '取消',
  variant = 'warning',
  showIrreversibleWarning = false,
  loading = false,
  onConfirm, onCancel,
}: Props) {
  const dialogRef = useRef<HTMLDivElement>(null)

  // ESC 關閉（loading 時禁用）
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape' && open && !loading) onCancel() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onCancel, loading])

  if (!open) return null

  const variantStyles = {
    danger: { icon: '⚠️', btnClass: 'bg-red-600 hover:bg-red-700', ringClass: 'ring-red-100' },
    warning: { icon: '⚠️', btnClass: 'bg-orange-600 hover:bg-orange-700', ringClass: 'ring-orange-100' },
    info: { icon: 'ℹ️', btnClass: 'bg-primary hover:bg-green-700', ringClass: 'ring-green-100' },
  }
  const v = variantStyles[variant]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" onClick={loading ? undefined : onCancel}>
      {/* 遮罩 */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      {/* 對話框 */}
      <div
        ref={dialogRef}
        onClick={(e) => e.stopPropagation()}
        className={`relative bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 ring-4 ${v.ringClass} animate-[dialogIn_0.2s_ease-out]`}
      >
        <div className="text-center space-y-3">
          {loading ? (
            /* Loading spinner */
            <div className="inline-flex items-center justify-center w-12 h-12">
              <svg className="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
          ) : (
            <span className="text-4xl">{v.icon}</span>
          )}
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-500 leading-relaxed">{message}</p>
          {showIrreversibleWarning && (
            <p className="text-xs text-red-500 font-medium bg-red-50 rounded-lg px-3 py-1.5">
              ⚠️ 此操作無法復原
            </p>
          )}
        </div>
        <div className="flex gap-3 mt-5">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 py-2.5 bg-gray-100 text-gray-600 rounded-xl font-medium hover:bg-gray-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 py-2.5 text-white rounded-xl font-bold transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${v.btnClass}`}
          >
            {loading ? '處理中...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

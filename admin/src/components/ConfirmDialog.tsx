/**
 * 確認 Dialog — 共用元件
 * 所有不可逆操作前必須跳出此對話框
 */
import { useEffect, useRef } from 'react'

interface Props {
  open: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'info'
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog({
  open, title, message,
  confirmText = '確認',
  cancelText = '取消',
  variant = 'warning',
  onConfirm, onCancel,
}: Props) {
  const dialogRef = useRef<HTMLDivElement>(null)

  // ESC 關閉
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape' && open) onCancel() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onCancel])

  if (!open) return null

  const variantStyles = {
    danger: { icon: '⚠️', btnClass: 'bg-red-600 hover:bg-red-700', ringClass: 'ring-red-100' },
    warning: { icon: '⚠️', btnClass: 'bg-orange-600 hover:bg-orange-700', ringClass: 'ring-orange-100' },
    info: { icon: 'ℹ️', btnClass: 'bg-primary hover:bg-green-700', ringClass: 'ring-green-100' },
  }
  const v = variantStyles[variant]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" onClick={onCancel}>
      {/* 遮罩 */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      {/* 對話框 */}
      <div
        ref={dialogRef}
        onClick={(e) => e.stopPropagation()}
        className={`relative bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 ring-4 ${v.ringClass} animate-[dialogIn_0.2s_ease-out]`}
      >
        <div className="text-center space-y-3">
          <span className="text-4xl">{v.icon}</span>
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-500 leading-relaxed">{message}</p>
          <p className="text-xs text-red-500 font-medium bg-red-50 rounded-lg px-3 py-1.5">
            ⚠️ 此操作無法復原
          </p>
        </div>
        <div className="flex gap-3 mt-5">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 bg-gray-100 text-gray-600 rounded-xl font-medium hover:bg-gray-200 transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-2.5 text-white rounded-xl font-bold transition-colors ${v.btnClass}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

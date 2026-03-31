/**
 * Toast 通知容器 — 固定中央上方，支援 success / error / info
 */
import { useUIStore, type Toast } from '../store/useUIStore'

const ICONS: Record<Toast['type'], string> = {
  success: '✅',
  error: '❌',
  info: 'ℹ️',
}

const BG: Record<Toast['type'], string> = {
  success: 'bg-green-600',
  error: 'bg-red-600',
  info: 'bg-blue-600',
}

export default function ToastContainer() {
  const { toasts, removeToast } = useUIStore()

  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[10000] flex flex-col items-center gap-2 pointer-events-none">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`${BG[t.type]} text-white px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 text-sm font-medium pointer-events-auto animate-toast-in min-w-[200px] max-w-[400px]`}
          onClick={() => removeToast(t.id)}
          role="alert"
        >
          <span>{ICONS[t.type]}</span>
          <span className="flex-1">{t.message}</span>
          <button className="opacity-60 hover:opacity-100 ml-1 text-xs">✕</button>
        </div>
      ))}
    </div>
  )
}

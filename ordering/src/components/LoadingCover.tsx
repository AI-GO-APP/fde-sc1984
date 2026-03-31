/**
 * 全景 Loading Cover — 半透明遮罩 + 中央 Spinner
 */
import { useUIStore } from '../store/useUIStore'

export default function LoadingCover() {
  const { loadingVisible, loadingText } = useUIStore()

  if (!loadingVisible) return null

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm"
      style={{ touchAction: 'none' }}
      onClick={e => e.stopPropagation()}
    >
      <div className="bg-white rounded-2xl px-8 py-6 shadow-2xl flex flex-col items-center gap-3 min-w-[180px]">
        {/* Spinner */}
        <div className="w-10 h-10 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-sm font-medium text-gray-700">{loadingText}</p>
      </div>
    </div>
  )
}

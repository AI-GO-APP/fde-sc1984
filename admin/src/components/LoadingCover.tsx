/**
 * 全景 Loading Cover — 半透明遮罩 + 中央 Spinner
 * 
 * 雙來源觸發：
 * 1. useUIStore.loadingVisible — 手動呼叫 (showLoading/hideLoading)
 * 2. useAdminStore.globalLoading — 日期切換或初始載入時自動觸發
 */
import { useUIStore } from '../store/useUIStore'
import { useAdminStore } from '../store/useAdminStore'

export default function LoadingCover() {
  const { loadingVisible, loadingText } = useUIStore()
  const globalLoading = useAdminStore(s => s.globalLoading)

  if (!loadingVisible && !globalLoading) return null

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm"
      style={{ touchAction: 'none' }}
      onClick={e => e.stopPropagation()}
    >
      <div className="bg-white rounded-2xl px-8 py-6 shadow-2xl flex flex-col items-center gap-3 min-w-[180px]">
        {/* Spinner */}
        <div className="w-10 h-10 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-sm font-medium text-gray-700">{loadingText || '載入資料中...'}</p>
      </div>
    </div>
  )
}

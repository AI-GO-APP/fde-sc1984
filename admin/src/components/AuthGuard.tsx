/**
 * Auth Guard — 全站授權守衛
 *
 * 僅允許持有有效 admin_token 的使用者進入受保護頁面。
 * 無 Token 時顯示提示頁面，引導從 AI GO 開啟。
 */
import type { ReactNode } from 'react'
import { getAdminToken, getAdminUser, clearAdminToken } from '../api/auth'

interface Props {
  children: ReactNode
}

export default function AuthGuard({ children }: Props) {
  const token = getAdminToken()
  const user = getAdminUser()

  if (!token) {
    return <UnauthorizedPage />
  }

  return (
    <>
      {/* 頂部使用者資訊列 */}
      {user && (
        <div className="fixed top-0 right-0 z-40 flex items-center gap-2 px-4 py-1.5 text-xs text-gray-500 bg-white/80 backdrop-blur rounded-bl-lg shadow-sm">
          <span>👤 {user.name || user.email}</span>
          <button
            onClick={() => { clearAdminToken(); window.location.reload() }}
            className="text-red-400 hover:text-red-600 transition-colors ml-1"
            title="登出"
          >
            ✕
          </button>
        </div>
      )}
      {children}
    </>
  )
}

/** 未授權提示頁面 */
function UnauthorizedPage() {
  const aigoUrl = import.meta.env.VITE_AIGO_URL || 'https://ai-go.app'

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center space-y-5">
        <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto">
          <span className="text-3xl">🔒</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-800">雄泉鮮食管理系統</h1>
        <p className="text-sm text-gray-500 leading-relaxed">
          此應用僅限從 <strong>AI GO</strong> 平台啟動。<br />
          請回到 AI GO 並點擊「開啟應用」以登入。
        </p>
        <a
          href={aigoUrl}
          className="inline-block w-full py-3 bg-primary text-white rounded-xl font-bold text-lg hover:bg-green-700 transition-colors"
        >
          前往 AI GO →
        </a>
        <p className="text-xs text-gray-400 mt-2">
          若你是開發人員，可使用 E2E 測試的 token 手動寫入 localStorage。
        </p>
      </div>
    </div>
  )
}

/**
 * Auth Callback 頁面
 *
 * 接收 AI GO 重導的 ?code=xxx，向 AI GO 換取 token 並完成登入
 */
import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { exchangeOneTimeCode, setAdminToken, setAdminUser } from '../api/auth'

export default function AuthCallbackPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const code = searchParams.get('code')
    if (!code) {
      setError('缺少 code 參數，請從 AI GO 重新開啟此應用。')
      setLoading(false)
      return
    }

    exchangeOneTimeCode(code)
      .then((result) => {
        // 儲存 token 與使用者資訊
        setAdminToken(result.access_token)
        setAdminUser(result.user)
        // 跳轉至 Dashboard
        navigate('/', { replace: true })
      })
      .catch((err) => {
        console.error('[Auth Callback] Exchange 失敗:', err)
        setError(err.message || '登入失敗，請重試。')
        setLoading(false)
      })
  }, [searchParams, navigate])

  const aigoUrl = import.meta.env.VITE_AIGO_URL || 'https://ai-go.app'

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center space-y-4">
        {loading && !error ? (
          <>
            <div className="animate-spin w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full mx-auto" />
            <h2 className="text-xl font-bold text-gray-800">正在登入...</h2>
            <p className="text-sm text-gray-500">正在與 AI GO 交換憑證，請稍候。</p>
          </>
        ) : (
          <>
            <span className="text-5xl">⚠️</span>
            <h2 className="text-xl font-bold text-red-600">登入失敗</h2>
            <p className="text-sm text-gray-500 leading-relaxed">{error}</p>
            <div className="flex gap-3 mt-4">
              <a
                href={aigoUrl}
                className="flex-1 py-2.5 bg-primary text-white rounded-xl font-bold hover:bg-green-700 transition-colors text-center"
              >
                返回 AI GO
              </a>
              <button
                onClick={() => window.location.reload()}
                className="flex-1 py-2.5 bg-gray-100 text-gray-600 rounded-xl font-medium hover:bg-gray-200 transition-colors"
              >
                重試
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

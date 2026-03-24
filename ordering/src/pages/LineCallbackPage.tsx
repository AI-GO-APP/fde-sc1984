/**
 * LINE Login OAuth Callback Page
 *
 * 處理兩種情境：
 * 1. LINE 用戶有 email → 直接登入 + Customer 同步
 * 2. LINE 用戶無 email → 顯示補填 UI → completeEmail → Customer 同步
 */
import { useEffect, useState, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { verifyState, exchangeLineCode, completeEmail } from '../api/lineAuth'
import { useAuthStore } from '../store/useAuthStore'
import { ensureCustomerForCurrentUser } from '../api/customerSync'

type Status = 'processing' | 'needs_email' | 'error'

export default function LineCallbackPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { setAuth } = useAuthStore()
  const [status, setStatus] = useState<Status>('processing')
  const [errorMsg, setErrorMsg] = useState('')
  const [pendingToken, setPendingToken] = useState('')
  const [lineDisplayName, setLineDisplayName] = useState('')
  const [lineAvatar, setLineAvatar] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const processedRef = useRef(false)

  useEffect(() => {
    // 防止 React StrictMode 導致重複執行
    if (processedRef.current) return
    processedRef.current = true

    async function handleCallback() {
      const code = searchParams.get('code')
      const state = searchParams.get('state')
      const error = searchParams.get('error')
      const errorDescription = searchParams.get('error_description')

      // 處理 LINE 回傳的錯誤
      if (error) {
        setStatus('error')
        setErrorMsg(errorDescription || error || 'LINE 登入被取消')
        return
      }

      // 驗證 state（防 CSRF）
      if (!state || !verifyState(state)) {
        setStatus('error')
        setErrorMsg('驗證失敗，請重新嘗試登入')
        return
      }

      if (!code) {
        setStatus('error')
        setErrorMsg('未收到授權碼')
        return
      }

      try {
        const redirectUri = import.meta.env.VITE_LINE_CALLBACK_URL || `${window.location.origin}/auth/line/callback`
        const result = await exchangeLineCode(code, redirectUri)

        if (result.needs_email) {
          // LINE 用戶未授權 email → 顯示補填表單
          setPendingToken(result.pending_token)
          setLineDisplayName(result.display_name || '')
          setLineAvatar(result.avatar_url || null)
          setStatus('needs_email')
        } else {
          // 有 email → 直接登入
          setAuth(result.access_token, result.refresh_token, result.user, result.expires_in)
          ensureCustomerForCurrentUser()
          navigate('/order', { replace: true })
        }
      } catch (err: unknown) {
        setStatus('error')
        setErrorMsg(err instanceof Error ? err.message : 'LINE 登入失敗')
      }
    }

    handleCallback()
  }, [searchParams, setAuth, navigate])

  // --- Email 補填提交 ---

  function validateEmail(v: string): string {
    if (!v.trim()) return '請輸入 Email'
    if (!v.includes('@') || !v.split('@')[1]?.includes('.')) return 'Email 格式不正確'
    return ''
  }

  async function handleCompleteEmail(e: React.FormEvent) {
    e.preventDefault()
    const err = validateEmail(email)
    if (err) {
      setEmailError(err)
      return
    }
    setEmailError('')
    setSubmitting(true)

    try {
      const result = await completeEmail(pendingToken, email.trim().toLowerCase())
      setAuth(result.access_token, result.refresh_token, result.user, result.expires_in)
      ensureCustomerForCurrentUser()
      navigate('/order', { replace: true })
    } catch (err: unknown) {
      setEmailError(err instanceof Error ? err.message : '補填 Email 失敗')
    } finally {
      setSubmitting(false)
    }
  }

  // --- Render ---

  // 錯誤頁面
  if (status === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-green-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm text-center space-y-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto text-3xl">
            ⚠️
          </div>
          <h2 className="text-xl font-bold text-gray-900">LINE 登入失敗</h2>
          <p className="text-gray-500 text-sm">{errorMsg}</p>
          <button
            onClick={() => navigate('/login', { replace: true })}
            className="w-full py-3 bg-primary text-white rounded-xl font-bold hover:bg-green-700 transition-colors"
          >
            返回登入
          </button>
        </div>
      </div>
    )
  }

  // Email 補填表單
  if (status === 'needs_email') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-green-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm space-y-6">
          {/* LINE 頭像與名稱 */}
          <div className="text-center space-y-3">
            {lineAvatar ? (
              <img
                src={lineAvatar}
                alt={lineDisplayName}
                className="w-16 h-16 rounded-full mx-auto border-2 border-[#06C755]"
              />
            ) : (
              <div className="w-16 h-16 bg-[#06C755] rounded-full flex items-center justify-center mx-auto text-white text-2xl font-bold">
                {lineDisplayName?.[0] || 'L'}
              </div>
            )}
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {lineDisplayName ? `${lineDisplayName}，歡迎！` : '歡迎！'}
              </h2>
              <p className="text-gray-500 text-sm mt-1">
                您的 LINE 帳號未提供 Email，請補填以完成註冊
              </p>
            </div>
          </div>

          {/* Email 表單 */}
          <form onSubmit={handleCompleteEmail} className="space-y-4">
            <div>
              <label htmlFor="complete-email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="complete-email"
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setEmailError('') }}
                placeholder="you@example.com"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#06C755] focus:border-transparent outline-none transition-all"
                autoFocus
                disabled={submitting}
              />
            </div>

            {emailError && (
              <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg">{emailError}</p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-[#06C755] text-white rounded-xl font-bold hover:bg-[#05b04a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? '處理中...' : '完成註冊'}
            </button>
          </form>

          <button
            onClick={() => navigate('/login', { replace: true })}
            className="w-full text-center text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            取消，返回登入
          </button>
        </div>
      </div>
    )
  }

  // 處理中
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-green-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm text-center space-y-4">
        <div className="w-12 h-12 border-4 border-[#06C755] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-gray-500">正在透過 LINE 登入...</p>
      </div>
    </div>
  )
}

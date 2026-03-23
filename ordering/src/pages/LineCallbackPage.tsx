/**
 * LINE Login OAuth Callback Page
 * Handles the redirect from LINE after user authorization
 */
import { useEffect, useState, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { verifyState, exchangeLineCode } from '../api/lineAuth'
import { useAuthStore } from '../store/useAuthStore'

export default function LineCallbackPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { setAuth } = useAuthStore()
  const [status, setStatus] = useState<'processing' | 'error'>('processing')
  const [errorMsg, setErrorMsg] = useState('')
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

      // Handle LINE error response
      if (error) {
        setStatus('error')
        setErrorMsg(errorDescription || error || 'LINE Login was cancelled')
        return
      }

      // Verify state to prevent CSRF
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
        // Exchange the code for app tokens via backend
        const redirectUri = import.meta.env.VITE_LINE_CALLBACK_URL || `${window.location.origin}/auth/line/callback`
        const res = await exchangeLineCode(code, redirectUri)
        setAuth(res.access_token, res.refresh_token, res.user, res.expires_in)
        navigate('/order', { replace: true })
      } catch (err: unknown) {
        setStatus('error')
        setErrorMsg(err instanceof Error ? err.message : 'LINE 登入失敗')
      }
    }

    handleCallback()
  }, [searchParams, setAuth, navigate])

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

  // Processing state
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-green-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm text-center space-y-4">
        <div className="w-12 h-12 border-4 border-[#06C755] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-gray-500">正在透過 LINE 登入...</p>
      </div>
    </div>
  )
}


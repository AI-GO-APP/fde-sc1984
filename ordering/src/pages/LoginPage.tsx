import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { login } from '../api/auth'
import { redirectToLineLogin } from '../api/lineAuth'
import { useAuthStore } from '../store/useAuthStore'

export default function LoginPage() {
  const navigate = useNavigate()
  const { setAuth, isLoggedIn } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // If already logged in, show welcome
  if (isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-green-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm text-center space-y-4">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto text-3xl">
            🥬
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{'\u96C4\u6CC9\u9BAE\u98DF'}</h1>
          <p className="text-gray-400">{'\u6B61\u8FCE\u56DE\u4F86\uFF0C'}{useAuthStore.getState().user?.display_name}</p>
          <button onClick={() => navigate('/order')}
            className="w-full py-3 bg-primary text-white rounded-xl font-bold text-lg hover:bg-green-700 transition-colors">
            🛒 開始點餐
          </button>
          <button onClick={() => navigate('/orders')}
            className="w-full py-3 bg-gray-100 text-gray-600 rounded-xl font-medium hover:bg-gray-200 transition-colors">
            📋 查看我的訂單
          </button>
          <button onClick={() => useAuthStore.getState().logout()}
            className="text-sm text-gray-400 hover:text-red-500 transition-colors">
            {'\u767B\u51FA'}
          </button>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return setError('\u8ACB\u586B\u5BEB\u90F5\u7BB1\u8207\u5BC6\u78BC')
    setLoading(true)
    setError('')
    try {
      const res = await login(email, password)
      setAuth(res.access_token, res.refresh_token, res.user)
      navigate('/order')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '\u767B\u5165\u5931\u6557')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-green-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto text-3xl mb-3">
            {'🥬'}
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{'\u96C4\u6CC9\u9BAE\u98DF'}</h1>
          <p className="text-gray-400 text-sm">{'\u65B0\u9BAE\u852C\u679C \u6BCF\u65E5\u76F4\u9001'}</p>
        </div>

        {/* LINE Login Button */}
        <button
          onClick={() => redirectToLineLogin()}
          className="w-full py-3 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all hover:brightness-95 active:scale-[0.98]"
          style={{ backgroundColor: '#06C755', color: '#FFFFFF' }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
          </svg>
          LINE {'\u767B\u5165'}
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-sm text-gray-400">{'\u6216\u4F7F\u7528 Email'}</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* Email/Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              placeholder="you@example.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{'\u5BC6\u78BC'}</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              placeholder="********" />
          </div>

          {error && <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

          <button type="submit" disabled={loading}
            className="w-full py-3 bg-primary text-white rounded-xl font-bold text-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? '\u767B\u5165\u4E2D...' : '\u767B\u5165'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-400">
          {'\u9084\u6C92\u6709\u5E33\u865F\uFF1F '}
          <Link to="/register" className="text-primary font-medium hover:underline">{'\u8A3B\u518A'}</Link>
        </p>
      </div>
    </div>
  )
}

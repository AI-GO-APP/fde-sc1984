import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { register } from '../api/auth'
import { useAuthStore } from '../store/useAuthStore'

export default function RegisterPage() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!displayName || !email || !password) return setError('\u8ACB\u586B\u5BEB\u6240\u6709\u6B04\u4F4D')
    if (password !== confirmPw) return setError('\u5BC6\u78BC\u4E0D\u4E00\u81F4')
    if (password.length < 6) return setError('\u5BC6\u78BC\u81F3\u5C11 6 \u5B57\u5143')
    setLoading(true)
    setError('')
    try {
      const res = await register(email, password, displayName)
      setAuth(res.access_token, res.refresh_token, res.user)
      navigate('/order')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '\u8A3B\u518A\u5931\u6557')
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
          <h1 className="text-2xl font-bold text-gray-900">{'\u5EFA\u7ACB\u5E33\u865F'}</h1>
          <p className="text-gray-400 text-sm">{'\u96C4\u6CC9\u9BAE\u98DF \u2014 \u65B0\u9BAE\u852C\u679C\u76F4\u9001'}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{'\u59D3\u540D'}</label>
            <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              placeholder="Your name" />
          </div>
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
              placeholder="至少 6 字元" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{'\u78BA\u8A8D\u5BC6\u78BC'}</label>
            <input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              placeholder="再次輸入密碼" />
          </div>

          {error && <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

          <button type="submit" disabled={loading}
            className="w-full py-3 bg-primary text-white rounded-xl font-bold text-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? '\u8A3B\u518A\u4E2D...' : '\u8A3B\u518A'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-400">
          {'\u5DF2\u6709\u5E33\u865F\uFF1F '}
          <Link to="/login" className="text-primary font-medium hover:underline">{'\u767B\u5165'}</Link>
        </p>
      </div>
    </div>
  )
}

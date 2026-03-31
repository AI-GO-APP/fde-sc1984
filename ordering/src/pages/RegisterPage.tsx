import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { register } from '../api/auth'
import { useAuthStore } from '../store/useAuthStore'
import { ensureCustomerForCurrentUser } from '../api/customerSync'
import { useUIStore } from '../store/useUIStore'

export default function RegisterPage() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const { withLoading } = useUIStore()
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!displayName || !email || !password) return setError('請填寫所有欄位')
    if (password !== confirmPw) return setError('密碼不一致')
    if (password.length < 6) return setError('密碼至少 6 字元')
    setError('')
    await withLoading(async () => {
      const res = await register(email, password, displayName)
      setAuth(res.access_token, res.refresh_token, res.user, res.expires_in)
      // 非同步同步 Customer（不阻塞導航）
      ensureCustomerForCurrentUser()
      navigate('/order')
    }, '註冊中...', '註冊成功')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-green-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto text-3xl mb-3">
            {'🥬'}
          </div>
          <h1 className="text-2xl font-bold text-gray-900">建立帳號</h1>
          <p className="text-gray-400 text-sm">雄泉鮮食 — 新鮮蔬果直送</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">姓名</label>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">密碼</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              placeholder="至少 6 字元" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">確認密碼</label>
            <input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              placeholder="再次輸入密碼" />
          </div>

          {error && <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

          <button type="submit"
            className="w-full py-3 bg-primary text-white rounded-xl font-bold text-lg hover:bg-green-700 transition-colors">
            註冊
          </button>
        </form>

        <p className="text-center text-sm text-gray-400">
          已有帳號？{' '}
          <Link to="/login" className="text-primary font-medium hover:underline">登入</Link>
        </p>
      </div>
    </div>
  )
}

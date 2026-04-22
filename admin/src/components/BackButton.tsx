/**
 * 共用返回按鈕元件 — 依當前路徑決定要回到哪個 tab
 */
import { useNavigate, useLocation } from 'react-router-dom'

interface Props {
  label?: string
}

export default function BackButton({ label = '返回總覽' }: Props) {
  const navigate = useNavigate()
  const location = useLocation()
  const to = location.pathname.startsWith('/settings') ? '/settings' : '/daily'
  return (
    <button
      onClick={() => navigate(to)}
      className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 12H5"/><path d="m12 19-7-7 7-7"/>
      </svg>
      {label}
    </button>
  )
}

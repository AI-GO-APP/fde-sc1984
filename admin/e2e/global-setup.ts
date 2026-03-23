/**
 * 全域設定：取得 AI GO 的 access_token 並存入環境變數
 * 以供每個測試的 fixture 注入到 localStorage
 */
const REFRESH_TOKEN = 'vid5xfabw6pk'
const API_BASE = 'https://ai-go.app/api/v1'

async function globalSetup() {
  console.log('[global-setup] 正在向 AI GO 取得 access_token ...')

  const res = await fetch(`${API_BASE}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: REFRESH_TOKEN }),
  })

  if (!res.ok) {
    throw new Error(`[global-setup] Token 取得失敗: ${res.status} ${res.statusText}`)
  }

  const data = await res.json()
  const token = data.access_token

  if (!token) {
    throw new Error('[global-setup] access_token 為空')
  }

  // 將 Token 寫入環境變數供 fixture 使用
  process.env.ADMIN_TOKEN = token
  console.log(`[global-setup] Token 取得成功 (前 20 字元: ${token.substring(0, 20)}...)`)
}

export default globalSetup

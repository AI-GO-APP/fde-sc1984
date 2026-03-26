/**
 * 全域設定：設定 admin_token 供 AuthGuard 使用
 *
 * 實際 API 呼叫使用 X-API-Key（在 .env 和 axios client 中設定），
 * AuthGuard 只檢查 localStorage 是否有 admin_token，不驗證其內容。
 * 因此只需設定一個非空的 token 即可通過 AuthGuard。
 */

async function globalSetup() {
  // 先嘗試從 AI GO 取得真實 token（若 refresh token 仍有效）
  const REFRESH_TOKEN = 'vid5xfabw6pk'
  const API_BASE = 'https://ai-go.app/api/v1'

  try {
    console.log('[global-setup] 嘗試向 AI GO 取得 access_token ...')
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: REFRESH_TOKEN }),
    })

    if (res.ok) {
      const data = await res.json()
      if (data.access_token) {
        process.env.ADMIN_TOKEN = data.access_token
        console.log(`[global-setup] 真實 Token 取得成功`)
        return
      }
    }

    console.log(`[global-setup] Refresh token 已過期 (${res.status})，使用 API Key 模式`)
  } catch (err) {
    console.log('[global-setup] Token 取得失敗，使用 API Key 模式')
  }

  // Fallback：使用 e2e 專用 token（AuthGuard 只檢查存在性，不驗證內容）
  // 實際 API 呼叫靠 X-API-Key header
  process.env.ADMIN_TOKEN = 'e2e_test_token_api_key_mode'
  console.log('[global-setup] 已設定 E2E 測試 Token（API Key 模式）')
}

export default globalSetup

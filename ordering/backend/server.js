/**
 * LINE Login 後端服務
 * 
 * 職責：
 * 1. 接收前端傳來的 LINE authorization code
 * 2. 使用 Channel Secret 與 LINE API 交換 access_token + id_token
 * 3. 驗證 id_token 取得使用者資訊（email, name, picture）
 * 4. 用該資訊在 AI GO Custom App Auth 註冊/登入
 * 5. 回傳 AI GO 的 JWT 給前端
 */

import 'dotenv/config'
import express from 'express'
import cors from 'cors'

const app = express()
app.use(cors())
app.use(express.json())

const {
  LINE_CHANNEL_ID,
  LINE_CHANNEL_SECRET,
  AIGO_BASE,
  APP_SLUG,
  PORT = '3001',
} = process.env

// --- 工具函式 ---

/**
 * 用 authorization code 向 LINE 交換 access_token + id_token
 */
async function exchangeCodeForTokens(code, redirectUri) {
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    client_id: LINE_CHANNEL_ID,
    client_secret: LINE_CHANNEL_SECRET,
  })

  const res = await fetch('https://api.line.me/oauth2/v2.1/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  })

  const data = await res.json()
  if (!res.ok) {
    throw new Error(`LINE token exchange failed: ${data.error_description || data.error || 'Unknown'}`)
  }
  return data // { access_token, token_type, refresh_token, expires_in, scope, id_token }
}

/**
 * 驗證 LINE ID Token 並取得使用者資訊
 */
async function verifyIdToken(idToken) {
  const params = new URLSearchParams({
    id_token: idToken,
    client_id: LINE_CHANNEL_ID,
  })

  const res = await fetch('https://api.line.me/oauth2/v2.1/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  })

  const data = await res.json()
  if (!res.ok) {
    throw new Error(`LINE ID token verification failed: ${data.error_description || data.error || 'Unknown'}`)
  }
  return data // { iss, sub, aud, exp, iat, nonce, name, picture, email }
}

/**
 * 用 LINE access_token 取得使用者 profile（備用，若 id_token 資訊不足）
 */
async function getLineProfile(accessToken) {
  const res = await fetch('https://api.line.me/v2/profile', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  const data = await res.json()
  if (!res.ok) {
    throw new Error(`LINE profile fetch failed: ${data.message || 'Unknown'}`)
  }
  return data // { userId, displayName, pictureUrl, statusMessage }
}

/**
 * 在 AI GO Custom App Auth 註冊或登入
 * 策略：先嘗試登入，若失敗（帳號不存在）則註冊
 */
async function aigoRegisterOrLogin(email, password, displayName) {
  const authBase = `${AIGO_BASE}/api/v1/custom-app-auth/${APP_SLUG}`

  // 先嘗試登入
  const loginRes = await fetch(`${authBase}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })

  if (loginRes.ok) {
    return await loginRes.json()
  }

  // 登入失敗 → 嘗試註冊
  const registerRes = await fetch(`${authBase}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, display_name: displayName }),
  })

  if (registerRes.ok) {
    return await registerRes.json()
  }

  // 若註冊也失敗（可能帳號已存在但密碼不同），拋出錯誤
  const errData = await registerRes.json().catch(() => ({}))
  const errMsg = typeof errData.detail === 'string' ? errData.detail : 'AI GO auth failed'
  throw new Error(errMsg)
}

// --- API Endpoint ---

/**
 * POST /line-auth/callback
 * Body: { code: string, redirect_uri: string }
 * 
 * 回傳: AI GO 的 AuthResponse（access_token, refresh_token, user）
 */
app.post('/line-auth/callback', async (req, res) => {
  try {
    const { code, redirect_uri } = req.body

    if (!code || !redirect_uri) {
      return res.status(400).json({ detail: 'Missing code or redirect_uri' })
    }

    console.log('[LINE Auth] Exchanging code for tokens...')

    // Step 1: 向 LINE 交換 tokens
    const lineTokens = await exchangeCodeForTokens(code, redirect_uri)
    console.log('[LINE Auth] Token exchange OK')

    // Step 2: 取得使用者資訊
    let userEmail = ''
    let userName = ''
    let userPicture = ''

    if (lineTokens.id_token) {
      // 從 id_token 取得使用者資訊（最佳方式）
      const idTokenData = await verifyIdToken(lineTokens.id_token)
      console.log('[LINE Auth] ID token verified:', idTokenData.name, idTokenData.email)
      userEmail = idTokenData.email || ''
      userName = idTokenData.name || ''
      userPicture = idTokenData.picture || ''
    }

    // 若 id_token 沒有 name，從 profile API 取得
    if (!userName && lineTokens.access_token) {
      const profile = await getLineProfile(lineTokens.access_token)
      userName = profile.displayName || 'LINE User'
      userPicture = userPicture || profile.pictureUrl || ''
    }

    // 若沒有 email，用 LINE userId 產生一個唯一 email
    if (!userEmail) {
      // 從 id_token 的 sub 取得 LINE userId
      let lineUserId = ''
      if (lineTokens.id_token) {
        try {
          const payload = JSON.parse(atob(lineTokens.id_token.split('.')[1]))
          lineUserId = payload.sub
        } catch {}
      }
      if (!lineUserId && lineTokens.access_token) {
        const profile = await getLineProfile(lineTokens.access_token)
        lineUserId = profile.userId
      }
      userEmail = `line_${lineUserId}@line.local`
    }

    console.log('[LINE Auth] User info:', { email: userEmail, name: userName })

    // Step 3: 在 AI GO 註冊/登入
    // 用 LINE userId 的 hash 作為穩定密碼（使用者不需要知道）
    const linePassword = `LINE_${LINE_CHANNEL_SECRET.slice(0, 8)}_${userEmail}`

    const aigoResult = await aigoRegisterOrLogin(userEmail, linePassword, userName)
    console.log('[LINE Auth] AI GO auth OK, user:', aigoResult.user?.display_name)

    // 回傳給前端
    res.json(aigoResult)
  } catch (err) {
    console.error('[LINE Auth] Error:', err.message)
    res.status(400).json({ detail: err.message })
  }
})

// Health check
app.get('/line-auth/health', (req, res) => {
  res.json({ status: 'ok', service: 'line-auth-backend' })
})

app.listen(Number(PORT), () => {
  console.log(`[LINE Auth Backend] Running on http://localhost:${PORT}`)
  console.log(`[LINE Auth Backend] Channel ID: ${LINE_CHANNEL_ID}`)
  console.log(`[LINE Auth Backend] AI GO: ${AIGO_BASE}`)
})

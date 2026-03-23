/**
 * 認證工具：提供 Token 相關的輔助函式
 */
export function getToken(): string {
  const token = process.env.ADMIN_TOKEN
  if (!token) throw new Error('ADMIN_TOKEN 環境變數未設置，請確認 global-setup 已執行')
  return token
}

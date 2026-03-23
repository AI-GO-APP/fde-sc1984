// import apiClient from './client';

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

/**
 * TODO: AI-GO Token Exchange Mechanism
 * Admin 專案依指示不處理 Custom App User 登入（不需要租戶與用戶），
 * 而是直接透過 AI-GO 主站的 one time code 機制交換最高權限的 JWT token。
 * 
 * 實務與測試：
 * 此處預留供實際登入與 Callback 收到 Code 後打回 AI GO 取得 Token。
 * 開發階段我們使用 super-admin-credentials.md 提供的手動 Token 直接寫入 LocalStorage。
 */
export const exchangeOneTimeCode = async (code: string): Promise<string> => {
  console.log(`Exchanging code: ${code}`);
  // 實作與遠端或 API Server 的 Token 交換
  // const response = await apiClient.post<LoginResponse>('/auth/exchange', { code });
  // return response.data.access_token;
  
  return 'MOCK_TOKEN_EXCHANGE';
};

export const setAdminToken = (token: string) => {
  localStorage.setItem('admin_token', token);
};

export const getAdminToken = () => {
  return localStorage.getItem('admin_token');
};

export const clearAdminToken = () => {
  localStorage.removeItem('admin_token');
};

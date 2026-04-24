/* @ai-go-sdk — ordering app: ALL db operations via server-side action */
const API_BASE = (window as any).__API_BASE__ || '/api/v1';

function _h(): Record<string, string> {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  const t = (window as any).__APP_TOKEN__ || '';
  if (t) h['Authorization'] = 'Bearer ' + t;
  return h;
}

/** 呼叫後端 Action（所有資料庫操作的唯一入口） */
export async function runAction(actionName: string, params: Record<string, any> = {}): Promise<any> {
  const appId = (window as any).__APP_ID__ || '';
  const isExternal = !!(window as any).__IS_EXTERNAL__;
  const url = isExternal
    ? `${API_BASE}/ext/actions/run/${actionName}`
    : `${API_BASE}/actions/run/${appId}/${actionName}`;
  const resp = await fetch(url, {
    method: 'POST', headers: _h(), credentials: 'include',
    body: JSON.stringify({ params }),
  });
  if (!resp.ok) {
    const b = await resp.json().catch(() => ({}));
    throw new Error(b.detail || 'Action Error (' + resp.status + ')');
  }
  const result = await resp.json();
  if (result?.status === 'error') throw new Error(result.message || 'Action Error');
  return result.result ?? result.data ?? result;
}

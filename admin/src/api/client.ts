import axios from 'axios';

const AIGO_API_BASE = import.meta.env.VITE_API_BASE || '/api/v1';

export const apiClient = axios.create({
  baseURL: AIGO_API_BASE,
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': import.meta.env.VITE_API_KEY || '',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// AI GO Custom App Table API helpers
// 使用 /open/proxy 端點（API Key 認證），與 ordering client 一致
interface QueryOptions {
  limit?: number
  offset?: number
  filters?: any[]
  order_by?: any[]
  select_columns?: string[]
}

export const db = {
  async query<T = any>(table: string, opts?: QueryOptions): Promise<T[]> {
    const hasAdvance = opts?.filters || opts?.order_by || opts?.select_columns

    // 若呼叫端明確指定 limit/offset，維持原行為（單次請求）
    if (opts?.limit !== undefined || opts?.offset !== undefined) {
      if (hasAdvance) {
        const res = await apiClient.post(`/open/proxy/${table}/query`, opts)
        return res.data
      } else {
        const params = new URLSearchParams()
        if (opts.limit !== undefined) params.set('limit', String(opts.limit))
        if (opts.offset !== undefined) params.set('offset', String(opts.offset))
        const qs = params.toString() ? '?' + params.toString() : ''
        const res = await apiClient.get(`/open/proxy/${table}${qs}`)
        return res.data
      }
    }

    // 自動分頁：先試探再並行，避免盲目發送無效請求產生 400 錯誤
    const PAGE_SIZE = 500
    const BATCH_SIZE = 4 // 試探後每批並行抓取數量
    
    let all: T[] = []

    const fetchPage = async (offset: number): Promise<T[]> => {
      if (hasAdvance) {
        const res = await apiClient.post(`/open/proxy/${table}/query`, { ...opts, limit: PAGE_SIZE, offset })
        return res.data
      } else {
        const params = new URLSearchParams()
        params.set('limit', String(PAGE_SIZE))
        params.set('offset', String(offset))
        const res = await apiClient.get(`/open/proxy/${table}?${params}`)
        return res.data
      }
    }

    // 第一步：試探性請求（僅發 1 筆）
    let firstPage: T[]
    try {
      firstPage = await fetchPage(0)
    } catch {
      return [] // 表不存在或無權限
    }
    if (!Array.isArray(firstPage) || firstPage.length === 0) return []
    all = firstPage

    // 若第一頁未塞滿，代表資料不到 500 筆，直接返回（不發多餘請求）
    if (firstPage.length < PAGE_SIZE) return all

    // 第二步：資料超過一頁，開始並行分頁
    let currentOffset = PAGE_SIZE
    const firstId = String((firstPage[0] as any).id)

    while (true) {
      const batchPromises = Array.from(
        { length: BATCH_SIZE },
        (_, i) => fetchPage(currentOffset + i * PAGE_SIZE).catch(() => [] as T[]),
      )
      const batchResults = await Promise.all(batchPromises)
      
      let done = false
      for (const page of batchResults) {
        if (!Array.isArray(page) || page.length === 0) { done = true; break }

        // 防呆：若 server 忽略 offset 回傳相同首筆，中斷
        if (String((page[0] as any).id) === firstId) { done = true; break }

        const newItems = page.filter(item => !all.some(a => (a as any).id === (item as any).id))
        all = all.concat(newItems)

        if (page.length < PAGE_SIZE) { done = true; break }
      }

      if (done) break
      currentOffset += PAGE_SIZE * BATCH_SIZE
    }

    return all
  },
  
  async update<T = any>(table: string, id: string | number, data: Record<string, any>): Promise<T> {
    const res = await apiClient.patch(`/open/proxy/${table}/${id}`, data);
    return res.data;
  },

  async insert<T = any>(table: string, data: Record<string, any>): Promise<T> {
    const res = await apiClient.post(`/open/proxy/${table}`, data);
    return res.data;
  },

  async delete(table: string, id: string | number): Promise<void> {
    await apiClient.delete(`/open/proxy/${table}/${id}`)
  }
};

export default apiClient;

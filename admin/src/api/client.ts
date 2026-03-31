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

    // 自動分頁：每頁 500 筆，平行批次處理以大幅縮短等待時間
    const PAGE_SIZE = 500
    const BATCH_REQUESTS = 5 // 每次並行送出 5 個分頁請求 (單次總撈取 2500 筆)
    
    let all: T[] = []
    let currentOffset = 0
    let lastFirstId: string | null = null

    const fetchPage = async (offset: number) => {
      try {
        if (hasAdvance) {
          const res = await apiClient.post(`/open/proxy/${table}/query`, { ...opts, limit: PAGE_SIZE, offset })
          return res.data
        } else {
          const params = new URLSearchParams()
          params.set('limit', String(PAGE_SIZE))
          params.set('offset', String(offset))
          const qs = params.toString() ? '?' + params.toString() : ''
          const res = await apiClient.get(`/open/proxy/${table}${qs}`)
          return res.data
        }
      } catch (err) {
        console.error(`[db.query] Failed fetching page for ${table} at offset ${offset}:`, err)
        return [] // 失敗時退回空陣列
      }
    }

    while (true) {
      // 產生這批次的 5 個 Promise
      const batchPromises = Array.from({ length: BATCH_REQUESTS }, (_, i) => fetchPage(currentOffset + i * PAGE_SIZE))
      const batchResults = await Promise.all(batchPromises)
      
      let batchFinished = false

      // 依序檢查這 5 個 Promise 的結果
      for (const page of batchResults) {
        if (!Array.isArray(page) || page.length === 0) {
          batchFinished = true
          break
        }

        // 防呆：如果後端不支援 offset，則所有請求都會回傳首頁資料，強制中斷
        const currentFirstId = String((page[0] as any).id)
        if (lastFirstId !== null && currentFirstId === lastFirstId) {
          console.warn(`[db.query] Offset ignored by server for ${table}, breaking to prevent infinite loop.`)
          batchFinished = true
          break
        }
        lastFirstId = currentFirstId

        // 過濾重複資料（以防萬一）
        const newItems = page.filter(item => !all.some(a => (a as any).id === (item as any).id))
        all = all.concat(newItems)

        // 如果該頁無法塞滿，代表這就是最後一頁了
        if (page.length < PAGE_SIZE) {
          batchFinished = true
          break
        }
      }

      if (batchFinished) break
      currentOffset += PAGE_SIZE * BATCH_REQUESTS
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
  }
};

export default apiClient;

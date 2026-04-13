/**
 * Odoo API 回傳的 many2one 欄位可能是 [id, name] 陣列，也可能是純 id。
 * 本函式統一取出 id 部分，回傳字串。
 */
export const resolveId = (raw: any): string => {
  if (Array.isArray(raw)) return String(raw[0])
  return String(raw ?? '')
}

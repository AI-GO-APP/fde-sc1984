/**
 * 供應商-產品對應管理
 */
import { useState, useEffect } from 'react'
import PageHeader from '../components/PageHeader'
import ConfirmDialog from '../components/ConfirmDialog'
import { useUIStore } from '../store/useUIStore'
import {
  listSupplierMappings,
  addSupplierMapping,
  deleteSupplierMapping,
} from '../api/supplierMapping'

interface SupplierMappingRecord {
  id: string
  productTemplateId: string
  supplierId: string
}

export default function SupplierMappingPage() {
  const { withLoading, toast } = useUIStore()
  const [mappings, setMappings] = useState<SupplierMappingRecord[]>([])
  const [showForm, setShowForm] = useState(false)
  const [productTmplId, setProductTmplId] = useState('')
  const [supplierId, setSupplierId] = useState('')
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)

  const load = async () => {
    const data = await listSupplierMappings()
    setMappings(data)
  }

  useEffect(() => { load() }, [])

  const handleAdd = async () => {
    if (!productTmplId.trim() || !supplierId.trim()) {
      toast('error', '請填寫 Product Template ID 和 Supplier ID')
      return
    }
    await withLoading(async () => {
      await addSupplierMapping(productTmplId.trim(), supplierId.trim())
      setProductTmplId('')
      setSupplierId('')
      setShowForm(false)
      await load()
    }, '新增中...', '新增成功')
  }

  const handleDelete = async (id: string) => {
    await withLoading(async () => {
      await deleteSupplierMapping(id)
      await load()
    }, '刪除中...', '已刪除')
    setDeleteTargetId(null)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <PageHeader title="供應商-產品對應" showBack>
        <div className="pt-2">
          <button
            onClick={() => setShowForm(v => !v)}
            className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
            + 新增對應
          </button>
        </div>
      </PageHeader>

      <div className="p-6 max-w-[1200px] mx-auto w-full space-y-4">
        {showForm && (
          <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
            <p className="font-medium text-gray-700">新增供應商-產品對應</p>
            <div className="flex gap-3 flex-wrap">
              <input
                type="text"
                placeholder="Product Template ID"
                value={productTmplId}
                onChange={e => setProductTmplId(e.target.value)}
                className="border border-gray-200 rounded px-3 py-1.5 text-sm flex-1 min-w-40"
              />
              <input
                type="text"
                placeholder="Supplier ID"
                value={supplierId}
                onChange={e => setSupplierId(e.target.value)}
                className="border border-gray-200 rounded px-3 py-1.5 text-sm flex-1 min-w-40"
              />
              <button
                onClick={handleAdd}
                className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
                確認新增
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200">
                取消
              </button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          {mappings.length === 0 ? (
            <div className="text-center text-gray-400 py-12">尚無供應商-產品對應資料</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-400 text-xs">
                <tr>
                  <th className="px-4 py-3 text-left">ID</th>
                  <th className="px-4 py-3 text-left">Product Template ID</th>
                  <th className="px-4 py-3 text-left">Supplier ID</th>
                  <th className="px-4 py-3 text-right">操作</th>
                </tr>
              </thead>
              <tbody>
                {mappings.map(m => (
                  <tr key={m.id} className="border-t border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-400 font-mono text-xs">{m.id}</td>
                    <td className="px-4 py-3 font-mono text-xs">{m.productTemplateId}</td>
                    <td className="px-4 py-3 font-mono text-xs">{m.supplierId}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setDeleteTargetId(m.id)}
                        className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded">
                        刪除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={!!deleteTargetId}
        title="確認刪除？"
        message="此供應商-產品對應將被永久刪除。"
        confirmText="刪除"
        variant="danger"
        onConfirm={() => deleteTargetId && handleDelete(deleteTargetId)}
        onCancel={() => setDeleteTargetId(null)}
      />
    </div>
  )
}

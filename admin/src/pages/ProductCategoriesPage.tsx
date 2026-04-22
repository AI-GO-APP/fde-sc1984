/**
 * 產品分類管理 — product_categories CRUD
 */
import { useState, useEffect } from 'react'
import PageHeader from '../components/PageHeader'
import ConfirmDialog from '../components/ConfirmDialog'
import { useUIStore } from '../store/useUIStore'
import {
  listProductCategories,
  addProductCategory,
  updateProductCategory,
  deleteProductCategory,
  type ProductCategory,
} from '../api/productCategories'

export default function ProductCategoriesPage() {
  const { withLoading, toast } = useUIStore()
  const [categories, setCategories] = useState<ProductCategory[]>([])
  const [showForm, setShowForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [newParentId, setNewParentId] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [editingParentId, setEditingParentId] = useState('')
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)

  const load = async () => {
    const data = await listProductCategories()
    setCategories(data)
  }

  useEffect(() => {
    withLoading(load, '載入分類中...').catch(() => toast('error', '載入失敗'))
  }, [])

  const handleAdd = async () => {
    if (!newName.trim()) {
      toast('error', '請輸入分類名稱')
      return
    }
    await withLoading(async () => {
      await addProductCategory(newName.trim(), newParentId || undefined)
      setNewName('')
      setNewParentId('')
      setShowForm(false)
      await load()
    }, '新增中...', '分類已新增')
  }

  const startEdit = (c: ProductCategory) => {
    setEditingId(c.id)
    setEditingName(c.name)
    setEditingParentId(c.parentId)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditingName('')
    setEditingParentId('')
  }

  const saveEdit = async () => {
    if (!editingId) return
    if (!editingName.trim()) {
      toast('error', '請輸入分類名稱')
      return
    }
    await withLoading(async () => {
      await updateProductCategory(editingId, { name: editingName.trim(), parentId: editingParentId })
      await load()
      cancelEdit()
    }, '儲存中...', '已更新')
  }

  const handleDelete = async (id: string) => {
    await withLoading(async () => {
      await deleteProductCategory(id)
      await load()
    }, '刪除中...', '已刪除')
    setDeleteTargetId(null)
  }

  const parentName = (parentId: string): string => {
    if (!parentId) return '—'
    const parent = categories.find(c => c.id === parentId)
    return parent ? parent.name : parentId
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <PageHeader title="產品分類管理" showBack>
        <div className="pt-2">
          <button
            onClick={() => setShowForm(v => !v)}
            className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
            + 新增分類
          </button>
        </div>
      </PageHeader>

      <div className="p-6 max-w-[1000px] mx-auto w-full space-y-4">
        {showForm && (
          <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
            <p className="font-medium text-gray-700">新增分類</p>
            <div className="flex gap-3 flex-wrap">
              <input
                type="text"
                placeholder="分類名稱"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                className="border border-gray-200 rounded px-3 py-1.5 text-sm flex-1 min-w-40"
              />
              <select
                value={newParentId}
                onChange={e => setNewParentId(e.target.value)}
                className="border border-gray-200 rounded px-3 py-1.5 text-sm bg-white min-w-40"
              >
                <option value="">（無上層分類）</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
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
          {categories.length === 0 ? (
            <div className="text-center text-gray-400 py-12">尚無分類資料</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs">
                <tr>
                  <th className="px-4 py-3 text-left">ID</th>
                  <th className="px-4 py-3 text-left">分類名稱</th>
                  <th className="px-4 py-3 text-left">上層分類</th>
                  <th className="px-4 py-3 text-right">操作</th>
                </tr>
              </thead>
              <tbody>
                {categories.map(c => (
                  <tr key={c.id} className="border-t border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs text-gray-400">{c.id}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">
                      {editingId === c.id ? (
                        <input
                          type="text"
                          value={editingName}
                          onChange={e => setEditingName(e.target.value)}
                          className="border border-gray-200 rounded px-2 py-1 text-sm w-full"
                        />
                      ) : c.name}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {editingId === c.id ? (
                        <select
                          value={editingParentId}
                          onChange={e => setEditingParentId(e.target.value)}
                          className="border border-gray-200 rounded px-2 py-1 text-sm bg-white"
                        >
                          <option value="">（無上層分類）</option>
                          {categories.filter(x => x.id !== c.id).map(x => (
                            <option key={x.id} value={x.id}>{x.name}</option>
                          ))}
                        </select>
                      ) : parentName(c.parentId)}
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      {editingId === c.id ? (
                        <>
                          <button onClick={saveEdit} className="px-2 py-1 text-xs text-white bg-blue-600 hover:bg-blue-700 rounded">儲存</button>
                          <button onClick={cancelEdit} className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded">取消</button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => startEdit(c)} className="px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded">編輯</button>
                          <button onClick={() => setDeleteTargetId(c.id)} className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded">刪除</button>
                        </>
                      )}
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
        title="確認刪除分類？"
        message="若仍有產品使用此分類，刪除可能失敗。"
        confirmText="刪除"
        variant="danger"
        onConfirm={() => deleteTargetId && handleDelete(deleteTargetId)}
        onCancel={() => setDeleteTargetId(null)}
      />
    </div>
  )
}

/**
 * 分類-買辦人對應管理 — 決定每個產品分類由哪位員工負責採購
 */
import { useState, useEffect, useMemo } from 'react'
import PageHeader from '../components/PageHeader'
import ConfirmDialog from '../components/ConfirmDialog'
import { useUIStore } from '../store/useUIStore'
import {
  listCategoryBuyerMappings,
  addCategoryBuyerMapping,
  deleteCategoryBuyerMapping,
  type CategoryBuyerMapping,
} from '../api/categoryBuyer'
import { listProductCategories, type ProductCategory } from '../api/productCategories'
import { getCachedDrivers } from '../api/refCache'
import { getAdminUser } from '../api/auth'

interface Employee { id: string; name: string }

export default function CategoryBuyerPage() {
  const { withLoading, toast } = useUIStore()
  const [mappings, setMappings] = useState<CategoryBuyerMapping[]>([])
  const [categories, setCategories] = useState<ProductCategory[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [showForm, setShowForm] = useState(false)
  const [categoryId, setCategoryId] = useState('')
  const [employeeId, setEmployeeId] = useState('')
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)

  const currentUser = getAdminUser()?.name || '未知使用者'

  const load = async () => {
    const [maps, cats, emps] = await Promise.all([
      listCategoryBuyerMappings(),
      listProductCategories(),
      getCachedDrivers(),
    ])
    setMappings(maps)
    setCategories(cats)
    setEmployees(emps)
  }

  useEffect(() => {
    withLoading(load, '載入中...').catch(() => toast('error', '載入失敗'))
  }, [])

  const categoryName = (id: string) => categories.find(c => c.id === id)?.name || id
  const employeeName = (id: string) => employees.find(e => e.id === id)?.name || id

  const handleAdd = async () => {
    if (!categoryId || !employeeId) {
      toast('error', '請選擇分類與買辦人')
      return
    }
    await withLoading(async () => {
      await addCategoryBuyerMapping(categoryId, employeeId, currentUser)
      setCategoryId('')
      setEmployeeId('')
      setShowForm(false)
      await load()
    }, '新增中...', '對應已新增')
  }

  const handleDelete = async (id: string) => {
    await withLoading(async () => {
      await deleteCategoryBuyerMapping(id)
      await load()
    }, '刪除中...', '已刪除')
    setDeleteTargetId(null)
  }

  const grouped = useMemo(() => {
    const map = new Map<string, CategoryBuyerMapping[]>()
    mappings.forEach(m => {
      const list = map.get(m.employeeId) || []
      list.push(m)
      map.set(m.employeeId, list)
    })
    return Array.from(map.entries()).sort(([a], [b]) =>
      employeeName(a).localeCompare(employeeName(b), 'zh-Hant')
    )
  }, [mappings, employees])

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <PageHeader title="分類-買辦人對應" showBack>
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
            <p className="font-medium text-gray-700">新增對應</p>
            <div className="flex gap-3 flex-wrap">
              <select
                value={categoryId}
                onChange={e => setCategoryId(e.target.value)}
                className="border border-gray-200 rounded px-3 py-1.5 text-sm bg-white flex-1 min-w-48"
              >
                <option value="">選擇分類...</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <select
                value={employeeId}
                onChange={e => setEmployeeId(e.target.value)}
                className="border border-gray-200 rounded px-3 py-1.5 text-sm bg-white flex-1 min-w-48"
              >
                <option value="">選擇買辦人（員工）...</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.name}</option>
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

        {mappings.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 text-center text-gray-400 py-12">
            尚無分類-買辦人對應資料
          </div>
        ) : (
          <div className="space-y-4">
            {grouped.map(([empId, items]) => (
              <section key={empId} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <header className="bg-gray-50 px-4 py-2.5 border-b border-gray-100">
                  <p className="font-semibold text-gray-800">{employeeName(empId)}</p>
                  <p className="text-xs text-gray-400">負責 {items.length} 個分類</p>
                </header>
                <ul className="divide-y divide-gray-50">
                  {items.map(m => (
                    <li key={m.id} className="flex items-center justify-between px-4 py-2.5">
                      <span className="text-sm text-gray-800">{categoryName(m.categoryId)}</span>
                      <button
                        onClick={() => setDeleteTargetId(m.id)}
                        className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded">
                        刪除
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteTargetId}
        title="確認刪除？"
        message="此分類-買辦人對應將被永久刪除。"
        confirmText="刪除"
        variant="danger"
        onConfirm={() => deleteTargetId && handleDelete(deleteTargetId)}
        onCancel={() => setDeleteTargetId(null)}
      />
    </div>
  )
}

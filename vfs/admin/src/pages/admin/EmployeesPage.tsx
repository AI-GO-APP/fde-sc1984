import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as db from '../../db';

type Employee = {
  id: string; name: string; work_email: string;
  department_name: string; has_account: boolean; job_title: string;
};

export default function EmployeesPage() {
  const nav = useNavigate();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await db.runAction('list_employees', { for_picker: false });
        setEmployees(res?.employees || []);
      } catch (e: any) {
        setError(e?.message || '載入失敗');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = employees.filter(e => {
    const kw = search.trim().toLowerCase();
    if (!kw) return true;
    return e.name.toLowerCase().includes(kw)
      || e.work_email.toLowerCase().includes(kw)
      || e.department_name.toLowerCase().includes(kw);
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-3 max-w-4xl mx-auto">
          <button onClick={() => nav('/admin/settings')} className="text-gray-500 hover:text-gray-700 text-sm">← 返回</button>
          <h1 className="text-xl font-bold text-gray-900">員工管理</h1>
        </div>
      </header>

      <div className="p-6 max-w-4xl mx-auto space-y-4">
        <input
          type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="搜尋姓名、Email 或部門"
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white" />

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">{error}</div>
        )}

        {loading ? (
          <p className="text-gray-400 text-center py-12">載入中...</p>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            {filtered.length === 0 ? (
              <div className="text-center text-gray-400 py-12">
                {employees.length === 0 ? '尚無員工資料' : '沒有符合的結果'}
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 text-xs">
                  <tr>
                    <th className="px-4 py-3 text-left">姓名</th>
                    <th className="px-4 py-3 text-left">Email</th>
                    <th className="px-4 py-3 text-left">部門</th>
                    <th className="px-4 py-3 text-center">系統帳號</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(e => (
                    <tr key={e.id} className="border-t border-gray-50 hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-800">
                        {e.name}
                        {e.job_title && <span className="ml-2 text-xs text-gray-400">{e.job_title}</span>}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{e.work_email || '—'}</td>
                      <td className="px-4 py-3 text-gray-600">{e.department_name || '—'}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                          e.has_account
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-400'
                        }`}>
                          {e.has_account ? '有' : '無'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        <p className="text-xs text-gray-400 text-right">共 {filtered.length} 位員工</p>
      </div>
    </div>
  );
}

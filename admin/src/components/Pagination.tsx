/**
 * 分頁元件
 */
interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

export default function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-center gap-2 py-4">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
          currentPage <= 1
            ? 'border-gray-200 text-gray-300 cursor-not-allowed'
            : 'border-gray-200 text-gray-600 hover:bg-gray-50 bg-white'
        }`}
      >
        ← 上一頁
      </button>
      <span className="text-sm text-gray-500">
        第 <strong className="text-gray-900">{currentPage}</strong> / {totalPages} 頁
      </span>
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
          currentPage >= totalPages
            ? 'border-gray-200 text-gray-300 cursor-not-allowed'
            : 'border-gray-200 text-gray-600 hover:bg-gray-50 bg-white'
        }`}
      >
        下一頁 →
      </button>
    </div>
  )
}

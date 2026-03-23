export default function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-3 space-y-2 animate-pulse">
      <div>
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-1"></div>
        <div className="h-3 bg-gray-200 rounded w-1/4"></div>
      </div>
      <div className="h-8 bg-gray-100 rounded-lg w-full mt-2"></div>
    </div>
  )
}

export function CardSkeleton() {
  return (
    <div className="bg-gray-950 border border-gray-900 rounded-xl shadow-sm p-6 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="h-4 bg-gray-800 rounded w-1/3"></div>
        <div className="h-8 w-8 bg-gray-800 rounded-lg"></div>
      </div>
      <div className="h-8 bg-gray-800 rounded w-2/3 mb-2"></div>
      <div className="h-3 bg-gray-800 rounded w-1/2"></div>
    </div>
  )
}

export function StatCardSkeleton() {
  return (
    <div className="bg-gray-950 border border-gray-900 rounded-xl shadow-sm p-6 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="h-4 bg-gray-800 rounded w-24"></div>
        <div className="h-10 w-10 bg-gray-800 rounded-lg"></div>
      </div>
      <div className="h-10 bg-gray-800 rounded w-32 mb-2"></div>
      <div className="h-3 bg-gray-800 rounded w-16"></div>
    </div>
  )
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-gray-950 border border-gray-900 rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="border-b border-gray-900 p-4 animate-pulse">
        <div className="grid grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-4 bg-gray-800 rounded"></div>
          ))}
        </div>
      </div>
      
      {/* Rows */}
      {[...Array(rows)].map((_, rowIndex) => (
        <div
          key={rowIndex}
          className="border-b border-gray-900 p-4 animate-pulse"
        >
          <div className="grid grid-cols-5 gap-4">
            {[...Array(5)].map((_, colIndex) => (
              <div
                key={colIndex}
                className="h-4 bg-gray-800 rounded"
              ></div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export function PortfolioCardSkeleton() {
  return (
    <div className="bg-gray-950 border border-gray-900 rounded-xl shadow-sm p-6 animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="h-6 bg-gray-800 rounded w-2/3 mb-2"></div>
          <div className="h-4 bg-gray-800 rounded w-1/3"></div>
        </div>
        <div className="h-6 w-16 bg-gray-800 rounded-full"></div>
      </div>
      
      <div className="space-y-3 mb-6">
        <div className="h-3 bg-gray-800 rounded w-full"></div>
        <div className="h-3 bg-gray-800 rounded w-3/4"></div>
      </div>
      
      <div className="grid grid-cols-3 gap-4 mb-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-3 bg-gray-800 rounded w-full"></div>
            <div className="h-5 bg-gray-800 rounded w-2/3"></div>
          </div>
        ))}
      </div>
      
      <div className="flex gap-2 pt-4 border-t border-gray-900">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-8 w-8 bg-gray-800 rounded"></div>
        ))}
      </div>
    </div>
  )
}

export function ChartSkeleton() {
  return (
    <div className="bg-gray-950 border border-gray-900 rounded-xl shadow-sm p-6 animate-pulse">
      <div className="h-6 bg-gray-800 rounded w-1/3 mb-6"></div>
      <div className="flex items-center justify-center h-64">
        <div className="h-48 w-48 bg-gray-800 rounded-full"></div>
      </div>
    </div>
  )
}

export function ListSkeleton({ items = 10 }: { items?: number }) {
  return (
    <div className="space-y-3">
      {[...Array(items)].map((_, i) => (
        <div
          key={i}
          className="bg-gray-950 border border-gray-900 rounded-lg p-4 animate-pulse"
        >
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 bg-gray-800 rounded-full flex-shrink-0"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-800 rounded w-3/4"></div>
              <div className="h-3 bg-gray-800 rounded w-1/2"></div>
            </div>
            <div className="h-8 bg-gray-800 rounded w-20"></div>
          </div>
        </div>
      ))}
    </div>
  )
}

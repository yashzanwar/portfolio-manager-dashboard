import { Loader2 } from 'lucide-react'

interface PullToRefreshIndicatorProps {
  isPulling: boolean
  isRefreshing: boolean
  pullDistance: number
}

export function PullToRefreshIndicator({
  isPulling,
  isRefreshing,
  pullDistance
}: PullToRefreshIndicatorProps) {
  if (!isPulling && !isRefreshing) return null

  const opacity = Math.min(pullDistance / 80, 1)
  const scale = Math.min(pullDistance / 80, 1)

  return (
    <div
      className="lg:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-center pointer-events-none"
      style={{
        transform: `translateY(${Math.min(pullDistance, 80)}px)`,
        transition: isPulling && !isRefreshing ? 'none' : 'transform 0.3s ease-out'
      }}
    >
      <div
        className="bg-gray-950 rounded-full p-2 shadow-lg border border-gray-800"
        style={{
          opacity,
          transform: `scale(${scale})`,
          transition: 'opacity 0.2s, transform 0.2s'
        }}
      >
        <Loader2
          className={`w-6 h-6 text-blue-500 ${isRefreshing ? 'animate-spin' : ''}`}
          style={{
            transform: `rotate(${pullDistance * 3}deg)`,
            transition: isRefreshing ? 'none' : 'transform 0.1s'
          }}
        />
      </div>
    </div>
  )
}

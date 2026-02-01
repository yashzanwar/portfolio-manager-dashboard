import { useEffect, useRef, useState } from 'react'

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void> | void
  threshold?: number
  maxPullDistance?: number
  resistance?: number
}

export function usePullToRefresh({
  onRefresh,
  threshold = 80,
  maxPullDistance = 120,
  resistance = 2.5
}: UsePullToRefreshOptions) {
  const [isPulling, setIsPulling] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const touchStartY = useRef(0)
  const scrollableElement = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const element = document.querySelector('main') as HTMLElement
    scrollableElement.current = element

    if (!element || window.innerWidth >= 1024) return // Only on mobile

    let currentPullDistance = 0
    let startY = 0

    const handleTouchStart = (e: TouchEvent) => {
      if (element.scrollTop === 0 && !isRefreshing) {
        startY = e.touches[0].clientY
        touchStartY.current = startY
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (isRefreshing || element.scrollTop > 0) return

      const currentY = e.touches[0].clientY
      const diff = currentY - touchStartY.current

      if (diff > 0) {
        setIsPulling(true)
        // Apply resistance
        currentPullDistance = Math.min(diff / resistance, maxPullDistance)
        setPullDistance(currentPullDistance)

        // Prevent default scrolling when pulling
        if (diff > 10) {
          e.preventDefault()
        }
      }
    }

    const handleTouchEnd = async () => {
      if (!isPulling) return

      if (pullDistance >= threshold) {
        setIsRefreshing(true)
        try {
          await onRefresh()
        } finally {
          setTimeout(() => {
            setIsRefreshing(false)
            setPullDistance(0)
            setIsPulling(false)
          }, 500)
        }
      } else {
        setPullDistance(0)
        setIsPulling(false)
      }
    }

    element.addEventListener('touchstart', handleTouchStart, { passive: true })
    element.addEventListener('touchmove', handleTouchMove, { passive: false })
    element.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchmove', handleTouchMove)
      element.removeEventListener('touchend', handleTouchEnd)
    }
  }, [onRefresh, threshold, maxPullDistance, resistance, isPulling, isRefreshing, pullDistance])

  return {
    isPulling: isPulling || isRefreshing,
    isRefreshing,
    pullDistance
  }
}

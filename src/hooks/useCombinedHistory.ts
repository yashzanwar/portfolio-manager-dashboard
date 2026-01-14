import { useQuery } from '@tanstack/react-query'
import { PortfolioAPI } from '../services/portfolioApi'
import { CombinedPortfolioHistory, DateRangeOption } from '../types/portfolioHistory'

function getDateRange(range: DateRangeOption): { startDate?: string; endDate?: string } {
  const now = new Date()
  const endDate = now.toISOString().split('T')[0]
  
  if (range === 'all') {
    return {} // No date filters for "all time"
  }
  
  const daysMap: Record<Exclude<DateRangeOption, 'all'>, number> = {
    '7d': 7,
    '30d': 30,
    '90d': 90,
    '1y': 365,
  }
  
  const days = daysMap[range]
  const startDate = new Date(now)
  startDate.setDate(startDate.getDate() - days)
  
  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate,
  }
}

export function useCombinedHistory(
  portfolioIds: number[],
  dateRange: DateRangeOption = '30d'
) {
  return useQuery<CombinedPortfolioHistory>({
    queryKey: ['combined-portfolio-history', portfolioIds.sort().join(','), dateRange],
    queryFn: async () => {
      if (dateRange === 'all') {
        return await PortfolioAPI.getCombinedCompleteHistory(portfolioIds)
      } else {
        const { startDate, endDate } = getDateRange(dateRange)
        return await PortfolioAPI.getCombinedHistory(portfolioIds, startDate, endDate)
      }
    },
    enabled: portfolioIds.length > 0,
    staleTime: 60000, // 1 minute
  })
}

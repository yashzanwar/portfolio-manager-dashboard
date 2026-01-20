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
  portfolioIds?: number[],
  dateRange: DateRangeOption = '30d',
  assetType?: 'MUTUAL_FUND' | 'EQUITY_STOCK'
) {
  const ids = portfolioIds ?? []
  return useQuery<CombinedPortfolioHistory>({
    queryKey: ['combined-portfolio-history', ids.slice().sort((a, b) => a - b).join(','), dateRange, assetType],
    queryFn: async () => {
      if (ids.length === 0) {
        throw new Error('No portfolios selected')
      }
      if (dateRange === 'all') {
        return await PortfolioAPI.getCombinedCompleteHistory(ids)
      } else {
        const { startDate, endDate } = getDateRange(dateRange)
        return await PortfolioAPI.getCombinedHistory(ids, startDate, endDate, assetType)
      }
    },
    enabled: ids.length > 0,
    staleTime: 60000, // 1 minute
  })
}

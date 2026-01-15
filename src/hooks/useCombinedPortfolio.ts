import { useQuery } from '@tanstack/react-query'
import { PortfolioAPI } from '../services/portfolioApi'
import { CombinedPortfolioSummary } from '../types/combinedPortfolio'

export function useCombinedPortfolio(portfolioIds?: number[]) {
  const ids = portfolioIds || []
  
  return useQuery<CombinedPortfolioSummary>({
    queryKey: ['combinedPortfolio', ids.sort().join(',')],
    queryFn: () => PortfolioAPI.getCombinedSummary(ids),
    enabled: ids.length > 0,
    staleTime: 30000, // 30 seconds
  })
}

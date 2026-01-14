import { useQuery } from '@tanstack/react-query'
import { PortfolioAPI } from '../services/portfolioApi'
import { CombinedPortfolioSummary } from '../types/combinedPortfolio'

export function useCombinedPortfolio(portfolioIds: number[]) {
  return useQuery<CombinedPortfolioSummary>({
    queryKey: ['combinedPortfolio', portfolioIds.sort().join(',')],
    queryFn: () => PortfolioAPI.getCombinedSummary(portfolioIds),
    enabled: portfolioIds.length > 0,
    staleTime: 30000, // 30 seconds
  })
}

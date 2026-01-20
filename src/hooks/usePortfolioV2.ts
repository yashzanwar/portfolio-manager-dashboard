import { useQuery } from '@tanstack/react-query'
import { PortfolioAPI } from '../services/portfolioApi'
import { PortfolioSummaryV2 } from '../types/portfolioV2'

/**
 * Hook to fetch V2 portfolio summary with asset type breakdown
 * Supports both single and multiple portfolios
 * @param portfolioIds - Array of portfolio IDs to fetch
 * @param assetType - Optional filter: 'MUTUAL_FUND' or 'EQUITY_STOCK'
 * @param includeHoldings - Optional flag to include detailed holdings data
 */
export function usePortfolioSummaryV2(
  portfolioIds?: number[], 
  assetType?: 'MUTUAL_FUND' | 'EQUITY_STOCK',
  includeHoldings?: boolean
) {
  const ids = portfolioIds || []
  
  return useQuery<PortfolioSummaryV2>({
    queryKey: ['portfolioSummaryV2', ids.sort().join(','), assetType || 'all', includeHoldings ? 'with-holdings' : 'summary-only'],
    queryFn: () => PortfolioAPI.getPortfolioSummaryV2(ids, assetType, includeHoldings),
    enabled: ids.length > 0,
    staleTime: 30000, // 30 seconds
    retry: 2,
  })
}

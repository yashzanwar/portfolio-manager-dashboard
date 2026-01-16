import { useQuery } from '@tanstack/react-query'
import { XIRRApi, XIRRResponse, SchemeXIRRResponse } from '../services/xirrApi'

/**
 * Hook to fetch consolidated XIRR for selected portfolios
 */
export function usePortfolioXIRR(portfolioIds?: number[]) {
  return useQuery<XIRRResponse>({
    queryKey: ['portfolio-xirr', portfolioIds],
    queryFn: () => {
      if (!portfolioIds || portfolioIds.length === 0) {
        throw new Error('No portfolios selected')
      }
      return XIRRApi.getConsolidatedXIRR(portfolioIds)
    },
    enabled: !!portfolioIds && portfolioIds.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Hook to fetch XIRR for a specific scheme
 */
export function useSchemeXIRR(schemeId: number, portfolioIds?: number[]) {
  return useQuery<XIRRResponse>({
    queryKey: ['scheme-xirr', schemeId, portfolioIds],
    queryFn: () => {
      if (!portfolioIds || portfolioIds.length === 0) {
        throw new Error('No portfolios selected')
      }
      return XIRRApi.getSchemeXIRR(schemeId, portfolioIds)
    },
    enabled: !!portfolioIds && portfolioIds.length > 0 && !!schemeId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false, // Don't retry if scheme has no transactions
  })
}

/**
 * Hook to fetch XIRR for multiple schemes
 */
export function useMultipleSchemeXIRR(schemeIds: number[], portfolioIds?: number[]) {
  return useQuery<SchemeXIRRResponse[]>({
    queryKey: ['multiple-scheme-xirr', schemeIds, portfolioIds],
    queryFn: () => {
      if (!portfolioIds || portfolioIds.length === 0) {
        throw new Error('No portfolios selected')
      }
      if (schemeIds.length === 0) {
        return []
      }
      return XIRRApi.getMultipleSchemeXIRR(schemeIds, portfolioIds)
    },
    enabled: !!portfolioIds && portfolioIds.length > 0 && schemeIds.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

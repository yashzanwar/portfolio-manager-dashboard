import { apiClient } from './api'

export interface XIRRResponse {
  xirr: number
  portfolioName: string | null
  schemeName: string | null
  transactionCount: number
  totalInvested: number
  currentValue: number
  calculationDate: string
}

export interface SchemeXIRRResponse extends XIRRResponse {
  schemeId: number
  isin?: string
}

export const XIRRApi = {
  /**
   * Get consolidated XIRR for portfolios
   */
  getConsolidatedXIRR: async (
    portfolioIds: number[],
    includeCurrentValue: boolean = true,
    assetType?: 'MUTUAL_FUND' | 'EQUITY_STOCK'
  ): Promise<XIRRResponse> => {
    const params: Record<string, string> = {
      portfolioIds: portfolioIds.join(','),
      includeCurrentValue: String(includeCurrentValue)
    }
    
    if (assetType) {
      params.assetType = assetType
    }
    
    const response = await apiClient.get('/portfolios/xirr/consolidated', {
      params
    })
    return response.data
  },

  /**
   * Get XIRR for a specific scheme across portfolios
   */
  getSchemeXIRR: async (
    schemeId: number,
    portfolioIds: number[],
    includeCurrentValue: boolean = true
  ): Promise<XIRRResponse> => {
    const response = await apiClient.get(`/portfolios/schemes/${schemeId}/xirr/consolidated`, {
      params: {
        portfolioIds: portfolioIds.join(','),
        includeCurrentValue
      }
    })
    return response.data
  },

  /**
   * Get XIRR for multiple schemes
   */
  getMultipleSchemeXIRR: async (
    schemeIds: number[],
    portfolioIds: number[],
    includeCurrentValue: boolean = true
  ): Promise<Map<number, XIRRResponse>> => {
    const results = new Map<number, XIRRResponse>()
    
    // Fetch XIRR for each scheme in parallel
    const promises = schemeIds.map(schemeId =>
      XIRRApi.getSchemeXIRR(schemeId, portfolioIds, includeCurrentValue)
        .then(data => ({ schemeId, data }))
        .catch(() => null)  // Ignore schemes with no transactions
    )
    
    const responses = await Promise.all(promises)
    
    responses.forEach(response => {
      if (response) {
        results.set(response.schemeId, response.data)
      }
    })
    
    return results
  }
}

import { apiClient } from './api'
import type {
  MetalScheme,
  MetalHoldingV2,
  MetalTransactionRequest,
  MetalPriceResponse,
  MetalTransaction
} from '../types/metal'

/**
 * API service for precious metals operations
 */
export const MetalApi = {
  /**
   * Get available metal schemes (GOLD_24K, GOLD_22K, SILVER_999, etc.)
   */
  getSchemes: async (): Promise<MetalScheme[]> => {
    const response = await apiClient.get<MetalScheme[]>('/metals/schemes')
    return response.data
  },

  /**
   * Get metal holdings for a portfolio
   */
  getHoldings: async (portfolioId: number): Promise<MetalHoldingV2[]> => {
    const response = await apiClient.get<MetalHoldingV2[]>(
      `/portfolios/${portfolioId}/metals/holdings`
    )
    return response.data
  },

  /**
   * Get current metal prices for all purities
   */
  getCurrentPrices: async (): Promise<MetalPriceResponse> => {
    const response = await apiClient.get<MetalPriceResponse>('/metals/prices/current')
    return response.data
  },

  /**
   * Add a metal transaction (buy or sell)
   */
  addTransaction: async (
    portfolioId: number,
    request: MetalTransactionRequest
  ): Promise<MetalTransaction> => {
    const response = await apiClient.post<MetalTransaction>(
      `/portfolios/${portfolioId}/metals/transactions`,
      request
    )
    return response.data
  },

  /**
   * Get metal transaction history for a portfolio
   */
  getTransactions: async (portfolioId: number): Promise<MetalTransaction[]> => {
    const response = await apiClient.get<MetalTransaction[]>(
      `/portfolios/${portfolioId}/metals/transactions`
    )
    return response.data
  },

  /**
   * Manually trigger price sync (admin)
   */
  syncPrices: async (): Promise<{ status: string; pricesSynced: number }> => {
    const response = await apiClient.post('/metals/prices/sync')
    return response.data
  },

  /**
   * Add a metal buy transaction
   */
  addBuyTransaction: async (request: {
    portfolioId: number
    schemeCode: string
    transactionDate: string
    transactionType: 'BUY'
    units: number
    pricePerUnit: number
    makingCharges?: number
    itemName?: string
    description?: string
  }): Promise<any> => {
    const payload = {
      schemeCode: request.schemeCode,
      transactionDate: request.transactionDate,
      transactionType: 'METAL_BUY',
      quantity: request.units,
      price: request.pricePerUnit,
      makingCharges: request.makingCharges || 0,
      itemName: request.itemName,
      description: request.description
    }
    const response = await apiClient.post(
      `/portfolios/${request.portfolioId}/metals/transactions`, 
      payload
    )
    return response.data
  },

  /**
   * Add a metal sell transaction
   */
  addSellTransaction: async (request: {
    portfolioId: number
    schemeCode: string
    transactionDate: string
    transactionType: 'SELL'
    units: number
    pricePerUnit: number
    itemName?: string
    description?: string
  }): Promise<any> => {
    const payload = {
      schemeCode: request.schemeCode,
      transactionDate: request.transactionDate,
      transactionType: 'METAL_SELL',
      quantity: request.units,
      price: request.pricePerUnit,
      itemName: request.itemName,
      description: request.description
    }
    const response = await apiClient.post(
      `/portfolios/${request.portfolioId}/metals/transactions`,
      payload
    )
    return response.data
  }
}

// Export as metalApi (lowercase) for consistency with other services
export const metalApi = MetalApi

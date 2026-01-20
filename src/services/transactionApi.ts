import { apiClient } from './api'

export interface TransactionRequest {
  isin: string
  folioNumber: string
  transactionDate: string
  transactionType: string
  units?: number
  amount?: number
  pricePerShare?: number
  brokerage?: number
  description?: string
}

export interface Transaction {
  id: number
  transactionDate: string
  transactionType: string
  description: string
  units: number
  nav: number
  amount: number
  brokerage?: number
  folioNumber: string
  schemeName: string
  isin?: string
  assetType?: 'MUTUAL_FUND' | 'EQUITY_STOCK'
}

export const TransactionAPI = {
  /**
   * Get all transactions for a portfolio
   */
  getTransactions: async (portfolioId: number): Promise<Transaction[]> => {
    const response = await apiClient.get('/transactions', {
      params: { portfolioId }
    })
    return response.data
  },

  /**
   * Update an existing transaction
   */
  updateTransaction: async (
    transactionId: number,
    portfolioId: number,
    data: TransactionRequest
  ): Promise<Transaction> => {
    const response = await apiClient.put(
      `/transactions/${transactionId}`,
      data,
      {
        params: { portfolioId }
      }
    )
    return response.data
  },

  /**
   * Delete a transaction
   */
  deleteTransaction: async (
    transactionId: number,
    portfolioId: number
  ): Promise<{ message: string }> => {
    const response = await apiClient.delete(`/transactions/${transactionId}`, {
      params: { portfolioId }
    })
    return response.data
  }
}

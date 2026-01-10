import { apiClient } from './api'
import { PortfolioSummaryResponse, Portfolio, CreatePortfolioRequest, UpdatePortfolioRequest } from '../types/portfolio'

// Transform date arrays from backend to ISO strings
function transformPortfolio(portfolio: any): Portfolio {
  const toISOString = (dateArray: number[] | string): string => {
    if (typeof dateArray === 'string') return dateArray
    if (Array.isArray(dateArray) && dateArray.length >= 3) {
      const [year, month, day, hour = 0, minute = 0, second = 0] = dateArray
      return new Date(year, month - 1, day, hour, minute, second).toISOString()
    }
    return new Date().toISOString()
  }

  return {
    ...portfolio,
    createdAt: toISOString(portfolio.createdAt),
    updatedAt: toISOString(portfolio.updatedAt),
  }
}

export class PortfolioAPI {
  static async getComprehensiveSummary(portfolioId: number): Promise<PortfolioSummaryResponse> {
    const response = await apiClient.get<PortfolioSummaryResponse>(`/portfolios/${portfolioId}/summary`)
    return response.data
  }

  // Alias for backward compatibility
  static async getPortfolioSummary(portfolioId: number): Promise<any> {
    const response = await apiClient.get<any>(`/portfolios/${portfolioId}/summary`)
    return response.data
  }

  static async checkHealth(): Promise<{ casFileCheck: { healthy: boolean } }> {
    const response = await apiClient.get<{ casFileCheck: { healthy: boolean } }>('/portfolio/health')
    return response.data
  }
  
  // Portfolio Management APIs
  static async listPortfolios(): Promise<Portfolio[]> {
    const response = await apiClient.get<any[]>('/portfolios')
    return response.data.map(transformPortfolio)
  }
  
  static async createPortfolio(data: CreatePortfolioRequest): Promise<Portfolio> {
    const response = await apiClient.post<any>('/portfolios', data)
    return transformPortfolio(response.data)
  }
  
  static async updatePortfolio(id: number, data: UpdatePortfolioRequest): Promise<Portfolio> {
    const response = await apiClient.put<any>(`/portfolios/${id}`, data)
    return transformPortfolio(response.data)
  }
  
  static async deletePortfolio(id: number): Promise<void> {
    await apiClient.delete(`/portfolios/${id}`)
  }
  
  static async setPrimaryPortfolio(id: number): Promise<Portfolio> {
    const response = await apiClient.post<any>(`/portfolios/${id}/set-primary`)
    return transformPortfolio(response.data)
  }
  
  static async importCAS(portfolioId: number, casData: any): Promise<any> {
    const response = await apiClient.post(`/portfolios/${portfolioId}/import-cas`, casData)
    return response.data
  }

  static async parsePDF(file: File, password?: string): Promise<any> {
    const formData = new FormData()
    formData.append('file', file)
    if (password) {
      formData.append('password', password)
    }
    
    console.log('Sending PDF parse request:', { fileName: file.name, hasPassword: !!password })
    
    const { data } = await apiClient.post('/cas/parse', formData)
    
    console.log('Parse response:', data)
    
    // Extract the data field from the parse response
    return data.data
  }

  // Get transactions for a specific folio
  static async getFolioTransactions(portfolioId: number, folioNumber: string, isin?: string): Promise<any[]> {
    const url = `/portfolios/${portfolioId}/folios/${encodeURIComponent(folioNumber)}/transactions${
      isin ? `?isin=${encodeURIComponent(isin)}` : ''
    }`
    const response = await apiClient.get<any[]>(url)
    return response.data
  }

  // Get portfolio value at a specific date
  static async getPortfolioValue(portfolioId: number, date: string): Promise<{ portfolioId: number; date: string; totalValue: number }> {
    const response = await apiClient.get<{ portfolioId: number; date: string; totalValue: number }>(
      `/portfolio-value/${portfolioId}?date=${date}`
    )
    return response.data
  }

  // Get portfolio value history (time series)
  static async getPortfolioValueHistory(
    portfolioId: number,
    startDate: string,
    endDate: string
  ): Promise<{ portfolioId: number; startDate: string; endDate: string; dataPoints: Array<{ date: string; value: number }> }> {
    const response = await apiClient.get(
      `/portfolio-value/${portfolioId}/history?startDate=${startDate}&endDate=${endDate}`
    )
    return response.data
  }

  // Get complete portfolio value history (all time)
  static async getCompletePortfolioHistory(
    portfolioId: number
  ): Promise<{ portfolioId: number; dataPoints: Array<{ date: string; value: number }> }> {
    const response = await apiClient.get(
      `/portfolio-value/${portfolioId}/complete-history`
    )
    return response.data
  }
}

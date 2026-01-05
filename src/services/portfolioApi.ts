import { PortfolioSummaryResponse } from '../types/portfolio'

const API_BASE_URL = 'http://localhost:8080/api/portfolio'

export class PortfolioAPI {
  static async getComprehensiveSummary(pan: string): Promise<PortfolioSummaryResponse> {
    const response = await fetch(`${API_BASE_URL}/db-summary?pan=${pan}`)
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Portfolio not found for PAN: ${pan}`)
      }
      throw new Error('Failed to fetch portfolio data')
    }
    
    return response.json()
  }

  static async checkHealth(): Promise<{ casFileCheck: { healthy: boolean } }> {
    const response = await fetch(`${API_BASE_URL}/health`)
    
    if (!response.ok) {
      throw new Error('Health check failed')
    }
    
    return response.json()
  }
}

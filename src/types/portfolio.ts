// API Response Types
export interface PortfolioOverview {
  total_invested: number
  current_value: number
  realized_profit_loss: number
  unrealized_profit_loss: number
  total_profit_loss: number
  unrealized_profit_loss_percentage: number
}

export interface FolioData {
  folio_number: string
  total_invested: number
  current_value: number
  realized_profit_loss: number
  unrealized_profit_loss: number
  total_profit_loss: number
  unrealized_profit_loss_percentage: number
  total_units_purchased: number
  total_units_sold: number
  current_units: number
}

export interface FundData {
  isin: string
  scheme_name: string
  amc: string
  scheme_type: string
  folios: FolioData[]
}

export interface PortfolioSummaryResponse {
  portfolio_overview: PortfolioOverview
  funds: FundData[]
}

// UI Display Types
export interface MutualFund {
  id: string
  name: string
  category: string
  currentValue: number
  invested: number
  returns: number
  returnsPercentage: number
  nav: number
  units: number
  aum: string
  expenseRatio: number
  riskLevel: 'Low' | 'Medium' | 'High'
  oneDayChange: number
  oneMonthReturn: number
  threeMonthReturn: number
  oneYearReturn: number
  threeYearReturn: number
  folioNumbers: string[]
  isin: string
  amc: string
}

export interface PortfolioStats {
  totalInvested: number
  currentValue: number
  totalReturns: number
  returnsPercentage: number
  todayGainLoss: number
  todayGainLossPercentage: number
}

// Portfolio Management Types
export interface Portfolio {
  id: number
  portfolioName: string
  pan: string
  description?: string
  isPrimary: boolean
  createdAt: string
  updatedAt: string
}

export interface CreatePortfolioRequest {
  portfolioName: string
  pan: string
  description?: string
  isPrimary: boolean
}

export interface UpdatePortfolioRequest {
  portfolioName: string
  pan: string
  description?: string
  isPrimary: boolean
}

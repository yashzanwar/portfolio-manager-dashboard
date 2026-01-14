// Combined Portfolio Types

export interface CombinedPortfolioInfo {
  id: number
  name: string
  pan: string
  total_invested: number
  current_value: number
  realized_profit_loss: number
  unrealized_profit_loss: number
  total_profit_loss: number
  unrealized_profit_loss_percentage: number
}

export interface CombinedOverallSummary {
  total_invested: number
  current_value: number
  realized_profit_loss: number
  unrealized_profit_loss: number
  total_profit_loss: number
  unrealized_profit_loss_percentage: number
  total_folios: number
  total_schemes: number
}

export interface FolioWithPortfolio {
  folio_number: string
  portfolio_id: number
  portfolio_name: string
  units: number
  current_value: number
  total_invested: number
  realized_profit_loss: number
  unrealized_profit_loss: number
  total_profit_loss: number
  unrealized_profit_loss_percentage: number
  total_units_purchased: number
  total_units_sold: number
  current_units: number
}

export interface PortfolioBreakdown {
  portfolio_id: number
  portfolio_name: string
  total_invested: number
  current_value: number
  unrealized_profit_loss: number
  current_units: number
  folio_count: number
}

export interface CombinedFundDetail {
  isin: string
  scheme_name: string
  amc: string
  scheme_type: string
  total_invested: number
  current_value: number
  realized_profit_loss: number
  unrealized_profit_loss: number
  total_profit_loss: number
  unrealized_profit_loss_percentage: number
  total_units_purchased: number
  total_units_sold: number
  current_units: number
  portfolio_breakdown: PortfolioBreakdown[]
  folios: FolioWithPortfolio[]
}

export interface CombinedPortfolioSummary {
  mode: 'single' | 'combined'
  portfolio_count: number
  portfolios: CombinedPortfolioInfo[]
  overall: CombinedOverallSummary
  funds: CombinedFundDetail[]
}

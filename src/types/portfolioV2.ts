// Portfolio V2 API Types
import { MetalHoldingV2 } from './metal'

export interface OverviewV2 {
  total_invested: number
  current_value: number
  realized_profit_loss: number
  unrealized_profit_loss: number
  total_profit_loss: number
  total_profit_loss_percentage: number
  unrealized_profit_loss_percentage: number
  realized_profit_loss_percentage: number
}

export interface AssetTypeBreakdownV2 {
  total_invested: number
  current_value: number
  unrealized_gains: number
  realized_gains: number
  total_gains: number
  returns_percentage: number
  holding_count: number
}

// Single Portfolio Response
export interface SinglePortfolioSummaryV2 {
  investor_name: string
  portfolio_id: number
  portfolio_name: string
  overview: OverviewV2
  breakdown_by_asset_type: {
    [key: string]: AssetTypeBreakdownV2 // e.g., "MUTUAL_FUND", "STOCK"
  }
  holdings?: HoldingsDataV2
}

// Multi Portfolio Response
export interface MultiPortfolioSummaryV2 {
  investor_name: string
  portfolio_ids: number[]
  total_portfolios: number
  portfolios?: PortfolioInfoV2[]
  aggregate_overview: OverviewV2
  breakdown_by_asset_type: {
    [key: string]: AssetTypeBreakdownV2
  }
  holdings?: HoldingsDataV2
}

// Union type for both responses
export type PortfolioSummaryV2 = SinglePortfolioSummaryV2 | MultiPortfolioSummaryV2

// Type guard to check if it's a single portfolio response
export function isSinglePortfolio(summary: PortfolioSummaryV2): summary is SinglePortfolioSummaryV2 {
  return 'portfolio_id' in summary
}

// Type guard to check if it's a multi portfolio response
export function isMultiPortfolio(summary: PortfolioSummaryV2): summary is MultiPortfolioSummaryV2 {
  return 'portfolio_ids' in summary
}

// Portfolio Info for multi-portfolio response
export interface PortfolioInfoV2 {
  id: number
  name: string
  pan: string
  total_invested: number
  current_value: number
  realized_profit_loss: number
  unrealized_profit_loss: number
  total_profit_loss: number
  realized_profit_loss_percentage: number
  unrealized_profit_loss_percentage: number
  total_profit_loss_percentage: number
}

// Holdings Data Container
export interface HoldingsDataV2 {
  mutual_funds?: MutualFundHoldingV2[]
  stocks?: StockHoldingV2[]
  metals?: MetalHoldingV2[]
}

// Mutual Fund Holding
export interface MutualFundHoldingV2 {
  scheme_id: number
  isin: string
  scheme_name: string
  amc: string
  scheme_type: string
  folio_number: string
  portfolio_id: number
  portfolio_name: string
  total_invested: number
  current_value: number
  realized_profit_loss: number
  unrealized_profit_loss: number
  total_profit_loss: number
  realized_profit_loss_percentage: number
  unrealized_profit_loss_percentage: number
  total_profit_loss_percentage: number
  current_units: number
  average_nav: number
  current_nav?: number
}

// Stock Holding
export interface StockHoldingV2 {
  symbol: string
  company_name: string
  exchange: string
  isin?: string
  portfolio_id: number
  portfolio_name: string
  total_invested: number
  current_value: number
  realized_profit_loss: number
  unrealized_profit_loss: number
  total_profit_loss: number
  realized_profit_loss_percentage: number
  unrealized_profit_loss_percentage: number
  total_profit_loss_percentage: number
  quantity: number
  average_price: number
  current_price?: number
  sector?: string
}

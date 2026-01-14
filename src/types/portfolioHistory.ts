// Portfolio Value History Types

export interface HistoryDataPoint {
  date: number[] // [year, month, day]
  value: number
  scheme_breakdown: any | null
}

export interface PortfolioHistory {
  id: number
  name: string
  data_points: HistoryDataPoint[]
}

export interface HistoryData {
  data_points: HistoryDataPoint[]
}

export interface CombinedPortfolioHistory {
  mode: 'single' | 'combined'
  portfolio_count: number
  start_date?: number[] // [year, month, day] - optional, only in complete-history
  end_date?: number[] // [year, month, day] - optional, only in complete-history
  combined: HistoryData
  portfolios: PortfolioHistory[]
}

export type DateRangeOption = '7d' | '30d' | '90d' | '1y' | 'all'

export interface DateRange {
  label: string
  value: DateRangeOption
  days?: number
}

// Metal Types for Precious Metals (Gold, Silver, Platinum)

export type MetalType = 'GOLD' | 'SILVER' | 'PLATINUM'
export type GoldPurity = '24K' | '22K' | '18K'
export type SilverPurity = '.999' | '.925'
export type MetalTransactionType = 'METAL_BUY' | 'METAL_SELL'

export interface MetalScheme {
  schemeCode: string
  schemeName: string
  metalType: MetalType
  purity: string
  unit: string
  currentPrice?: number
}

export interface MetalHoldingV2 {
  scheme_code: string
  scheme_name: string
  metal_type: MetalType
  purity: string
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
  current_quantity: number // grams (from backend)
  quantity?: number // alias for current_quantity for UI compatibility
  average_price: number // per gram
  current_price?: number // per gram
  making_charges?: number
}

export interface MetalTransactionRequest {
  schemeCode: string
  folioNumber?: string // Optional custom name (e.g., "JADAU_BANGLE")
  transactionDate: string
  transactionType: MetalTransactionType
  units: number // grams
  pricePerGram: number
  makingCharges?: number
  description?: string
}

export interface MetalPriceResponse {
  [schemeCode: string]: number // e.g., "GOLD_24K": 6545.50
}

export interface MetalTransaction {
  id: number
  portfolioId: number
  folioNumber: string
  schemeCode: string
  schemeName: string
  metalType: MetalType
  purity: string
  transactionDate: string
  transactionType: MetalTransactionType
  units: number
  pricePerGram: number
  makingCharges: number
  amount: number
  description?: string
  createdAt: string
}

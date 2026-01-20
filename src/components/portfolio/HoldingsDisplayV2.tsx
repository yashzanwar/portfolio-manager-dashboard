import { useState } from 'react'
import { TrendingUp, TrendingDown, ChevronDown, ChevronRight } from 'lucide-react'
import { HoldingsDataV2, MutualFundHoldingV2, StockHoldingV2 } from '../../types/portfolioV2'

interface HoldingsDisplayV2Props {
  holdings: HoldingsDataV2
  showMutualFunds?: boolean
  showStocks?: boolean
}

interface AggregatedStock {
  symbol: string
  company_name: string
  exchange: string
  isin?: string
  total_invested: number
  current_value: number
  realized_profit_loss: number
  unrealized_profit_loss: number
  total_profit_loss: number
  total_profit_loss_percentage: number
  quantity: number
  average_price: number
  current_price?: number
  holdings: StockHoldingV2[]
}

interface AggregatedMutualFund {
  scheme_id: number
  isin: string
  scheme_name: string
  amc: string
  scheme_type: string
  total_invested: number
  current_value: number
  realized_profit_loss: number
  unrealized_profit_loss: number
  total_profit_loss: number
  total_profit_loss_percentage: number
  current_units: number
  average_nav: number
  current_nav?: number
  holdings: MutualFundHoldingV2[]
}

export function HoldingsDisplayV2({ 
  holdings, 
  showMutualFunds = true, 
  showStocks = true 
}: HoldingsDisplayV2Props) {
  const [expandedStocks, setExpandedStocks] = useState<Set<string>>(new Set())
  const [expandedMFs, setExpandedMFs] = useState<Set<string>>(new Set())
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
  }

  const renderProfitLoss = (value: number, percentage: number) => {
    const isPositive = value >= 0
    return (
      <div className={`flex items-center gap-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
        <span className="font-medium">{formatCurrency(value)}</span>
        <span className="text-sm">({formatPercentage(percentage)})</span>
      </div>
    )
  }

  // Aggregate stocks by symbol
  const aggregateStocks = (stocks: StockHoldingV2[]): AggregatedStock[] => {
    const stockMap = new Map<string, AggregatedStock>()
    
    stocks.forEach(stock => {
      const existing = stockMap.get(stock.symbol)
      
      if (existing) {
        // Aggregate
        existing.total_invested += stock.total_invested
        existing.current_value += stock.current_value
        existing.realized_profit_loss += stock.realized_profit_loss
        existing.unrealized_profit_loss += stock.unrealized_profit_loss
        existing.total_profit_loss += stock.total_profit_loss
        existing.quantity += stock.quantity
        existing.holdings.push(stock)
        
        // Recalculate weighted average price
        const totalCost = existing.holdings.reduce((sum, h) => sum + (h.quantity * h.average_price), 0)
        existing.average_price = totalCost / existing.quantity
        
        // Recalculate percentage
        if (existing.total_invested > 0) {
          existing.total_profit_loss_percentage = (existing.total_profit_loss / existing.total_invested) * 100
        }
      } else {
        // Create new aggregated entry
        stockMap.set(stock.symbol, {
          symbol: stock.symbol,
          company_name: stock.company_name,
          exchange: stock.exchange,
          isin: stock.isin,
          total_invested: stock.total_invested,
          current_value: stock.current_value,
          realized_profit_loss: stock.realized_profit_loss,
          unrealized_profit_loss: stock.unrealized_profit_loss,
          total_profit_loss: stock.total_profit_loss,
          total_profit_loss_percentage: stock.total_profit_loss_percentage,
          quantity: stock.quantity,
          average_price: stock.average_price,
          current_price: stock.current_price,
          holdings: [stock]
        })
      }
    })
    
    return Array.from(stockMap.values())
  }

  // Aggregate mutual funds by ISIN
  const aggregateMutualFunds = (funds: MutualFundHoldingV2[]): AggregatedMutualFund[] => {
    const fundMap = new Map<string, AggregatedMutualFund>()
    
    funds.forEach(fund => {
      const existing = fundMap.get(fund.isin)
      
      if (existing) {
        // Aggregate
        existing.total_invested += fund.total_invested
        existing.current_value += fund.current_value
        existing.realized_profit_loss += fund.realized_profit_loss
        existing.unrealized_profit_loss += fund.unrealized_profit_loss
        existing.total_profit_loss += fund.total_profit_loss
        existing.current_units += fund.current_units
        existing.holdings.push(fund)
        
        // Recalculate weighted average NAV
        const totalCost = existing.holdings.reduce((sum, h) => sum + (h.current_units * h.average_nav), 0)
        existing.average_nav = totalCost / existing.current_units
        
        // Recalculate percentage
        if (existing.total_invested > 0) {
          existing.total_profit_loss_percentage = (existing.total_profit_loss / existing.total_invested) * 100
        }
      } else {
        // Create new aggregated entry
        fundMap.set(fund.isin, {
          scheme_id: fund.scheme_id,
          isin: fund.isin,
          scheme_name: fund.scheme_name,
          amc: fund.amc,
          scheme_type: fund.scheme_type,
          total_invested: fund.total_invested,
          current_value: fund.current_value,
          realized_profit_loss: fund.realized_profit_loss,
          unrealized_profit_loss: fund.unrealized_profit_loss,
          total_profit_loss: fund.total_profit_loss,
          total_profit_loss_percentage: fund.total_profit_loss_percentage,
          current_units: fund.current_units,
          average_nav: fund.average_nav,
          current_nav: fund.current_nav,
          holdings: [fund]
        })
      }
    })
    
    return Array.from(fundMap.values())
  }

  const toggleStockExpansion = (symbol: string) => {
    setExpandedStocks(prev => {
      const newSet = new Set(prev)
      if (newSet.has(symbol)) {
        newSet.delete(symbol)
      } else {
        newSet.add(symbol)
      }
      return newSet
    })
  }

  const toggleMFExpansion = (isin: string) => {
    setExpandedMFs(prev => {
      const newSet = new Set(prev)
      if (newSet.has(isin)) {
        newSet.delete(isin)
      } else {
        newSet.add(isin)
      }
      return newSet
    })
  }

  const aggregatedStocks = holdings.stocks ? aggregateStocks(holdings.stocks) : []
  const aggregatedMFs = holdings.mutual_funds ? aggregateMutualFunds(holdings.mutual_funds) : []

  return (
    <div className="space-y-6">
      {/* Mutual Funds Section */}
      {showMutualFunds && aggregatedMFs.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
            Mutual Funds ({aggregatedMFs.length})
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase w-8"></th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">Scheme</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">Invested</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">Current</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">Total P/L</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">Units</th>
                </tr>
              </thead>
              <tbody>
                {aggregatedMFs.map((fund: AggregatedMutualFund) => {
                  const isExpanded = expandedMFs.has(fund.isin)
                  const hasMultipleHoldings = fund.holdings.length > 1
                  
                  return (
                    <>
                      {/* Aggregated Row */}
                      <tr 
                        key={fund.isin}
                        className={`border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 ${hasMultipleHoldings ? 'cursor-pointer' : ''}`}
                        onClick={() => hasMultipleHoldings && toggleMFExpansion(fund.isin)}
                      >
                        <td className="px-4 py-3">
                          {hasMultipleHoldings && (
                            isExpanded ? 
                              <ChevronDown className="w-4 h-4 text-gray-500" /> : 
                              <ChevronRight className="w-4 h-4 text-gray-500" />
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">{fund.scheme_name}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {fund.amc}
                              {hasMultipleHoldings && <span className="ml-2 text-blue-600 dark:text-blue-400">({fund.holdings.length} holdings)</span>}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-white">
                          {formatCurrency(fund.total_invested)}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-white">
                          {formatCurrency(fund.current_value)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {renderProfitLoss(fund.total_profit_loss, fund.total_profit_loss_percentage)}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">
                          {fund.current_units.toFixed(3)}
                        </td>
                      </tr>
                      
                      {/* Expanded Portfolio-Level Holdings */}
                      {isExpanded && hasMultipleHoldings && fund.holdings.map((holding, idx) => (
                        <tr 
                          key={`${fund.isin}-${holding.portfolio_id}-${idx}`}
                          className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-800"
                        >
                          <td className="px-4 py-2"></td>
                          <td className="px-4 py-2 pl-8">
                            <div className="text-sm text-gray-700 dark:text-gray-300">
                              <span className="font-medium">{holding.portfolio_name}</span>
                              <span className="text-gray-500 dark:text-gray-400"> • Folio: {holding.folio_number}</span>
                            </div>
                          </td>
                          <td className="px-4 py-2 text-right text-sm text-gray-700 dark:text-gray-300">
                            {formatCurrency(holding.total_invested)}
                          </td>
                          <td className="px-4 py-2 text-right text-sm text-gray-700 dark:text-gray-300">
                            {formatCurrency(holding.current_value)}
                          </td>
                          <td className="px-4 py-2 text-right text-sm">
                            {renderProfitLoss(holding.total_profit_loss, holding.total_profit_loss_percentage)}
                          </td>
                          <td className="px-4 py-2 text-right text-sm text-gray-700 dark:text-gray-300">
                            {holding.current_units.toFixed(3)}
                          </td>
                        </tr>
                      ))}
                    </>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Stocks Section */}
      {showStocks && aggregatedStocks.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
            Stocks ({aggregatedStocks.length})
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase w-8"></th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">Stock</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">Invested</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">Current</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">Total P/L</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">Qty</th>
                </tr>
              </thead>
              <tbody>
                {aggregatedStocks.map((stock: AggregatedStock) => {
                  const isExpanded = expandedStocks.has(stock.symbol)
                  const hasMultipleHoldings = stock.holdings.length > 1
                  
                  return (
                    <>
                      {/* Aggregated Row */}
                      <tr 
                        key={stock.symbol}
                        className={`border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 ${hasMultipleHoldings ? 'cursor-pointer' : ''}`}
                        onClick={() => hasMultipleHoldings && toggleStockExpansion(stock.symbol)}
                      >
                        <td className="px-4 py-3">
                          {hasMultipleHoldings && (
                            isExpanded ? 
                              <ChevronDown className="w-4 h-4 text-gray-500" /> : 
                              <ChevronRight className="w-4 h-4 text-gray-500" />
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">{stock.symbol}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {stock.company_name} • {stock.exchange}
                              {hasMultipleHoldings && <span className="ml-2 text-blue-600 dark:text-blue-400">({stock.holdings.length} portfolios)</span>}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-white">
                          {formatCurrency(stock.total_invested)}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-white">
                          {formatCurrency(stock.current_value)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {renderProfitLoss(stock.total_profit_loss, stock.total_profit_loss_percentage)}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">
                          {stock.quantity.toFixed(2)}
                        </td>
                      </tr>
                      
                      {/* Expanded Portfolio-Level Holdings */}
                      {isExpanded && hasMultipleHoldings && stock.holdings.map((holding, idx) => (
                        <tr 
                          key={`${stock.symbol}-${holding.portfolio_id}-${idx}`}
                          className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-800"
                        >
                          <td className="px-4 py-2"></td>
                          <td className="px-4 py-2 pl-8">
                            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              {holding.portfolio_name}
                            </div>
                          </td>
                          <td className="px-4 py-2 text-right text-sm text-gray-700 dark:text-gray-300">
                            {formatCurrency(holding.total_invested)}
                          </td>
                          <td className="px-4 py-2 text-right text-sm text-gray-700 dark:text-gray-300">
                            {formatCurrency(holding.current_value)}
                          </td>
                          <td className="px-4 py-2 text-right text-sm">
                            {renderProfitLoss(holding.total_profit_loss, holding.total_profit_loss_percentage)}
                          </td>
                          <td className="px-4 py-2 text-right text-sm text-gray-700 dark:text-gray-300">
                            {holding.quantity.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {aggregatedMFs.length === 0 && aggregatedStocks.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No holdings data available
        </div>
      )}
    </div>
  )
}

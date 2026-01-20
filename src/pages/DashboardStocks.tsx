import DashboardHoldings from './DashboardHoldings'
import { formatCurrency, formatNumber, formatPercentage } from '../utils/formatters'
import { TrendingUp, TrendingDown } from 'lucide-react'

export default function DashboardStocks() {
  return (
    <DashboardHoldings
      assetType="EQUITY_STOCK"
      title="Stock Holdings"
      emptyMessage="No stocks found. Add your first stock transaction to get started."
      showChart={false}
      columns={[
        {
          header: 'Stock',
          key: 'displayName',
          align: 'left'
        },
        {
          header: 'Shares',
          key: 'quantity',
          align: 'center',
          format: (value) => formatNumber(value)
        },
        {
          header: 'Avg Buy Price',
          key: 'average_price',
          align: 'center',
          format: (value) => formatCurrency(value)
        },
        {
          header: 'Current Price',
          key: 'current_price',
          align: 'center',
          format: (value) => formatCurrency(value)
        },
        {
          header: 'Invested',
          key: 'totalInvested',
          align: 'center',
          format: (value) => formatCurrency(value)
        },
        {
          header: 'Current Value',
          key: 'currentValue',
          align: 'center',
          format: (value) => formatCurrency(value)
        },
        {
          header: 'P&L',
          key: 'totalProfitLoss',
          align: 'center',
          format: (value, holding) => {
            const percentage = holding.totalProfitLossPercentage ?? holding.total_profit_loss_percentage ?? 0
            return (
              <div className="text-center">
                <div className={`font-medium ${value >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {formatCurrency(value)}
                </div>
                <div className={`text-xs flex items-center justify-center gap-1 ${percentage >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {percentage >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {formatPercentage(percentage)}
                </div>
              </div>
            )
          }
        },
        {
          header: 'Actions',
          key: 'actions',
          align: 'center'
        }
      ]}
      getIdentifier={(holding) => holding.isin || holding.symbol}
      getDisplayName={(holding) => holding.company_name}
      getSubtitle={(holding) => `${holding.symbol} • ${holding.isin || holding.exchange}`}
    />
  )
}

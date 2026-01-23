import DashboardHoldings from './DashboardHoldings'
import { formatCurrency, formatNumber, formatPercentage } from '../utils/formatters'

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
          align: 'left',
          showBorderRight: true
        },
        {
          header: 'Qty.',
          key: 'quantity',
          align: 'right',
          format: (value) => formatNumber(value)
        },
        {
          header: 'Avg. cost',
          key: 'average_price',
          align: 'right',
          format: (value) => formatCurrency(value)
        },
        {
          header: 'LTP',
          key: 'current_price',
          align: 'right',
          format: (value) => formatCurrency(value),
          showBorderRight: true
        },
        {
          header: 'Invested',
          key: 'totalInvested',
          align: 'right',
          format: (value) => formatCurrency(value)
        },
        {
          header: 'Cur. val',
          key: 'currentValue',
          align: 'right',
          format: (value) => formatCurrency(value),
          showBorderRight: true
        },
        {
          header: 'P&L',
          key: 'totalProfitLoss',
          align: 'right',
          format: (value) => (
            <span className={`font-medium ${value >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {formatCurrency(value)}
            </span>
          )
        },
        {
          header: 'XIRR',
          key: 'xirr',
          align: 'right',
          format: (value) => {
            if (value === null || value === undefined || Math.abs(value) > 1000) {
              return <span className="text-gray-500">—</span>
            }
            return (
              <span className={`${value >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {formatPercentage(value)}
              </span>
            )
          },
          showBorderRight: true
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

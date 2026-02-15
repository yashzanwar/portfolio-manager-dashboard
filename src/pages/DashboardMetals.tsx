import DashboardHoldings from './DashboardHoldings'
import { formatCurrency, formatNumber, formatPercentage } from '../utils/formatters'

export default function DashboardMetals() {
  return (
    <DashboardHoldings
      assetType="PRECIOUS_METAL"
      title="Precious Metals Holdings"
      emptyMessage="No precious metals found. Add your first gold or silver transaction to get started."
      showChart={true}
      columns={[
        {
          header: 'Item',
          key: 'displayName',
          align: 'left',
          showBorderRight: true
        },
        {
          header: 'Qty. (g)',
          key: 'current_quantity',
          align: 'right',
          format: (value) => formatNumber(value, 3) // 3 decimals for grams
        },
        {
          header: 'Avg. price',
          key: 'average_price',
          align: 'right',
          format: (value) => formatCurrency(value)
        },
        {
          header: 'Cur. price',
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
          header: '1D P&L',
          key: 'one_day_profit_loss',
          align: 'right',
          format: (value) => (
            <span className={`font-medium ${value >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {formatCurrency(value || 0)}
            </span>
          )
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
      getIdentifier={(holding) => holding.scheme_code}
      getDisplayName={(holding) => {
        // Extract metal type and purity from scheme code (e.g., "GOLD_22K" -> "GOLD 22K")
        const metalInfo = holding.scheme_code.replace('_', ' ')
        
        // If folio_number exists and is not a generic "METAL_" prefix, use it as item name
        if (holding.folio_number && !holding.folio_number.startsWith('METAL_')) {
          return `${metalInfo} - ${holding.folio_number}`
        }
        
        // Otherwise just show metal info
        return metalInfo
      }}
      getSubtitle={(holding) => {
        // Show purity and current quantity (e.g., "22K • 177.220g")
        return `${holding.purity} • ${formatNumber(holding.current_quantity, 3)}g`
      }}
    />
  )
}

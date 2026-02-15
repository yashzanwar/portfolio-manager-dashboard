import DashboardHoldings from './DashboardHoldings'
import { formatCurrency, formatNumber, formatPercentage } from '../utils/formatters'
import { TrendingUp, TrendingDown } from 'lucide-react'

export default function DashboardMutualFunds() {
  return (
    <DashboardHoldings
      assetType="MUTUAL_FUND"
      title="Mutual Fund Holdings"
      emptyMessage="No mutual funds found. Add your first mutual fund transaction to get started."
      showChart={true}
      columns={[
        {
          header: 'Scheme',
          key: 'displayName',
          align: 'left',
          showBorderRight: true
        },
        {
          header: 'Units',
          key: 'current_units',
          align: 'right',
          format: (value) => formatNumber(value, 3)
        },
        {
          header: 'Avg NAV',
          key: 'average_nav',
          align: 'right',
          format: (value) => formatCurrency(value)
        },
        {
          header: 'Current NAV',
          key: 'current_nav',
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
          header: 'Current value',
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
      getIdentifier={(holding) => holding.isin}
      getDisplayName={(holding) => {
        const schemeName = holding.scheme_name || ''
        const firstHyphenIndex = schemeName.indexOf('-')
        return firstHyphenIndex > 0 ? schemeName.substring(0, firstHyphenIndex).trim() : schemeName
      }}
      getSubtitle={(holding) => `${holding.folio_number} • ${holding.amc}`}
    />
  )
}

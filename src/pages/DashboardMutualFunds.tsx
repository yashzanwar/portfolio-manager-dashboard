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
          align: 'left'
        },
        {
          header: 'Units',
          key: 'current_units',
          align: 'center',
          format: (value) => formatNumber(value, 3)
        },
        {
          header: 'Avg NAV',
          key: 'average_nav',
          align: 'center',
          format: (value) => formatCurrency(value)
        },
        {
          header: 'Current NAV',
          key: 'current_nav',
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
          header: 'P&L / XIRR',
          key: 'totalProfitLoss',
          align: 'center',
          format: (value, holding) => {
            const xirr = holding.xirr ?? 0
            return (
              <div className="text-center">
                <div className={`font-medium ${value >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {formatCurrency(value)}
                </div>
                <div className={`text-xs flex items-center justify-center gap-1 ${xirr >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {xirr >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {formatPercentage(xirr)}
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
      getIdentifier={(holding) => holding.isin}
      getDisplayName={(holding) => holding.scheme_name}
      getSubtitle={(holding) => `${holding.folio_number} • ${holding.amc}`}
    />
  )
}

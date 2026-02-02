import DashboardHoldings from './DashboardHoldings'
import { formatCurrency, formatPercentage, formatDate } from '../utils/formatters'

export default function DashboardFixedDeposits() {
  return (
    <DashboardHoldings
      assetType="FIXED_DEPOSIT"
      title="Fixed Deposits"
      emptyMessage="No fixed deposits found. Add your first FD to get started."
      showChart={true}
      columns={[
        {
          header: 'FD Details',
          key: 'displayName',
          align: 'left',
          showBorderRight: true
        },
        {
          header: 'Principal',
          key: 'principal',
          align: 'right',
          format: (value) => formatCurrency(value)
        },
        {
          header: 'Maturity Date',
          key: 'maturityDate',
          align: 'right',
          format: (value, holding) => {
            const maturityDate = holding.maturityDate || holding.maturity_date
            return maturityDate ? formatDate(maturityDate) : '—'
          },
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
          header: 'Total P&L',
          key: 'totalProfitLoss',
          align: 'right',
          format: (value, holding) => {
            const profitLoss = value || 0
            return (
              <span className={`${profitLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {formatCurrency(profitLoss)}
              </span>
            )
          }
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
          header: 'Status',
          key: 'status',
          align: 'center',
          format: (value, holding) => {
            const isClosed = holding.isClosed || false
            const isMatured = holding.maturityDate && new Date(holding.maturityDate) < new Date()
            
            if (isClosed) {
              return <span className="px-2 py-1 text-xs rounded-full bg-gray-700 text-gray-300">Closed</span>
            }
            if (isMatured) {
              return <span className="px-2 py-1 text-xs rounded-full bg-yellow-900/50 text-yellow-400">Matured</span>
            }
            return <span className="px-2 py-1 text-xs rounded-full bg-green-900/50 text-green-400">Active</span>
          }
        },
        {
          header: 'Actions',
          key: 'actions',
          align: 'center'
        }
      ]}
      getIdentifier={(holding) => holding.schemeCode || holding.scheme_code}
      getDisplayName={(holding) => {
        const bankName = holding.bankName || holding.bank_name || 'Bank'
        const fdName = holding.fdName || holding.scheme_name || `${bankName} FD`
        return fdName
      }}
      getSubtitle={(holding) => {
        const investDate = holding.investmentDate || holding.investment_date
        const maturityDate = holding.maturityDate || holding.maturity_date
        const rate = formatPercentage(holding.interestRate || holding.interest_rate || 0)
        const compounding = holding.compoundingFrequency || holding.compounding_frequency || 'QUARTERLY'
        
        const investDateStr = investDate ? formatDate(investDate) : '—'
        const maturityDateStr = maturityDate ? formatDate(maturityDate) : '—'
        
        return `${investDateStr} → ${maturityDateStr} • ${rate} • ${compounding}`
      }}
    />
  )
}

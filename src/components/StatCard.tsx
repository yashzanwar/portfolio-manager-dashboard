import { ArrowUpRight, ArrowDownRight } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string
  change?: number
  changeLabel?: string
  icon?: React.ReactNode
  iconBgColor?: string
  iconColor?: string
}

export function StatCard({ title, value, change, changeLabel, icon, iconBgColor, iconColor }: StatCardProps) {
  const isPositive = change !== undefined ? change >= 0 : true
  const defaultIconBg = 'bg-blue-100 dark:bg-blue-900/30'
  const defaultIconColor = 'text-blue-600 dark:text-blue-400'

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">{title}</p>
          <h3 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mt-2">
            {value}
          </h3>
        </div>
        {icon && (
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${iconBgColor || defaultIconBg} ${iconColor || defaultIconColor}`}>
            {icon}
          </div>
        )}
      </div>
      {change !== undefined && (
        <div className="mt-4 flex items-center gap-2">
          <span
            className={`flex items-center gap-1 text-sm font-semibold ${
              isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
            }`}
          >
            {isPositive ? (
              <ArrowUpRight className="w-4 h-4" />
            ) : (
              <ArrowDownRight className="w-4 h-4" />
            )}
            {Math.abs(change).toFixed(2)}%
          </span>
          {changeLabel && (
            <span className="text-sm text-gray-500 dark:text-gray-400">{changeLabel}</span>
          )}
        </div>
      )}
    </div>
  )
}

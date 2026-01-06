import React from 'react'
import { Portfolio } from '../../types/portfolio'
import { Card, CardHeader, CardContent, CardFooter } from '../common'
import { formatDate } from '../../utils/formatters'

interface PortfolioCardProps {
  portfolio: Portfolio
  onEdit: (portfolio: Portfolio) => void
  onDelete: (portfolio: Portfolio) => void
  onSetPrimary: (portfolio: Portfolio) => void
  onView: (portfolio: Portfolio) => void
}

export const PortfolioCard: React.FC<PortfolioCardProps> = ({
  portfolio,
  onEdit,
  onDelete,
  onSetPrimary,
  onView,
}) => {
  const maskPAN = (pan: string) => {
    if (pan.length !== 10) return pan
    return `${pan.substring(0, 4)}XXX${pan.substring(7)}`
  }

  return (
    <Card variant="bordered" className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {portfolio.portfolioName}
              </h3>
              {portfolio.isPrimary && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  Primary
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              PAN: {maskPAN(portfolio.pan)}
            </p>
            {portfolio.description && (
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                {portfolio.description}
              </p>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          <p>Created: {formatDate(portfolio.createdAt)}</p>
          <p className="mt-1">Updated: {formatDate(portfolio.updatedAt)}</p>
        </div>
      </CardContent>

      <CardFooter>
        <div className="flex gap-2">
          <button
            onClick={() => onView(portfolio)}
            className="flex-1 px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 border border-blue-600 dark:border-blue-400 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
          >
            View
          </button>
          <button
            onClick={() => onEdit(portfolio)}
            className="flex-1 px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Edit
          </button>
          {!portfolio.isPrimary && (
            <button
              onClick={() => onSetPrimary(portfolio)}
              className="flex-1 px-3 py-1.5 text-sm font-medium text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 border border-green-600 dark:border-green-400 rounded hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
            >
              Set Primary
            </button>
          )}
          <button
            onClick={() => onDelete(portfolio)}
            className="px-3 py-1.5 text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 border border-red-600 dark:border-red-400 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            Delete
          </button>
        </div>
      </CardFooter>
    </Card>
  )
}

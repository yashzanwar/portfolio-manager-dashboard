import React, { useState } from 'react'
import { Portfolio } from '../../types/portfolio'
import { Card, CardContent, CardFooter, Modal } from '../common'
import { formatDate } from '../../utils/formatters'

interface PortfolioCardProps {
  portfolio: Portfolio
  onEdit: (portfolio: Portfolio, e?: React.MouseEvent) => void
  onDelete: (portfolio: Portfolio, e?: React.MouseEvent) => void
  onSetPrimary: (portfolio: Portfolio, e?: React.MouseEvent) => void
  onView: (portfolio: Portfolio, e?: React.MouseEvent) => void
}

export const PortfolioCard: React.FC<PortfolioCardProps> = ({
  portfolio,
  onEdit,
  onDelete,
  onSetPrimary,
  onView,
}) => {
  const [showPrimaryConfirm, setShowPrimaryConfirm] = useState(false)

  const maskPAN = (pan: string) => {
    if (pan.length !== 10) return pan
    return `${pan.substring(0, 4)}XXX${pan.substring(7)}`
  }

  const handlePrimaryRadioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation()
    if (!portfolio.isPrimary) {
      setShowPrimaryConfirm(true)
    }
  }

  const confirmSetPrimary = () => {
    setShowPrimaryConfirm(false)
    onSetPrimary(portfolio)
  }

  return (
    <>
      <Card variant="bordered" className="hover:shadow-lg transition-shadow">
        <div className="mb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {portfolio.portfolioName}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                PAN: {maskPAN(portfolio.pan)}
              </p>
              {portfolio.description && (
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                  {portfolio.description}
                </p>
              )}
            </div>
            <div className="relative group flex-shrink-0 ml-4">
              <input
                type="radio"
                checked={portfolio.isPrimary}
                onChange={handlePrimaryRadioChange}
                className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 cursor-pointer"
              />
              <div className="absolute right-0 top-8 hidden group-hover:block bg-gray-900 text-white text-xs rounded py-1 px-2 whitespace-nowrap z-10">
                Set Primary
              </div>
            </div>
          </div>
        </div>

      <CardContent>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          <p>Created: {formatDate(portfolio.createdAt)}</p>
          <p className="mt-1">Updated: {formatDate(portfolio.updatedAt)}</p>
        </div>
      </CardContent>

      <CardFooter>
        <div className="flex gap-3">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onView(portfolio, e)
            }}
            className="flex-1 px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 border-2 border-blue-500 dark:border-blue-500 rounded-lg hover:bg-blue-500 hover:text-white dark:hover:bg-blue-500 dark:hover:text-white transition-all duration-200"
          >
            View
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onEdit(portfolio, e)
            }}
            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border-2 border-gray-400 dark:border-gray-500 rounded-lg hover:bg-gray-500 hover:text-white dark:hover:bg-gray-600 dark:hover:text-white transition-all duration-200"
          >
            Edit
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete(portfolio, e)
            }}
            className="flex-1 px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 border-2 border-red-500 dark:border-red-500 rounded-lg hover:bg-red-500 hover:text-white dark:hover:bg-red-500 dark:hover:text-white transition-all duration-200"
          >
            Delete
          </button>
        </div>
      </CardFooter>
    </Card>

    {/* Confirmation Modal for Setting Primary */}
    <Modal
      isOpen={showPrimaryConfirm}
      onClose={() => setShowPrimaryConfirm(false)}
      title="Set Primary Portfolio"
    >
      <div className="space-y-4">
        <p className="text-gray-700 dark:text-gray-300">
          Are you sure you want to make <strong>{portfolio.portfolioName}</strong> the primary portfolio?
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          This will replace the current primary portfolio.
        </p>
        <div className="flex gap-3 justify-end mt-6">
          <button
            onClick={() => setShowPrimaryConfirm(false)}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border-2 border-gray-400 dark:border-gray-500 rounded-lg hover:bg-gray-500 hover:text-white dark:hover:bg-gray-600 dark:hover:text-white transition-all duration-200"
          >
            Cancel
          </button>
          <button
            onClick={confirmSetPrimary}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 dark:bg-blue-500 border-2 border-blue-600 dark:border-blue-500 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-all duration-200"
          >
            Confirm
          </button>
        </div>
      </div>
    </Modal>
  </>
  )
}

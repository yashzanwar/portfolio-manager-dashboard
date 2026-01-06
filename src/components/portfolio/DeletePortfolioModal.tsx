import React, { useState } from 'react'
import { Modal, ModalFooter, Button, Input } from '../common'
import { Portfolio } from '../../types/portfolio'

interface DeletePortfolioModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
  portfolio: Portfolio | null
}

export const DeletePortfolioModal: React.FC<DeletePortfolioModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  portfolio,
}) => {
  const [confirmName, setConfirmName] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  const handleConfirm = async () => {
    if (confirmName === portfolio?.portfolioName) {
      setIsDeleting(true)
      try {
        await onConfirm()
        onClose()
        setConfirmName('')
      } catch (error) {
        // Error handled by mutation
      } finally {
        setIsDeleting(false)
      }
    }
  }

  const handleClose = () => {
    setConfirmName('')
    onClose()
  }

  if (!portfolio) return null

  const isConfirmValid = confirmName === portfolio.portfolioName

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="md">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
            <svg
              className="w-6 h-6 text-red-600 dark:text-red-400"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Delete Portfolio
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              This action cannot be undone
            </p>
          </div>
        </div>

        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-800 dark:text-red-200 mb-2">
            <strong>Warning:</strong> Deleting this portfolio will permanently remove:
          </p>
          <ul className="list-disc list-inside text-sm text-red-700 dark:text-red-300 space-y-1">
            <li>All associated folios and holdings</li>
            <li>All transaction history</li>
            <li>All imported CAS data</li>
          </ul>
        </div>

        <div className="mb-6">
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
            Portfolio to delete:{' '}
            <span className="font-semibold text-gray-900 dark:text-white">
              {portfolio.portfolioName}
            </span>
          </p>
          <Input
            label={`Type "${portfolio.portfolioName}" to confirm`}
            type="text"
            value={confirmName}
            onChange={(e) => setConfirmName(e.target.value)}
            placeholder={portfolio.portfolioName}
            required
          />
        </div>

        <ModalFooter>
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={handleConfirm}
            disabled={!isConfirmValid || isDeleting}
            isLoading={isDeleting}
          >
            Delete Portfolio
          </Button>
        </ModalFooter>
      </div>
    </Modal>
  )
}

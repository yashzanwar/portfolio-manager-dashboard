import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Modal, ModalFooter, Button, Input } from '../common'
import { Portfolio } from '../../types/portfolio'

const portfolioSchema = z.object({
  portfolioName: z.string()
    .min(3, 'Portfolio name must be at least 3 characters')
    .max(100, 'Portfolio name must not exceed 100 characters'),
  pan: z.string()
    .length(10, 'PAN must be exactly 10 characters')
    .regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN format (e.g., ABCDE1234F)'),
  description: z.string().optional(),
  isPrimary: z.boolean().default(false),
})

type PortfolioFormData = z.infer<typeof portfolioSchema>

interface PortfolioFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: PortfolioFormData) => Promise<void>
  portfolio?: Portfolio | null
  title: string
}

export const PortfolioFormModal: React.FC<PortfolioFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  portfolio,
  title,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<PortfolioFormData>({
    resolver: zodResolver(portfolioSchema),
    defaultValues: portfolio ? {
      portfolioName: portfolio.portfolioName,
      pan: portfolio.pan,
      description: portfolio.description || '',
      isPrimary: portfolio.isPrimary,
    } : {
      portfolioName: '',
      pan: '',
      description: '',
      isPrimary: false,
    },
  })

  useEffect(() => {
    if (isOpen) {
      reset(portfolio ? {
        portfolioName: portfolio.portfolioName,
        pan: portfolio.pan,
        description: portfolio.description || '',
        isPrimary: portfolio.isPrimary,
      } : {
        portfolioName: '',
        pan: '',
        description: '',
        isPrimary: false,
      })
    }
  }, [isOpen, portfolio, reset])

  const handleFormSubmit = async (data: PortfolioFormData) => {
    await onSubmit(data)
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <div className="p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          {title}
        </h2>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <Input
            label="Portfolio Name"
            type="text"
            placeholder="My Investment Portfolio"
            error={errors.portfolioName?.message}
            required
            {...register('portfolioName')}
          />

          <Input
            label="PAN"
            type="text"
            placeholder="ABCDE1234F"
            error={errors.pan?.message}
            helperText="10-character PAN in format: ABCDE1234F"
            required
            {...register('pan', {
              onChange: (e) => {
                e.target.value = e.target.value.toUpperCase()
              },
            })}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              {...register('description')}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Optional description for this portfolio"
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.description.message}
              </p>
            )}
          </div>

          <div className="flex items-center">
            <input
              id="isPrimary"
              type="checkbox"
              {...register('isPrimary')}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label
              htmlFor="isPrimary"
              className="ml-2 block text-sm text-gray-700 dark:text-gray-300"
            >
              Set as primary portfolio
            </label>
          </div>

          <ModalFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              disabled={isSubmitting}
            >
              {portfolio ? 'Update' : 'Create'} Portfolio
            </Button>
          </ModalFooter>
        </form>
      </div>
    </Modal>
  )
}

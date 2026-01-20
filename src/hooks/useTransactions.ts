import { useMutation, useQueryClient } from '@tanstack/react-query'
import { TransactionAPI, TransactionRequest } from '../services/transactionApi'
import toast from 'react-hot-toast'

/**
 * Hook to update a transaction
 */
export function useUpdateTransaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      transactionId,
      portfolioId,
      data
    }: {
      transactionId: number
      portfolioId: number
      data: TransactionRequest
    }) => TransactionAPI.updateTransaction(transactionId, portfolioId, data),
    
    onSuccess: () => {
      // Invalidate and refetch all relevant queries
      queryClient.invalidateQueries({ queryKey: ['transactions'], refetchType: 'active' })
      queryClient.invalidateQueries({ queryKey: ['portfolio-summary'], refetchType: 'active' })
      queryClient.invalidateQueries({ queryKey: ['portfolio-xirr'], refetchType: 'active' })
      queryClient.invalidateQueries({ queryKey: ['holdings'], refetchType: 'active' })
      queryClient.invalidateQueries({ queryKey: ['combined-portfolio'], refetchType: 'active' })
      queryClient.invalidateQueries({ queryKey: ['portfolio-value'], refetchType: 'active' })
      
      toast.success('Transaction updated successfully')
    },
    
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to update transaction'
      toast.error(message)
    }
  })
}

/**
 * Hook to delete a transaction
 */
export function useDeleteTransaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      transactionId,
      portfolioId
    }: {
      transactionId: number
      portfolioId: number
    }) => TransactionAPI.deleteTransaction(transactionId, portfolioId),
    
    onSuccess: () => {
      // Invalidate and refetch all relevant queries
      queryClient.invalidateQueries({ queryKey: ['transactions'], refetchType: 'active' })
      queryClient.invalidateQueries({ queryKey: ['portfolio-summary'], refetchType: 'active' })
      queryClient.invalidateQueries({ queryKey: ['portfolio-xirr'], refetchType: 'active' })
      queryClient.invalidateQueries({ queryKey: ['holdings'], refetchType: 'active' })
      queryClient.invalidateQueries({ queryKey: ['combined-portfolio'], refetchType: 'active' })
      queryClient.invalidateQueries({ queryKey: ['portfolio-value'], refetchType: 'active' })
      
      toast.success('Transaction deleted successfully')
    },
    
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to delete transaction'
      toast.error(message)
    }
  })
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PortfolioAPI } from '../services/portfolioApi'
import { Portfolio, CreatePortfolioRequest, UpdatePortfolioRequest } from '../types/portfolio'
import toast from 'react-hot-toast'

const QUERY_KEY = ['portfolios']

export function usePortfolios() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => PortfolioAPI.listPortfolios(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

export function useCreatePortfolio() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: CreatePortfolioRequest) => PortfolioAPI.createPortfolio(data),
    onSuccess: (newPortfolio) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
      toast.success(`Portfolio "${newPortfolio.portfolioName}" created successfully!`)
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to create portfolio'
      toast.error(message)
    },
  })
}

export function useUpdatePortfolio() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdatePortfolioRequest }) => 
      PortfolioAPI.updatePortfolio(id, data),
    onSuccess: (updatedPortfolio) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
      toast.success(`Portfolio "${updatedPortfolio.portfolioName}" updated successfully!`)
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to update portfolio'
      toast.error(message)
    },
  })
}

export function useDeletePortfolio() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: number) => PortfolioAPI.deletePortfolio(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
      toast.success('Portfolio deleted successfully!')
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to delete portfolio'
      toast.error(message)
    },
  })
}

export function useSetPrimaryPortfolio() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: number) => PortfolioAPI.setPrimaryPortfolio(id),
    onSuccess: (portfolio) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
      toast.success(`"${portfolio.portfolioName}" set as primary portfolio!`)
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to set primary portfolio'
      toast.error(message)
    },
  })
}

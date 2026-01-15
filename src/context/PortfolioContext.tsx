import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'

interface PortfolioContextType {
  selectedPortfolioIds: number[]
  togglePortfolio: (id: number) => void
  selectAll: (allIds: number[]) => void
  clearAll: () => void
  selectOnly: (id: number) => void
  setSelectedPortfolios: (ids: number[]) => void
}

const PortfolioContext = createContext<PortfolioContextType | undefined>(undefined)

const STORAGE_KEY = 'selected_portfolio_ids'

export function PortfolioProvider({ children }: { children: ReactNode }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const [selectedPortfolioIds, setSelectedPortfolioIds] = useState<number[]>(() => {
    // Priority: URL params > localStorage > empty array
    const urlIds = searchParams.get('portfolios')
    if (urlIds) {
      return urlIds.split(',').map(Number).filter(n => !isNaN(n))
    }
    
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        return JSON.parse(stored)
      } catch {
        return []
      }
    }
    
    return []
  })

  // Sync to localStorage and URL
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedPortfolioIds))
    
    // Update URL params without triggering re-render loop
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev)
      if (selectedPortfolioIds.length > 0) {
        newParams.set('portfolios', selectedPortfolioIds.join(','))
      } else {
        newParams.delete('portfolios')
      }
      
      // Only update if changed
      const currentPortfolios = prev.get('portfolios')
      const newPortfolios = newParams.get('portfolios')
      if (currentPortfolios !== newPortfolios) {
        return newParams
      }
      return prev
    }, { replace: true })
  }, [selectedPortfolioIds, setSearchParams])

  const togglePortfolio = (id: number) => {
    setSelectedPortfolioIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(pid => pid !== id)
      } else {
        return [...prev, id]
      }
    })
  }

  const selectAll = (allIds: number[]) => {
    setSelectedPortfolioIds(allIds)
  }

  const clearAll = () => {
    setSelectedPortfolioIds([])
  }

  const selectOnly = (id: number) => {
    setSelectedPortfolioIds([id])
  }

  const setSelectedPortfolios = (ids: number[]) => {
    setSelectedPortfolioIds(ids)
  }

  return (
    <PortfolioContext.Provider
      value={{
        selectedPortfolioIds,
        togglePortfolio,
        selectAll,
        clearAll,
        selectOnly,
        setSelectedPortfolios,
      }}
    >
      {children}
    </PortfolioContext.Provider>
  )
}

export function usePortfolioContext() {
  const context = useContext(PortfolioContext)
  if (context === undefined) {
    throw new Error('usePortfolioContext must be used within a PortfolioProvider')
  }
  return context
}

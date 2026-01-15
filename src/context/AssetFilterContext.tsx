import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'

export type AssetType = 'mutual-funds' | 'stocks' | 'crypto' | 'gold' | 'property' | 'fixed-income'

interface AssetFilterContextType {
  selectedAssets: Set<AssetType>
  isAllSelected: boolean
  toggleAsset: (type: AssetType) => void
  selectAllAssets: () => void
  clearAssets: () => void
  isAssetSelected: (type: AssetType) => boolean
}

const AssetFilterContext = createContext<AssetFilterContextType | undefined>(undefined)

const STORAGE_KEY = 'selected_asset_types'
const ALL_ASSETS: AssetType[] = ['mutual-funds', 'stocks', 'crypto', 'gold', 'property', 'fixed-income']

export function AssetFilterProvider({ children }: { children: ReactNode }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const [selectedAssets, setSelectedAssets] = useState<Set<AssetType>>(() => {
    // Priority: URL params > localStorage > all assets
    const urlAssets = searchParams.get('assets')
    if (urlAssets) {
      const assets = urlAssets.split(',') as AssetType[]
      return new Set(assets.filter(a => ALL_ASSETS.includes(a)))
    }
    
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as AssetType[]
        return new Set(parsed.filter(a => ALL_ASSETS.includes(a)))
      } catch {
        return new Set(ALL_ASSETS)
      }
    }
    
    // Default: all assets
    return new Set(ALL_ASSETS)
  })

  const isAllSelected = selectedAssets.size === ALL_ASSETS.length

  // Sync to localStorage and URL
  useEffect(() => {
    const assetsArray = Array.from(selectedAssets)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(assetsArray))
    
    // Update URL params without triggering re-render loop
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev)
      if (assetsArray.length > 0 && assetsArray.length < ALL_ASSETS.length) {
        newParams.set('assets', assetsArray.join(','))
      } else {
        newParams.delete('assets') // Don't clutter URL when all selected
      }
      
      // Only update if changed
      const currentAssets = prev.get('assets')
      const newAssets = newParams.get('assets')
      if (currentAssets !== newAssets) {
        return newParams
      }
      return prev
    }, { replace: true })
  }, [selectedAssets, setSearchParams])

  const toggleAsset = (type: AssetType) => {
    setSelectedAssets(prev => {
      const next = new Set(prev)
      
      if (next.has(type)) {
        next.delete(type)
        // If nothing selected, select all
        if (next.size === 0) {
          return new Set(ALL_ASSETS)
        }
      } else {
        next.add(type)
      }
      
      return next
    })
  }

  const selectAllAssets = () => {
    setSelectedAssets(new Set(ALL_ASSETS))
  }

  const clearAssets = () => {
    setSelectedAssets(new Set())
  }

  const isAssetSelected = (type: AssetType) => {
    return selectedAssets.has(type)
  }

  return (
    <AssetFilterContext.Provider
      value={{
        selectedAssets,
        isAllSelected,
        toggleAsset,
        selectAllAssets,
        clearAssets,
        isAssetSelected,
      }}
    >
      {children}
    </AssetFilterContext.Provider>
  )
}

export function useAssetFilter() {
  const context = useContext(AssetFilterContext)
  if (context === undefined) {
    throw new Error('useAssetFilter must be used within an AssetFilterProvider')
  }
  return context
}

import { Outlet, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useAuthStore } from '../store/authStore'
import { MainNavbar } from '../components/layout/MainNavbar'
import { DashboardSidebar } from '../components/layout/DashboardSidebar'
import { TransactionDrawer } from '../components/layout/TransactionDrawer'
import { FloatingActionButton } from '../components/layout/FloatingActionButton'
import { TransactionForm } from '../components/transaction/TransactionForm'

export default function DashboardLayout() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const hasHydrated = useAuthStore((state) => state._hasHydrated)
  const [isTransactionDrawerOpen, setIsTransactionDrawerOpen] = useState(false)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

  // Close mobile sidebar when clicking outside or pressing ESC
  useEffect(() => {
    if (isMobileSidebarOpen) {
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setIsMobileSidebarOpen(false)
      }
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
      return () => {
        document.removeEventListener('keydown', handleEscape)
        document.body.style.overflow = 'unset'
      }
    }
  }, [isMobileSidebarOpen])

  // Wait for hydration before making any routing decisions
  if (!hasHydrated) {
    return (
      <div className="flex items-center justify-center h-screen bg-black">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-900 border-t-blue-600"></div>
          <p className="mt-4 text-lg font-medium text-gray-100">Loading...</p>
        </div>
      </div>
    )
  }

  // After hydration, redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  const handleTransactionSuccess = () => {
    setIsTransactionDrawerOpen(false)
    // Could add a success toast here
  }

  return (
    <div className="h-screen flex flex-col bg-black">
      {/* Professional Navbar with Portfolio Selector */}
      <MainNavbar 
        onAddTransaction={() => setIsTransactionDrawerOpen(true)}
        onToggleSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
      />
      
      <div className="flex flex-1 overflow-hidden">
        {/* Mobile Sidebar Backdrop */}
        {isMobileSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/80 z-30 lg:hidden"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
        )}

        {/* Professional Sidebar with Icons */}
        <DashboardSidebar 
          isOpen={isMobileSidebarOpen}
          onClose={() => setIsMobileSidebarOpen(false)}
        />
        
        {/* Main content area */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-6">
            <div className="max-w-7xl mx-auto">
              <Outlet />
            </div>
          </div>
        </main>
      </div>

      {/* Floating Action Button - Mobile Only */}
      <div className="lg:hidden">
        <FloatingActionButton 
          onClick={() => setIsTransactionDrawerOpen(true)}
          label="Add Transaction"
        />
      </div>

      {/* Transaction Drawer */}
      <TransactionDrawer
        isOpen={isTransactionDrawerOpen}
        onClose={() => setIsTransactionDrawerOpen(false)}
        title="Add Transaction"
      >
        <TransactionForm
          onSuccess={handleTransactionSuccess}
          onCancel={() => setIsTransactionDrawerOpen(false)}
        />
      </TransactionDrawer>
    </div>
  )
}

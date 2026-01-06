import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { Navbar } from '../Navbar'
import { Sidebar } from '../Sidebar'
import { useState, useEffect } from 'react'

export const ProtectedRoute = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const hasHydrated = useAuthStore((state) => state._hasHydrated)
  const user = useAuthStore((state) => state.user)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  useEffect(() => {
    console.log('ProtectedRoute - hasHydrated:', hasHydrated)
    console.log('ProtectedRoute - isAuthenticated:', isAuthenticated)
    console.log('ProtectedRoute - user:', user)
  }, [hasHydrated, isAuthenticated, user])

  // Wait for hydration before checking auth
  if (!hasHydrated) {
    console.log('Still hydrating, showing loading...')
    return (
      <div className="flex items-center justify-center h-screen bg-white dark:bg-gray-900">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600"></div>
          <p className="mt-4 text-lg font-medium text-gray-900 dark:text-gray-100">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    console.log('Not authenticated, redirecting to login')
    return <Navigate to="/login" replace />
  }

  console.log('Authenticated, rendering protected content')

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar onMenuClick={() => setIsSidebarOpen(true)} />
        
        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

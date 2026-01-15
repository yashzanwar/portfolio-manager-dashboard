import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { ErrorBoundary } from './components/common'
import { PortfolioProvider } from './context/PortfolioContext'
import { AssetFilterProvider } from './context/AssetFilterContext'
import { setQueryClientForApi } from './services/api'
import Login from './pages/Login'
import Register from './pages/Register'
import DashboardLayout from './pages/DashboardLayout'
import DashboardOverview from './pages/DashboardOverview'
import DashboardMutualFunds from './pages/DashboardMutualFunds'
import DashboardTransactions from './pages/DashboardTransactions'
import ManagePortfolios from './pages/ManagePortfolios'
import ImportCAS from './pages/ImportCAS'
import Schedules from './pages/Schedules'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

// Register queryClient with API service for global logout
setQueryClientForApi(queryClient)

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <PortfolioProvider>
            <AssetFilterProvider>
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 3000,
                  style: {
                    background: '#363636',
                    color: '#fff',
                  },
                  success: {
                    duration: 3000,
                    iconTheme: {
                      primary: '#10B981',
                      secondary: '#fff',
                    },
                  },
                  error: {
                    duration: 4000,
                    iconTheme: {
                      primary: '#EF4444',
                      secondary: '#fff',
                    },
                  },
                }}
              />
              
              <Routes>
                {/* Public routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                
                {/* Root redirect - let DashboardLayout handle auth */}
                <Route path="/" element={<Navigate to="/login" replace />} />
                
                {/* Main dashboard routes with new layout */}
                <Route path="/dash" element={<DashboardLayout />}>
                  <Route index element={<DashboardOverview />} />
                  <Route path="mutual-funds" element={<DashboardMutualFunds />} />
                  <Route path="stocks" element={<DashboardOverview />} /> {/* Placeholder */}
                  <Route path="crypto" element={<DashboardOverview />} /> {/* Placeholder */}
                  <Route path="gold" element={<DashboardOverview />} /> {/* Placeholder */}
                  <Route path="property" element={<DashboardOverview />} /> {/* Placeholder */}
                  <Route path="fixed-income" element={<DashboardOverview />} /> {/* Placeholder */}
                  <Route path="transactions" element={<DashboardTransactions />} />
                </Route>
                
                {/* Management routes */}
                <Route path="/manage" element={<DashboardLayout />}>
                  <Route path="portfolios" element={<ManagePortfolios />} />
                </Route>
                
                {/* Utility routes */}
                <Route path="/schedules" element={<DashboardLayout />}>
                  <Route index element={<Schedules />} />
                </Route>
                
                <Route path="/import" element={<DashboardLayout />}>
                  <Route index element={<ImportCAS />} />
                </Route>
                
                {/* Redirect root to new dashboard */}
                <Route path="/" element={<Navigate to="/dash" replace />} />
                
                {/* Legacy route redirects */}
                <Route path="/dashboard" element={<Navigate to="/dash" replace />} />
                <Route path="/portfolios" element={<Navigate to="/manage/portfolios" replace />} />
                <Route path="/holdings" element={<Navigate to="/dash/mutual-funds" replace />} />
                <Route path="/transactions" element={<Navigate to="/dash/transactions" replace />} />
                
                {/* Catch all - redirect to dashboard */}
                <Route path="*" element={<Navigate to="/dash" replace />} />
              </Routes>
            </AssetFilterProvider>
          </PortfolioProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}

export default App

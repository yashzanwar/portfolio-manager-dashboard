import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { ErrorBoundary } from './components/common'
import { ProtectedRoute } from './components/layout/ProtectedRoute'
import { setQueryClientForApi } from './services/api'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Portfolios from './pages/Portfolios'
import Holdings from './pages/Holdings'
import ImportCAS from './pages/ImportCAS'
import FolioTransactions from './pages/FolioTransactions'
import Transactions from './pages/Transactions'
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
            
            {/* Protected routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/portfolios" element={<Portfolios />} />
              <Route path="/holdings" element={<Holdings />} />
              <Route path="/holdings/:portfolioId/folio/:folioNumber" element={<FolioTransactions />} />
              <Route path="/schedules" element={<Schedules />} />
              <Route path="/transactions" element={<Transactions />} />
              <Route path="/import" element={<ImportCAS />} />
            </Route>
            
            {/* Redirect root to dashboard */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            {/* Catch all - redirect to dashboard */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}

export default App

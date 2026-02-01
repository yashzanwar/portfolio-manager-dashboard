import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { PortfolioProvider } from './context/PortfolioContext'
import { AssetFilterProvider } from './context/AssetFilterContext'
import Login from './pages/Login'
import Register from './pages/Register'
import DashboardLayout from './pages/DashboardLayout'
import DashboardOverview from './pages/DashboardOverview'
import DashboardMutualFunds from './pages/DashboardMutualFunds'
import DashboardStocks from './pages/DashboardStocks'
import DashboardMetals from './pages/DashboardMetals'
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

function DashboardProviders() {
  return (
    <PortfolioProvider>
      <AssetFilterProvider>
        <Outlet />
      </AssetFilterProvider>
    </PortfolioProvider>
  )
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route element={<DashboardProviders />}>
        <Route path="/dash" element={<DashboardLayout />}>
          <Route index element={<DashboardOverview />} />
          <Route path="mutual-funds" element={<DashboardMutualFunds />} />
          <Route path="stocks" element={<DashboardStocks />} />
          <Route path="metals" element={<DashboardMetals />} />
          <Route path="transactions" element={<DashboardTransactions />} />
        </Route>

        <Route path="/manage" element={<DashboardLayout />}>
          <Route path="portfolios" element={<ManagePortfolios />} />
        </Route>

        <Route path="/schedules" element={<DashboardLayout />}>
          <Route index element={<Schedules />} />
        </Route>

        <Route path="/import" element={<DashboardLayout />}>
          <Route index element={<ImportCAS />} />
        </Route>
      </Route>

      <Route path="*" element={<Login />} />
    </Routes>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Toaster position="top-right" />
        <AppRoutes />
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App

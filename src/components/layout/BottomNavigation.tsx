import { NavLink, useLocation } from 'react-router-dom'
import { LayoutDashboard, ArrowRightLeft, Layers } from 'lucide-react'
import { useState } from 'react'
import { PortfolioSelectorModal } from './PortfolioSelectorModal'

interface NavItem {
  label: string
  path: string
  icon: React.ReactNode
}

const navItems: NavItem[] = [
  {
    label: 'Overview',
    path: '/dash',
    icon: <LayoutDashboard className="w-5 h-5" />
  },
  {
    label: 'Txns',
    path: '/dash/transactions',
    icon: <ArrowRightLeft className="w-5 h-5" />
  }
]

export function BottomNavigation() {
  const location = useLocation()
  const [isPortfolioModalOpen, setIsPortfolioModalOpen] = useState(false)

  const isActive = (path: string) => {
    if (path === '/dash') {
      return location.pathname === '/dash'
    }
    return location.pathname.startsWith(path)
  }

  return (
    <>
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-gray-950 border-t border-gray-800 z-40">
        <div className="grid grid-cols-3 h-16">
          {/* Overview */}
          <NavLink
            to={navItems[0].path}
            className={`flex flex-col items-center justify-center gap-1 transition-colors ${
              isActive(navItems[0].path)
                ? 'text-blue-500'
                : 'text-gray-400 active:text-gray-300'
            }`}
          >
            {navItems[0].icon}
            <span className="text-xs font-medium">{navItems[0].label}</span>
          </NavLink>
          
          {/* Portfolio Selector Button */}
          <button
            onClick={() => setIsPortfolioModalOpen(true)}
            className="flex flex-col items-center justify-center gap-1 text-gray-400 active:text-gray-300 transition-colors"
          >
            <Layers className="w-5 h-5" />
            <span className="text-xs font-medium">Portfolio</span>
          </button>

          {/* Transactions */}
          <NavLink
            to={navItems[1].path}
            className={`flex flex-col items-center justify-center gap-1 transition-colors ${
              isActive(navItems[1].path)
                ? 'text-blue-500'
                : 'text-gray-400 active:text-gray-300'
            }`}
          >
            {navItems[1].icon}
            <span className="text-xs font-medium">{navItems[1].label}</span>
          </NavLink>
        </div>
      </nav>

      {/* Portfolio Selector Modal */}
      <PortfolioSelectorModal
        isOpen={isPortfolioModalOpen}
        onClose={() => setIsPortfolioModalOpen(false)}
      />
    </>
  )
}

import { User, LogOut, Settings, Bell, Plus, Menu } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { PortfolioSelector } from './PortfolioSelector'

interface MainNavbarProps {
  onAddTransaction?: () => void
  onToggleSidebar?: () => void
}

export function MainNavbar({ onAddTransaction, onToggleSidebar }: MainNavbarProps) {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()

  // Close user menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false)
      }
    }

    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isUserMenuOpen])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav className="bg-black border-b border-gray-900">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Left: Hamburger + Logo + Portfolio Selector */}
          <div className="flex items-center gap-3 lg:gap-6">
            {/* Hamburger Menu Button - Mobile Only */}
            <button
              onClick={onToggleSidebar}
              className="lg:hidden p-2 hover:bg-gray-900 rounded-lg transition-colors"
              aria-label="Toggle sidebar"
            >
              <Menu className="w-6 h-6 text-gray-400" />
            </button>

            <Link to="/dash" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">PM</span>
              </div>
              <h1 className="text-xl font-bold text-white hidden sm:block">
                Portfolio Manager
              </h1>
            </Link>
            
            {/* Portfolio Selector - visible on desktop, will show separately on mobile */}
            <div className="hidden md:block">
              <PortfolioSelector />
            </div>
            
            {/* Add Transaction Button - Desktop */}
            <button
              onClick={onAddTransaction}
              className="hidden lg:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition-all shadow-sm hover:shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm font-medium">Add Transaction</span>
            </button>
          </div>

          {/* Right: Notifications + User Menu */}
          <div className="flex items-center gap-3">
            {/* Notifications */}
            <button className="p-2 hover:bg-gray-900 rounded-lg transition-colors relative">
              <Bell className="w-5 h-5 text-gray-400" />
              {/* Notification badge (example) */}
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            {/* User Menu */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 px-3 py-2 hover:bg-gray-900 rounded-lg transition-colors"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div className="text-left hidden sm:block">
                  <div className="text-sm font-medium text-white">
                    {user?.name || 'User'}
                  </div>
                  <div className="text-xs text-gray-400">
                    {user?.email || ''}
                  </div>
                </div>
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-gray-950 border border-gray-900 rounded-lg shadow-lg z-50 py-2">
                  <div className="px-4 py-2 border-b border-gray-900">
                    <div className="text-sm font-medium text-white">
                      {user?.name || 'User'}
                    </div>
                    <div className="text-xs text-gray-400">
                      {user?.email || ''}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false)
                      // Navigate to settings (will implement later)
                    }}
                    className="flex items-center gap-3 w-full px-4 py-2 hover:bg-gray-900 transition-colors"
                  >
                    <Settings className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-300">Settings</span>
                  </button>

                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-4 py-2 hover:bg-gray-900 transition-colors text-red-400"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="text-sm">Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}

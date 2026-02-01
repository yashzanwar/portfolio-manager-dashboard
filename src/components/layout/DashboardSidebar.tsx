import { NavLink } from 'react-router-dom'
import { 
  LayoutDashboard, 
  TrendingUp, 
  Bitcoin, 
  Landmark, 
  Home, 
  Coins,
  Briefcase,
  Calendar,
  FileText,
  Settings,
  X
} from 'lucide-react'

interface SidebarLink {
  to: string
  icon: React.ReactNode
  label: string
  badge?: number
}

interface SidebarSection {
  title: string
  links: SidebarLink[]
}

interface DashboardSidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

export function DashboardSidebar({ isOpen = true, onClose }: DashboardSidebarProps) {
  const sections: SidebarSection[] = [
    {
      title: 'Dashboard',
      links: [
        { to: '/dash', icon: <LayoutDashboard className="w-5 h-5" />, label: 'Overview' },
      ]
    },
    {
      title: 'Asset Types',
      links: [
        { to: '/dash/mutual-funds', icon: <TrendingUp className="w-5 h-5" />, label: 'Mutual Funds' },
        { to: '/dash/stocks', icon: <Coins className="w-5 h-5" />, label: 'Stocks' },
        { to: '/dash/metals', icon: <Coins className="w-5 h-5" />, label: 'Metals' },
        { to: '/dash/fixed-deposits', icon: <Landmark className="w-5 h-5" />, label: 'Fixed Deposits' },
      ]
    },
    {
      title: 'Management',
      links: [
        { to: '/manage/portfolios', icon: <Briefcase className="w-5 h-5" />, label: 'Portfolios' },
        { to: '/dash/transactions', icon: <FileText className="w-5 h-5" />, label: 'Transactions' },
        { to: '/schedules', icon: <Calendar className="w-5 h-5" />, label: 'Schedules' },
      ]
    },
  ]

  const handleLinkClick = () => {
    // Close mobile sidebar when a link is clicked
    if (onClose) {
      onClose()
    }
  }

  return (
    <aside 
      className={`
        fixed lg:static inset-y-0 left-0 z-40
        w-64 bg-black border-r border-gray-900
        flex flex-col transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}
    >
      {/* Mobile Close Button */}
      <div className="lg:hidden flex items-center justify-between p-4 border-b border-gray-900">
        <h2 className="text-lg font-semibold text-white">Menu</h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-900 rounded-lg transition-colors"
          aria-label="Close sidebar"
        >
          <X className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        {sections.map((section, idx) => (
          <div key={idx} className="mb-6">
            <div className="px-4 mb-2">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {section.title}
              </h3>
            </div>
            <nav className="space-y-1 px-2">
              {section.links.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.to === '/dash'}
                  onClick={handleLinkClick}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-blue-900/20 text-blue-400'
                        : 'text-gray-300 hover:bg-gray-900'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span className={isActive ? 'text-blue-400' : 'text-gray-400'}>
                        {link.icon}
                      </span>
                      <span className="text-sm font-medium flex-1">{link.label}</span>
                      {link.badge !== undefined && (
                        <span className="px-2 py-0.5 text-xs font-semibold bg-gray-900 text-gray-300 rounded-full">
                          {link.badge}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </nav>
          </div>
        ))}
      </div>

      {/* Footer with Settings */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-2">
        <NavLink
          to="/settings"
          onClick={handleLinkClick}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
              isActive
                ? 'bg-blue-900/20 text-blue-400'
                : 'text-gray-300 hover:bg-gray-900'
            }`
          }
        >
          <Settings className="w-5 h-5 text-gray-400" />
          <span className="text-sm font-medium">Settings</span>
        </NavLink>
      </div>
    </aside>
  )
}

import { Link, useLocation } from 'react-router-dom'
import { Button } from '../ui/button'

const navItems = [
  { path: '/', label: 'Home' },
  { path: '/research', label: 'Research' },
  { path: '/agents', label: 'Agents' },
  { path: '/workflows', label: 'Workflows' },
]

export function Header() {
  const location = useLocation()

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-gray-900">Mastra Deep Research</h1>
          </div>
          <nav className="flex space-x-4">
            {navItems.map((item) => (
              <Button
                key={item.path}
                asChild
                variant={location.pathname === item.path ? "default" : "ghost"}
                className="px-3 py-2"
              >
                <Link to={item.path}>{item.label}</Link>
              </Button>
            ))}
          </nav>
        </div>
      </div>
    </header>
  )
}

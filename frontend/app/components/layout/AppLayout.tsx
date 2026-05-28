import { NavLink, Outlet } from 'react-router'
import { cn } from '~/lib/utils'

const navItems = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/nueva-transaccion',    label: 'Nueva Transacción' },
  { to: '/aprobaciones',  label: 'Aprobaciones' },
]

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-40 border-b bg-white shadow-sm">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-6 px-4">
          <span className="text-lg font-bold tracking-tight text-primary">
            💸 Fintech
          </span>
          <nav className="flex items-center gap-1">
            {navItems.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  cn(
                    'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}

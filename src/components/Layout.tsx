import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

const links = [
  { to: '/', label: 'Overview', end: true },
  { to: '/price-book', label: 'Price book' },
  { to: '/import', label: 'Import & publish', adminOnly: true },
  { to: '/items', label: 'Service items' },
  { to: '/unmapped', label: 'Unmapped history' },
  { to: '/due-soon', label: 'Due soon' },
  { to: '/overdue', label: 'Overdue' },
  { to: '/call-list', label: 'Call list' },
  { to: '/intervals', label: 'Intervals', adminOnly: true },
]

export function Layout() {
  const { user, isAdmin, signOut } = useAuth()

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">E</span>
          <div>
            <strong>Service Board</strong>
            <small>Elizade Connect</small>
          </div>
        </div>
        <nav>
          {links
            .filter((link) => !link.adminOnly || isAdmin)
            .map((link) => (
              <NavLink key={link.to} to={link.to} end={link.end} className={({ isActive }) => (isActive ? 'active' : undefined)}>
                {link.label}
              </NavLink>
            ))}
        </nav>
        <div className="sidebar-footer">
          <div className="user-chip">
            <span>{user?.firstName} {user?.lastName}</span>
            <small>{user?.role}</small>
          </div>
          <button type="button" className="ghost" onClick={signOut}>
            Sign out
          </button>
        </div>
      </aside>
      <main className="content">
        <Outlet />
      </main>
    </div>
  )
}

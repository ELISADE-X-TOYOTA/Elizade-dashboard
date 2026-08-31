import { NavLink, Outlet } from 'react-router-dom'

const links = [
  { to: '/', label: 'Overview', end: true },
  { to: '/price-book', label: 'Price book' },
  { to: '/items', label: 'Service items' },
]

export function Layout() {
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
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.end} className={({ isActive }) => (isActive ? 'active' : undefined)}>
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <p className="muted public-note">Public display — no sign-in required.</p>
        </div>
      </aside>
      <main className="content">
        <Outlet />
      </main>
    </div>
  )
}

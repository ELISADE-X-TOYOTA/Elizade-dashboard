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
          <img src="/elizade-logo.png" alt="" className="brand-logo" width={40} height={40} />
          <div>
            <strong>Elizade</strong>
            <small>Service Board</small>
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

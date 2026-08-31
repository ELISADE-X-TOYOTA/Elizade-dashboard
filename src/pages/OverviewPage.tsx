import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getPublishedBoard, listHistory, listPriceVersions, listServiceItems } from '../api/client'
import { useAuth } from '../auth/AuthContext'

type Stats = {
  items: number
  unmapped: number
  publishedVersion: number | null
  priceCells: number
}

export function OverviewPage() {
  const { token } = useAuth()
  const [stats, setStats] = useState<Stats | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return
    let cancelled = false
    ;(async () => {
      try {
        const [items, unmappedPage, versions] = await Promise.all([
          listServiceItems(token),
          listHistory(token, { unmappedOnly: true, page: 1, size: 1 }),
          listPriceVersions(token),
        ])
        let priceCells = 0
        let publishedVersion: number | null = null
        try {
          const board = await getPublishedBoard(token)
          priceCells = board.entries.length
          publishedVersion = board.version.versionNumber
        } catch {
          const published = versions.find((v) => v.status === 'published')
          publishedVersion = published?.versionNumber ?? null
        }
        if (!cancelled) {
          setStats({
            items: items.length,
            unmapped: unmappedPage.total,
            publishedVersion,
            priceCells,
          })
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load overview')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [token])

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Overview</h1>
          <p className="muted">Service catalogue, price book, and unmapped history at a glance.</p>
        </div>
      </header>

      {error && <p className="error">{error}</p>}

      <div className="stat-grid">
        <article className="stat-card">
          <span className="stat-label">Service items</span>
          <strong className="stat-value">{stats?.items ?? '—'}</strong>
          <Link to="/items">Manage catalogue →</Link>
        </article>
        <article className="stat-card">
          <span className="stat-label">Unmapped visits</span>
          <strong className="stat-value">{stats?.unmapped ?? '—'}</strong>
          <Link to="/unmapped">Review queue →</Link>
        </article>
        <article className="stat-card">
          <span className="stat-label">Published price book</span>
          <strong className="stat-value">
            {stats?.publishedVersion != null ? `v${stats.publishedVersion}` : 'None'}
          </strong>
          <Link to="/price-book">View matrix →</Link>
        </article>
        <article className="stat-card">
          <span className="stat-label">Priced cells</span>
          <strong className="stat-value">{stats?.priceCells ?? '—'}</strong>
          <Link to="/import">Import prices →</Link>
        </article>
      </div>

      <section className="panel">
        <h2>Maintenance queues</h2>
        <p className="muted">
          Due-soon, overdue, and call-list views require admin-configured intervals on catalogue items.
        </p>
        <div className="stat-grid">
          <article className="stat-card">
            <Link to="/due-soon">Due soon →</Link>
          </article>
          <article className="stat-card">
            <Link to="/overdue">Overdue →</Link>
          </article>
          <article className="stat-card">
            <Link to="/call-list">Call list →</Link>
          </article>
        </div>
      </section>
    </div>
  )
}

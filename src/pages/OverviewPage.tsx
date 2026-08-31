import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getPublishedBoard, listServiceItems } from '../api/client'

type Stats = {
  items: number
  publishedVersion: number | null
  priceCells: number
}

export function OverviewPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const items = await listServiceItems()
        let priceCells = 0
        let publishedVersion: number | null = null
        try {
          const board = await getPublishedBoard()
          priceCells = board.entries.length
          publishedVersion = board.version.versionNumber
        } catch {
          /* no published book yet */
        }
        if (!cancelled) {
          setStats({ items: items.length, publishedVersion, priceCells })
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load overview')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Service Board</h1>
          <p className="muted">Digital service price book for showroom and service-centre display.</p>
        </div>
      </header>

      {error && <p className="error">{error}</p>}

      <div className="stat-grid">
        <article className="stat-card">
          <span className="stat-label">Service items</span>
          <strong className="stat-value">{stats?.items ?? '—'}</strong>
          <Link to="/items">View catalogue →</Link>
        </article>
        <article className="stat-card">
          <span className="stat-label">Published price book</span>
          <strong className="stat-value">
            {stats?.publishedVersion != null ? `v${stats.publishedVersion}` : 'None'}
          </strong>
          <Link to="/price-book">View prices →</Link>
        </article>
        <article className="stat-card">
          <span className="stat-label">Priced cells</span>
          <strong className="stat-value">{stats?.priceCells ?? '—'}</strong>
          <Link to="/price-book">Open matrix →</Link>
        </article>
      </div>
    </div>
  )
}

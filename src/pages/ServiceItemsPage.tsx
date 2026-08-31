import { useEffect, useState } from 'react'
import { listServiceItems } from '../api/client'
import type { ServiceItem } from '../api/types'

const GROUPS = ['periodic', 'chassis', 'engine']

export function ServiceItemsPage() {
  const [items, setItems] = useState<ServiceItem[]>([])
  const [group, setGroup] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    listServiceItems(group || undefined)
      .then((data) => {
        setItems(data)
        setError(null)
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load items'))
      .finally(() => setLoading(false))
  }, [group])

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Service items</h1>
          <p className="muted">Catalogue shown on the service price board.</p>
        </div>
        <label>
          Filter group
          <select value={group} onChange={(e) => setGroup(e.target.value)}>
            <option value="">All</option>
            {GROUPS.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </label>
      </header>

      {error && <p className="error">{error}</p>}

      <section className="panel">
        {loading ? (
          <p className="muted">Loading…</p>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Name</th>
                  <th>Group</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td><code>{item.code}</code></td>
                    <td>{item.name}</td>
                    <td>{item.group}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

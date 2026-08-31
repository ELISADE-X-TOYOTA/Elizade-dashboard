import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { PaginatedMaintenance } from '../api/types'
import { useAuth } from '../auth/AuthContext'

type Props = {
  title: string
  description: string
  fetchPage: (token: string, page: number) => Promise<PaginatedMaintenance>
}

export function MaintenanceListPage({ title, description, fetchPage }: Props) {
  const { token } = useAuth()
  const [data, setData] = useState<PaginatedMaintenance | null>(null)
  const [page, setPage] = useState(1)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return
    let cancelled = false
    fetchPage(token, page)
      .then((res) => {
        if (!cancelled) {
          setData(res)
          setError(null)
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load')
      })
    return () => {
      cancelled = true
    }
  }, [token, page, fetchPage])

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>{title}</h1>
          <p className="muted">{description}</p>
        </div>
        {data && <span className="meta-pill">{data.total} vehicles</span>}
      </header>

      {error && <p className="error">{error}</p>}

      <section className="panel">
        {!data ? (
          <p className="muted">Loading…</p>
        ) : data.items.length === 0 ? (
          <p className="muted">No vehicles match. Configure intervals and service history first.</p>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Vehicle</th>
                  <th>Customer</th>
                  <th>Contact</th>
                  <th>Mileage</th>
                  <th>Due soon</th>
                  <th>Overdue</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {data.items.map((row) => (
                  <tr key={row.ownedVehicleId}>
                    <td>
                      <strong>{row.vehicleLabel}</strong>
                      <small>{row.model}</small>
                    </td>
                    <td>{row.customerName}</td>
                    <td>
                      {row.customerPhone}
                      {row.customerEmail && <small>{row.customerEmail}</small>}
                    </td>
                    <td>{row.currentMileage.toLocaleString()} km</td>
                    <td>{row.dueSoonCount}</td>
                    <td>{row.overdueCount}</td>
                    <td>
                      <Link to={`/vehicles/${row.ownedVehicleId}`}>Details</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {data && data.pages > 1 && (
          <div className="pager">
            <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
            <span>Page {page} of {data.pages}</span>
            <button type="button" disabled={page >= data.pages} onClick={() => setPage((p) => p + 1)}>Next</button>
          </div>
        )}
      </section>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getVehicleMaintenance } from '../api/client'
import type { VehicleMaintenance } from '../api/types'
import { useAuth } from '../auth/AuthContext'

const STATUS_CLASS: Record<string, string> = {
  current: 'status-current',
  due_soon: 'status-due-soon',
  overdue: 'status-overdue',
  not_on_record: 'status-unknown',
  no_interval: 'status-muted',
}

export function VehicleDetailPage() {
  const { id } = useParams()
  const { token } = useAuth()
  const [detail, setDetail] = useState<VehicleMaintenance | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token || !id) return
    getVehicleMaintenance(token, id)
      .then(setDetail)
      .catch((err) => setError(err instanceof Error ? err.message : 'Not found'))
  }, [token, id])

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>{detail?.vehicleLabel ?? 'Vehicle maintenance'}</h1>
          {detail && (
            <p className="muted">
              {detail.customerName} · {detail.currentMileage.toLocaleString()} km
            </p>
          )}
        </div>
      </header>

      {error && <p className="error">{error}</p>}
      {!detail && !error && <p className="muted">Loading…</p>}

      {detail && (
        <section className="panel">
          <p>
            <strong>Phone:</strong> {detail.customerPhone}
            {detail.customerEmail && <> · <strong>Email:</strong> {detail.customerEmail}</>}
          </p>
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Group</th>
                  <th>Status</th>
                  <th>Reason</th>
                </tr>
              </thead>
              <tbody>
                {detail.items.map((item) => (
                  <tr key={item.serviceItemId}>
                    <td><strong>{item.serviceItemName}</strong></td>
                    <td>{item.serviceItemGroup}</td>
                    <td><span className={`status-pill ${STATUS_CLASS[item.status] ?? ''}`}>{item.status}</span></td>
                    <td>{item.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  )
}

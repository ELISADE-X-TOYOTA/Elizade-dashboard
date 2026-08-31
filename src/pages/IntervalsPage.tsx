import { useEffect, useState, type FormEvent } from 'react'
import { createInterval, getBoardSettings, listIntervals, listServiceItems, updateBoardSettings } from '../api/client'
import type { BoardSettings, ServiceInterval, ServiceItem } from '../api/types'
import { useAuth } from '../auth/AuthContext'

const KINDS = ['scheduled', 'inspection', 'condition', 'repair_only']

export function IntervalsPage() {
  const { token, isAdmin } = useAuth()
  const [intervals, setIntervals] = useState<ServiceInterval[]>([])
  const [items, setItems] = useState<ServiceItem[]>([])
  const [settings, setSettings] = useState<BoardSettings | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [serviceItemId, setServiceItemId] = useState('')
  const [kind, setKind] = useState('scheduled')
  const [intervalKm, setIntervalKm] = useState('')
  const [intervalMonths, setIntervalMonths] = useState('')

  async function refresh() {
    if (!token) return
    const [intervalRows, itemRows, settingRows] = await Promise.all([
      listIntervals(token),
      listServiceItems(token),
      getBoardSettings(token),
    ])
    setIntervals(intervalRows)
    setItems(itemRows)
    setSettings(settingRows)
  }

  useEffect(() => {
    refresh().catch((err) => setError(err instanceof Error ? err.message : 'Load failed'))
  }, [token])

  async function onCreateInterval(e: FormEvent) {
    e.preventDefault()
    if (!token || !isAdmin) return
    try {
      await createInterval(token, {
        serviceItemId,
        kind,
        intervalKm: intervalKm ? Number(intervalKm) : undefined,
        intervalMonths: intervalMonths ? Number(intervalMonths) : undefined,
      })
      setServiceItemId('')
      setIntervalKm('')
      setIntervalMonths('')
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create interval')
    }
  }

  async function onSaveSettings(e: FormEvent) {
    e.preventDefault()
    if (!token || !isAdmin || !settings) return
    try {
      const updated = await updateBoardSettings(token, settings)
      setSettings(updated)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save settings')
    }
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Interval configuration</h1>
          <p className="muted">Admin-defined intervals — no Toyota defaults are seeded.</p>
        </div>
      </header>

      {error && <p className="error">{error}</p>}

      {settings && (
        <form className="panel form-grid" onSubmit={onSaveSettings}>
          <h2 className="full">Due-soon thresholds</h2>
          <label>
            Due soon (km)
            <input
              type="number"
              value={settings.dueSoonKm}
              disabled={!isAdmin}
              onChange={(e) => setSettings({ ...settings, dueSoonKm: Number(e.target.value) })}
            />
          </label>
          <label>
            Due soon (days)
            <input
              type="number"
              value={settings.dueSoonDays}
              disabled={!isAdmin}
              onChange={(e) => setSettings({ ...settings, dueSoonDays: Number(e.target.value) })}
            />
          </label>
          <label>
            Mileage stale after (days)
            <input
              type="number"
              value={settings.mileageStaleDays}
              disabled={!isAdmin}
              onChange={(e) => setSettings({ ...settings, mileageStaleDays: Number(e.target.value) })}
            />
          </label>
          {isAdmin && <button type="submit">Save thresholds</button>}
        </form>
      )}

      {isAdmin && (
        <form className="panel form-grid" onSubmit={onCreateInterval}>
          <h2 className="full">Add interval</h2>
          <label className="full">
            Service item
            <select value={serviceItemId} onChange={(e) => setServiceItemId(e.target.value)} required>
              <option value="">Choose item…</option>
              {items.filter((i) => i.isActive).map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          </label>
          <label>
            Kind
            <select value={kind} onChange={(e) => setKind(e.target.value)}>
              {KINDS.map((k) => <option key={k} value={k}>{k}</option>)}
            </select>
          </label>
          <label>
            Interval km
            <input value={intervalKm} onChange={(e) => setIntervalKm(e.target.value)} placeholder="10000" />
          </label>
          <label>
            Interval months
            <input value={intervalMonths} onChange={(e) => setIntervalMonths(e.target.value)} placeholder="12" />
          </label>
          <button type="submit">Create</button>
        </form>
      )}

      <section className="panel">
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Model</th>
                <th>Kind</th>
                <th>Km</th>
                <th>Months</th>
              </tr>
            </thead>
            <tbody>
              {intervals.map((row) => (
                <tr key={row.id}>
                  <td>{row.serviceItemName}</td>
                  <td>{row.vehicleModel ?? 'All models'}</td>
                  <td>{row.kind}</td>
                  <td>{row.intervalKm ?? '—'}</td>
                  <td>{row.intervalMonths ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

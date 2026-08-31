import { useEffect, useState, type FormEvent } from 'react'
import { getHistory, listHistory, listServiceItems, replaceHistoryLines } from '../api/client'
import type { ServiceHistoryItem, ServiceItem } from '../api/types'
import { useAuth } from '../auth/AuthContext'

export function UnmappedHistoryPage() {
  const { token } = useAuth()
  const [rows, setRows] = useState<ServiceHistoryItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [detail, setDetail] = useState<ServiceHistoryItem | null>(null)
  const [items, setItems] = useState<ServiceItem[]>([])
  const [selectedItemId, setSelectedItemId] = useState('')
  const [operation, setOperation] = useState('serviced')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  async function loadList() {
    if (!token) return
    setLoading(true)
    try {
      const data = await listHistory(token, { unmappedOnly: true, page, size: 20 })
      setRows(data.items)
      setTotal(data.total)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load history')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadList()
  }, [token, page])

  useEffect(() => {
    if (!token) return
    listServiceItems(token).then(setItems).catch(() => setItems([]))
  }, [token])

  async function openDetail(id: string) {
    if (!token) return
    setSelectedId(id)
    setError(null)
    try {
      const row = await getHistory(token, id)
      setDetail(row)
    } catch (err) {
      setDetail(null)
      setError(err instanceof Error ? err.message : 'Could not load visit')
    }
  }

  async function onAttachLine(e: FormEvent) {
    e.preventDefault()
    if (!token || !detail || !selectedItemId) return
    setSaving(true)
    try {
      const updated = await replaceHistoryLines(token, detail.id, [
        { serviceItemId: selectedItemId, operation },
      ])
      setDetail(updated)
      setSelectedItemId('')
      await loadList()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save lines')
    } finally {
      setSaving(false)
    }
  }

  const pages = Math.max(1, Math.ceil(total / 20))

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Unmapped history</h1>
          <p className="muted">Completed visits with no structured line items yet.</p>
        </div>
        <span className="meta-pill">{total} total</span>
      </header>

      {error && <p className="error">{error}</p>}

      <div className="split-layout">
        <section className="panel list-pane">
          {loading ? (
            <p className="muted">Loading…</p>
          ) : rows.length === 0 ? (
            <p className="muted">No unmapped visits — good work.</p>
          ) : (
            <ul className="history-list">
              {rows.map((row) => (
                <li key={row.id}>
                  <button
                    type="button"
                    className={selectedId === row.id ? 'active' : undefined}
                    onClick={() => openDetail(row.id)}
                  >
                    <strong>{row.vehicleLabel}</strong>
                    <span>{row.customerName}</span>
                    <small>
                      {new Date(row.performedAt).toLocaleDateString()} · {row.mileage?.toLocaleString() ?? '—'} km
                    </small>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {pages > 1 && (
            <div className="pager">
              <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
              <span>Page {page} of {pages}</span>
              <button type="button" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>Next</button>
            </div>
          )}
        </section>

        <section className="panel detail-pane">
          {!detail ? (
            <p className="muted">Select a visit to attach catalogue lines.</p>
          ) : (
            <>
              <h2>{detail.vehicleLabel}</h2>
              <p className="muted">{detail.customerName} · {detail.serviceType}</p>
              <p>{detail.description || 'No description'}</p>

              {detail.lines.length > 0 ? (
                <ul className="line-list">
                  {detail.lines.map((line) => (
                    <li key={line.id}>
                      {line.serviceItemName} — {line.operation}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="muted">No lines yet.</p>
              )}

              <form className="form-grid attach-form" onSubmit={onAttachLine}>
                <h3 className="full">Attach line</h3>
                <label className="full">
                  Service item
                  <select value={selectedItemId} onChange={(e) => setSelectedItemId(e.target.value)} required>
                    <option value="">Choose item…</option>
                    {items.filter((i) => i.isActive).map((item) => (
                      <option key={item.id} value={item.id}>{item.name} ({item.code})</option>
                    ))}
                  </select>
                </label>
                <label>
                  Operation
                  <select value={operation} onChange={(e) => setOperation(e.target.value)}>
                    <option value="inspected">inspected</option>
                    <option value="serviced">serviced</option>
                    <option value="repaired">repaired</option>
                    <option value="replaced">replaced</option>
                  </select>
                </label>
                <button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save line'}</button>
              </form>
            </>
          )}
        </section>
      </div>
    </div>
  )
}

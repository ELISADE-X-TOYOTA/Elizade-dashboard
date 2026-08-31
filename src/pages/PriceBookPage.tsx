import { useEffect, useMemo, useState } from 'react'
import { formatNaira, getPublishedBoard } from '../api/client'
import type { PriceBookBoard } from '../api/types'

export function PriceBookPage() {
  const [board, setBoard] = useState<PriceBookBoard | null>(null)
  const [modelFilter, setModelFilter] = useState('')
  const [groupFilter, setGroupFilter] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const data = await getPublishedBoard()
        if (!cancelled) {
          setBoard(data)
          setError(null)
        }
      } catch (err) {
        if (!cancelled) {
          setBoard(null)
          setError(err instanceof Error ? err.message : 'No published price book yet')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const groups = useMemo(() => {
    if (!board) return []
    return [...new Set(board.entries.map((e) => e.serviceItemGroup))].sort()
  }, [board])

  const filtered = useMemo(() => {
    if (!board) return []
    return board.entries.filter((entry) => {
      if (modelFilter && entry.vehicleModel !== modelFilter) return false
      if (groupFilter && entry.serviceItemGroup !== groupFilter) return false
      return true
    })
  }, [board, modelFilter, groupFilter])

  const matrix = useMemo(() => {
    const rows = new Map<string, { code: string; name: string; group: string; prices: Map<string, string> }>()
    for (const entry of filtered) {
      const key = entry.serviceItemCode
      if (!rows.has(key)) {
        rows.set(key, {
          code: entry.serviceItemCode,
          name: entry.serviceItemName,
          group: entry.serviceItemGroup,
          prices: new Map(),
        })
      }
      const band = entry.mileageBandKm === 0 ? 'base' : `${entry.mileageBandKm}`
      rows.get(key)!.prices.set(`${entry.vehicleModel}|${band}`, entry.price)
    }
    return [...rows.values()].sort((a, b) => a.name.localeCompare(b.name))
  }, [filtered])

  const columnKeys = useMemo(() => {
    const keys = new Set<string>()
    for (const entry of filtered) {
      const band = entry.mileageBandKm === 0 ? 'base' : `${entry.mileageBandKm}`
      keys.add(`${entry.vehicleModel}|${band}`)
    }
    return [...keys].sort()
  }, [filtered])

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Price book</h1>
          <p className="muted">Published service prices by model and mileage band.</p>
        </div>
        {board && (
          <div className="meta-pill">
            v{board.version.versionNumber} · {board.version.currency}
            {board.version.priceInclusive ? ' · VAT inclusive' : ''}
          </div>
        )}
      </header>

      {loading && <p className="muted">Loading…</p>}
      {error && !loading && (
        <section className="panel empty-state">
          <p>{error}</p>
          <p className="muted">An admin can import and publish prices from the Elizade admin portal.</p>
        </section>
      )}

      {board && (
        <>
          {board.version.disclaimer && (
            <section className="panel disclaimer">
              <strong>Disclaimer</strong>
              <p>{board.version.disclaimer}</p>
            </section>
          )}

          <div className="toolbar">
            <label>
              Model
              <select value={modelFilter} onChange={(e) => setModelFilter(e.target.value)}>
                <option value="">All models</option>
                {board.vehicleModels.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </label>
            <label>
              Group
              <select value={groupFilter} onChange={(e) => setGroupFilter(e.target.value)}>
                <option value="">All groups</option>
                {groups.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="table-scroll">
            <table className="data-table compact">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Group</th>
                  {columnKeys.map((key) => {
                    const [model, band] = key.split('|')
                    return (
                      <th key={key}>
                        {model}
                        <small>{band === 'base' ? 'Any mileage' : `${Number(band).toLocaleString()} km`}</small>
                      </th>
                    )
                  })}
                </tr>
              </thead>
              <tbody>
                {matrix.map((row) => (
                  <tr key={row.code}>
                    <td>
                      <strong>{row.name}</strong>
                      <small>{row.code}</small>
                    </td>
                    <td>{row.group}</td>
                    {columnKeys.map((key) => (
                      <td key={key}>{row.prices.has(key) ? formatNaira(row.prices.get(key)!) : '—'}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

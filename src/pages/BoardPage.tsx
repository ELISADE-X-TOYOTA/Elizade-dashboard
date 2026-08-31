import { useEffect, useMemo, useState } from 'react'
import { formatNaira, getPublishedBoard, listServiceItems } from '../api/client'
import type { PriceBookBoard, ServiceItem } from '../api/types'

const GROUP_ORDER = ['periodic', 'chassis', 'engine'] as const

const GROUP_LABELS: Record<(typeof GROUP_ORDER)[number], string> = {
  periodic: 'Periodic maintenance',
  chassis: 'Chassis',
  engine: 'Engine',
}

const DEFAULT_DISCLAIMER =
  'Displayed prices are working estimates inclusive of labour, parts and tax and may vary according to the work actually performed.'

function formatBand(km: number): string {
  return `${km.toLocaleString('en-NG')} km`
}

function useClock(): string {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(id)
  }, [])
  return now.toLocaleString('en-NG', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function groupItems(items: ServiceItem[], group: (typeof GROUP_ORDER)[number]): ServiceItem[] {
  return items.filter((item) => item.group === group).sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
}

export function BoardPage() {
  const clock = useClock()
  const [board, setBoard] = useState<PriceBookBoard | null>(null)
  const [items, setItems] = useState<ServiceItem[]>([])
  const [selectedModel, setSelectedModel] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const [book, catalogue] = await Promise.all([getPublishedBoard(), listServiceItems()])
        if (cancelled) return
        setBoard(book)
        setItems(catalogue)
        setSelectedModel((current) => current || book.vehicleModels[0] || '')
        setError(null)
      } catch (err) {
        if (cancelled) return
        setBoard(null)
        setItems([])
        setError(err instanceof Error ? err.message : 'Unable to load price book')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const priceByKey = useMemo(() => {
    if (!board || !selectedModel) return new Map<string, string>()
    const map = new Map<string, string>()
    for (const entry of board.entries) {
      if (entry.vehicleModel !== selectedModel) continue
      map.set(`${entry.serviceItemCode}|${entry.mileageBandKm}`, entry.price)
    }
    return map
  }, [board, selectedModel])

  const getPrice = (code: string, mileageBandKm: number): string | undefined =>
    priceByKey.get(`${code}|${mileageBandKm}`)

  const disclaimer = board?.version.disclaimer?.trim() || DEFAULT_DISCLAIMER

  if (loading) {
    return (
      <div className="kiosk">
        <header className="kiosk-header">
          <div className="kiosk-brand">
            <img src="/elizade-logo.png" alt="" className="kiosk-logo" width={48} height={48} />
            <div>
              <h1>Elizade Service Board</h1>
              <p>Periodic maintenance &amp; service prices</p>
            </div>
          </div>
        </header>
        <p className="kiosk-message muted">Loading prices…</p>
      </div>
    )
  }

  if (error || !board) {
    return (
      <div className="kiosk">
        <header className="kiosk-header">
          <div className="kiosk-brand">
            <img src="/elizade-logo.png" alt="" className="kiosk-logo" width={48} height={48} />
            <div>
              <h1>Elizade Service Board</h1>
              <p>Periodic maintenance &amp; service prices</p>
            </div>
          </div>
        </header>
        <div className="kiosk-empty">
          <p className="kiosk-message">{error ?? 'No published price book yet'}</p>
          <p className="kiosk-message muted">Prices will appear here once published from Elizade Connect.</p>
        </div>
        <footer className="kiosk-footer">
          <p>{DEFAULT_DISCLAIMER}</p>
        </footer>
      </div>
    )
  }

  return (
    <div className="kiosk">
      <header className="kiosk-header">
        <div className="kiosk-brand">
          <img src="/elizade-logo.png" alt="" className="kiosk-logo" width={48} height={48} />
          <div>
            <h1>Elizade Service Board</h1>
            <p>Periodic maintenance &amp; service prices</p>
          </div>
        </div>
        <div className="kiosk-meta">
          <span className="kiosk-pill">
            v{board.version.versionNumber}
            {board.version.priceInclusive ? ' · VAT inclusive' : ''}
          </span>
          <span className="kiosk-clock">{clock}</span>
        </div>
      </header>

      <nav className="model-tabs" aria-label="Vehicle model">
        {board.vehicleModels.map((model) => (
          <button
            key={model}
            type="button"
            className={model === selectedModel ? 'active' : undefined}
            onClick={() => setSelectedModel(model)}
          >
            {model}
          </button>
        ))}
      </nav>

      <main className="kiosk-sections">
        {GROUP_ORDER.map((group) => {
          const rows = groupItems(items, group)
          if (rows.length === 0) return null

          const isPeriodic = group === 'periodic'
          const bands = isPeriodic ? board.mileageBandsKm : []

          return (
            <section key={group} className="board-section">
              <h2>{GROUP_LABELS[group]}</h2>
              <div className="table-scroll">
                <table className={`board-table${isPeriodic ? '' : ' board-table-flat'}`}>
                  <thead>
                    <tr>
                      <th scope="col">Service item</th>
                      {isPeriodic ? (
                        bands.map((band) => (
                          <th key={band} scope="col">
                            {formatBand(band)}
                          </th>
                        ))
                      ) : (
                        <th scope="col">Price</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((item) => (
                      <tr key={item.code}>
                        <td className="item-cell">{item.name}</td>
                        {isPeriodic ? (
                          bands.map((band) => {
                            const price = getPrice(item.code, band)
                            return (
                              <td key={band} className="price-cell">
                                {price != null ? formatNaira(price) : '—'}
                              </td>
                            )
                          })
                        ) : (
                          <td className="price-cell">
                            {(() => {
                              const price = getPrice(item.code, 0)
                              return price != null ? formatNaira(price) : '—'
                            })()}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )
        })}
      </main>

      <footer className="kiosk-footer">
        <p>{disclaimer}</p>
      </footer>
    </div>
  )
}

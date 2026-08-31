import { useEffect, useMemo, useState } from 'react'
import { KioskHeader } from '../components/KioskHeader'
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

/** Seconds each model stays on screen before auto-advancing (wall TV). */
const MODEL_ROTATE_SECONDS = 25
/** After a manual tab pick, resume auto-rotation after this many seconds. */
const MANUAL_PAUSE_SECONDS = 120

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
  const [rotationPaused, setRotationPaused] = useState(false)
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

  const models = board?.vehicleModels ?? []

  useEffect(() => {
    if (models.length < 2 || rotationPaused) return

    const id = window.setInterval(() => {
      setSelectedModel((current) => {
        const idx = models.indexOf(current)
        const next = idx >= 0 ? (idx + 1) % models.length : 0
        return models[next] ?? current
      })
    }, MODEL_ROTATE_SECONDS * 1000)

    return () => window.clearInterval(id)
  }, [models, rotationPaused])

  useEffect(() => {
    if (!rotationPaused) return
    const id = window.setTimeout(() => setRotationPaused(false), MANUAL_PAUSE_SECONDS * 1000)
    return () => window.clearTimeout(id)
  }, [rotationPaused, selectedModel])

  function selectModel(model: string) {
    setSelectedModel(model)
    setRotationPaused(true)
  }

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
        <KioskHeader />
        <p className="kiosk-message muted">Loading prices…</p>
      </div>
    )
  }

  if (error || !board) {
    return (
      <div className="kiosk">
        <KioskHeader />
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
      <KioskHeader
        meta={
          <div className="kiosk-meta">
            <span className="kiosk-pill">
              v{board.version.versionNumber}
              {board.version.priceInclusive ? ' · VAT inclusive' : ''}
            </span>
            <span className="kiosk-clock">{clock}</span>
          </div>
        }
      />

      <nav
        className="model-tabs"
        aria-label="Vehicle model"
        style={{ ['--rotate-duration' as string]: `${MODEL_ROTATE_SECONDS}s` }}
      >
        {board.vehicleModels.map((model) => (
          <button
            key={model}
            type="button"
            className={[
              model === selectedModel ? 'active' : undefined,
              model === selectedModel && !rotationPaused && models.length > 1 ? 'rotating' : undefined,
            ]
              .filter(Boolean)
              .join(' ')}
            onClick={() => selectModel(model)}
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
          const bands = board.mileageBandsKm

          return (
            <section key={group} className="board-section">
              <h2>{GROUP_LABELS[group]}</h2>
              <div className="table-scroll">
                <table className="board-table">
                  <colgroup>
                    <col className="col-item" />
                    {bands.map((band) => (
                      <col key={band} className="col-price" />
                    ))}
                  </colgroup>
                  <thead>
                    <tr>
                      <th scope="col">Service item</th>
                      {isPeriodic ? (
                        bands.map((band) => (
                          <th key={band} scope="col" className="band-header">
                            {formatBand(band)}
                          </th>
                        ))
                      ) : (
                        <>
                          {bands.slice(0, -1).map((band) => (
                            <th key={band} scope="col" className="band-header band-header-spacer" aria-hidden="true" />
                          ))}
                          <th scope="col" className="band-header">
                            Price
                          </th>
                        </>
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
                          bands.map((band, index) => {
                            const isPriceCol = index === bands.length - 1
                            const price = isPriceCol ? getPrice(item.code, 0) : undefined
                            return (
                              <td key={band} className={`price-cell${isPriceCol ? ' price-cell-primary' : ' price-cell-empty'}`}>
                                {price != null ? formatNaira(price) : ''}
                              </td>
                            )
                          })
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

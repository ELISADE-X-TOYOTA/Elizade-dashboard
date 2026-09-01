import type { PriceBookBoard, ServiceItem } from './types'
import { demoPriceBook, demoServiceItems } from './demoData'

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ?? ''

/**
 * Serve built-in sample prices instead of calling an API.
 *
 * ON BY DEFAULT. This board is a standalone page — it opens and shows a full
 * price matrix with no backend, no database and no servers running.
 *
 * Switch to a real backend with `?live` in the URL, or VITE_DEMO_DATA=false at
 * build time. When that is done the board calls the API for real and a failure
 * shows an error; it never silently falls back to these invented figures,
 * because a board quietly misquoting customers is worse than one that is
 * visibly broken.
 *
 * While sample data is in use the header carries a red badge saying so.
 */
export const DEMO_MODE: boolean = (() => {
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search)
    if (params.has('live')) return false
    if (params.has('demo')) return true
  }
  return import.meta.env.VITE_DEMO_DATA !== 'false'
})()

/** Keeps the demo feeling like a real board rather than an instant local render. */
const DEMO_LATENCY_MS = 250

function demoResponse<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), DEMO_LATENCY_MS))
}

type ApiError = { detail?: string | { msg?: string }[] }

async function parseError(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as ApiError
    if (typeof body.detail === 'string') return body.detail
    if (Array.isArray(body.detail)) {
      return body.detail.map((e) => e.msg ?? JSON.stringify(e)).join('; ')
    }
  } catch {
    /* ignore */
  }
  return res.statusText || `Request failed (${res.status})`
}

async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      ...(init.headers ?? {}),
    },
  })
  if (!res.ok) throw new Error(await parseError(res))
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export function getPublishedBoard(): Promise<PriceBookBoard> {
  if (DEMO_MODE) return demoResponse(demoPriceBook())
  return apiFetch('/api/v1/service-board/price-book')
}

export function listServiceItems(group?: string): Promise<ServiceItem[]> {
  if (DEMO_MODE) {
    const items = demoServiceItems()
    return demoResponse(group ? items.filter((item) => item.group === group) : items)
  }
  const q = group ? `?group=${encodeURIComponent(group)}` : ''
  return apiFetch(`/api/v1/service-board/items${q}`)
}

export function formatNaira(value: string | number): string {
  const n = typeof value === 'string' ? Number(value) : value
  if (Number.isNaN(n)) return String(value)
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(n)
}

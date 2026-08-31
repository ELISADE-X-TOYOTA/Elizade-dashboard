import type { PriceBookBoard, ServiceItem } from './types'

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ?? ''

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
  return apiFetch('/api/v1/service-board/price-book')
}

export function listServiceItems(group?: string): Promise<ServiceItem[]> {
  const q = group ? `?group=${encodeURIComponent(group)}` : ''
  return apiFetch(`/api/v1/service-board/items${q}`)
}

export function formatNaira(value: string | number): string {
  const n = typeof value === 'string' ? Number(value) : value
  if (Number.isNaN(n)) return String(value)
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(n)
}

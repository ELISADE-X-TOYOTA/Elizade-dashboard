import type {
  AuthToken,
  PaginatedHistory,
  PriceBookBoard,
  PriceImportPreview,
  PriceImportPublish,
  PriceBookVersion,
  ServiceHistoryItem,
  ServiceItem,
  UserProfile,
} from './types'

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ?? ''

type ApiError = { detail?: string | { msg?: string }[] }

function authHeaders(token: string | null): HeadersInit {
  const headers: HeadersInit = { Accept: 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`
  return headers
}

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

async function apiFetch<T>(path: string, init: RequestInit = {}, token: string | null = null): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      ...authHeaders(token),
      ...(init.headers ?? {}),
    },
  })
  if (!res.ok) throw new Error(await parseError(res))
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

function mapUser(raw: Record<string, unknown>): UserProfile {
  return {
    id: String(raw.id),
    firstName: String(raw.firstName),
    lastName: String(raw.lastName),
    email: String(raw.email),
    role: raw.role as UserProfile['role'],
  }
}

export async function requestOtp(email: string): Promise<{ message: string; expiresInMinutes: number }> {
  const raw = await apiFetch<{ message: string; expires_in_minutes: number }>('/api/v1/auth/otp/request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, purpose: 'login' }),
  })
  return { message: raw.message, expiresInMinutes: raw.expires_in_minutes }
}

export async function verifyOtp(email: string, code: string): Promise<AuthToken> {
  const raw = await apiFetch<{
    access_token: string
    refresh_token: string | null
    user: Record<string, unknown>
  }>('/api/v1/auth/otp/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, code }),
  })
  return {
    accessToken: raw.access_token,
    refreshToken: raw.refresh_token,
    user: mapUser(raw.user),
  }
}

export function listServiceItems(token: string, group?: string): Promise<ServiceItem[]> {
  const q = group ? `?group=${encodeURIComponent(group)}` : ''
  return apiFetch(`/api/v1/admin/service/items${q}`, {}, token)
}

export function createServiceItem(
  token: string,
  body: { code: string; name: string; group: string; description?: string },
): Promise<ServiceItem> {
  return apiFetch('/api/v1/admin/service/items', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }, token)
}

export function updateServiceItem(
  token: string,
  id: string,
  body: Partial<{ name: string; group: string; isActive: boolean }>,
): Promise<ServiceItem> {
  return apiFetch(`/api/v1/admin/service/items/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }, token)
}

export function listHistory(
  token: string,
  params: { unmappedOnly?: boolean; page?: number; size?: number } = {},
): Promise<PaginatedHistory> {
  const search = new URLSearchParams()
  if (params.unmappedOnly) search.set('unmappedOnly', 'true')
  if (params.page) search.set('page', String(params.page))
  if (params.size) search.set('size', String(params.size ?? 20))
  const q = search.toString()
  return apiFetch(`/api/v1/admin/service/history${q ? `?${q}` : ''}`, {}, token)
}

export function getHistory(token: string, id: string): Promise<ServiceHistoryItem> {
  return apiFetch(`/api/v1/admin/service/history/${id}`, {}, token)
}

export function replaceHistoryLines(
  token: string,
  id: string,
  lines: Array<{ serviceItemId: string; operation: string }>,
): Promise<ServiceHistoryItem> {
  return apiFetch(`/api/v1/admin/service/history/${id}/lines`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lines }),
  }, token)
}

export function getPublishedBoard(token: string): Promise<PriceBookBoard> {
  return apiFetch('/api/v1/admin/service/price-book/board', {}, token)
}

export function listPriceVersions(token: string): Promise<PriceBookVersion[]> {
  return apiFetch('/api/v1/admin/service/price-book/versions', {}, token)
}

export async function downloadImportTemplate(token: string): Promise<Blob> {
  const res = await fetch(`${API_BASE}/api/v1/admin/service/price-book/import/template`, {
    headers: authHeaders(token),
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.blob()
}

export async function previewPriceImport(token: string, file: File): Promise<PriceImportPreview> {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch(`${API_BASE}/api/v1/admin/service/price-book/import/preview`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

export async function publishPriceImport(
  token: string,
  file: File,
  opts: { disclaimer?: string; effectiveFrom?: string } = {},
): Promise<PriceImportPublish> {
  const form = new FormData()
  form.append('file', file)
  if (opts.disclaimer) form.append('disclaimer', opts.disclaimer)
  if (opts.effectiveFrom) form.append('effectiveFrom', opts.effectiveFrom)
  const res = await fetch(`${API_BASE}/api/v1/admin/service/price-book/import/publish`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

export function formatNaira(value: string | number): string {
  const n = typeof value === 'string' ? Number(value) : value
  if (Number.isNaN(n)) return String(value)
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(n)
}

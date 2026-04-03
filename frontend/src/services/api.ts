import type { CreditReport } from './types'

/**
 * Base URL for the FastAPI app (no trailing slash).
 *
 * - **Dev:** leave `VITE_BACKEND_URL` unset to use same-origin `/api` + Vite proxy (see vite.config.ts).
 * - **Prod (split hosts):** set `VITE_BACKEND_URL` to your Render URL, e.g. `https://api.example.onrender.com`.
 * - **Prod (same host):** leave unset and route `/api` to the API via your host’s reverse proxy / rewrites.
 */
function apiBaseUrl(): string {
  const raw = import.meta.env.VITE_BACKEND_URL
  if (typeof raw === 'string' && raw.trim() !== '') {
    return raw.replace(/\/$/, '')
  }
  return ''
}

async function request<T>(path: string): Promise<T> {
  const base = apiBaseUrl()
  const url = `${base}${path.startsWith('/') ? path : `/${path}`}`
  const response = await fetch(url)
  if (!response.ok) {
    const message = await response.text().catch(() => response.statusText)
    throw new Error(`API error ${response.status}: ${message}`)
  }
  return response.json() as Promise<T>
}

export async function getSampleReport(): Promise<CreditReport> {
  return request<CreditReport>('/api/report/get')
}

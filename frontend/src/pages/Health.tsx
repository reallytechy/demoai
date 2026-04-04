import { useEffect, useState } from 'react'
import Navbar from '../components/Navbar'

interface HealthData {
  status: string
  version: string
  agents: string[]
}

interface EndpointResult {
  name: string
  path: string
  status: 'loading' | 'ok' | 'error'
  code?: number
  time?: number
}

const ENDPOINTS = [
  { name: 'Health Check', path: '/health' },
  { name: 'Credit Report', path: '/api/report/get' },
  { name: 'Dashboard Overview', path: '/api/dashboard/overview' },
  { name: 'Debt Breakdown', path: '/api/dashboard/debt-breakdown' },
  { name: 'Payoff Plan', path: '/api/dashboard/payoff-plan' },
  { name: 'Budget Analysis', path: '/api/dashboard/budget-analysis' },
  { name: 'AI Insights', path: '/api/dashboard/insights' },
  { name: 'Document List', path: '/api/documents' },
]

function apiBaseUrl(): string {
  const raw = import.meta.env.VITE_BACKEND_URL
  if (typeof raw === 'string' && raw.trim() !== '') return raw.replace(/\/$/, '')
  return ''
}

export default function Health() {
  const [health, setHealth] = useState<HealthData | null>(null)
  const [results, setResults] = useState<EndpointResult[]>(
    ENDPOINTS.map((e) => ({ ...e, status: 'loading' as const }))
  )

  useEffect(() => {
    const base = apiBaseUrl()

    // Fetch health
    fetch(`${base}/health`)
      .then((r) => r.json())
      .then((d) => setHealth(d))
      .catch(() => {})

    // Test all endpoints
    ENDPOINTS.forEach((ep, i) => {
      const start = Date.now()
      fetch(`${base}${ep.path}`)
        .then((r) => {
          const time = Date.now() - start
          setResults((prev) => {
            const next = [...prev]
            next[i] = { ...next[i], status: r.ok ? 'ok' : 'error', code: r.status, time }
            return next
          })
        })
        .catch(() => {
          setResults((prev) => {
            const next = [...prev]
            next[i] = { ...next[i], status: 'error', code: 0, time: Date.now() - start }
            return next
          })
        })
    })
  }, [])

  const passed = results.filter((r) => r.status === 'ok').length
  const failed = results.filter((r) => r.status === 'error').length
  const loading = results.filter((r) => r.status === 'loading').length

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="pt-20 pb-12 px-4 max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">API Health Check</h1>
        <p className="text-slate-500 mb-6">Backend status and endpoint verification</p>

        {/* Status banner */}
        {health ? (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-5 mb-6">
            <div className="flex items-center gap-3 mb-3">
              <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              <span className="font-semibold text-green-800">Backend Online</span>
              <span className="text-sm text-green-600 ml-auto">v{health.version}</span>
            </div>
            <div className="text-sm text-green-700">
              <span className="font-medium">Agents: </span>
              {health.agents.map((a) => (
                <span key={a}>
                  <span className="inline-block bg-green-100 text-green-800 px-2 py-0.5 rounded-md text-xs font-medium mr-1 mb-1">{a}</span>
                </span>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5 mb-6">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 bg-red-500 rounded-full" />
              <span className="font-semibold text-red-800">Backend Offline</span>
            </div>
            <p className="text-sm text-red-600 mt-2">
              Start the backend: <code className="bg-red-100 px-1.5 py-0.5 rounded text-xs">cd backend && source venv/bin/activate && uvicorn app.main:app --port 8001</code>
            </p>
          </div>
        )}

        {/* Summary */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{passed}</div>
            <div className="text-xs text-slate-500">Passed</div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{failed}</div>
            <div className="text-xs text-slate-500">Failed</div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
            <div className="text-2xl font-bold text-slate-400">{loading}</div>
            <div className="text-xs text-slate-500">Loading</div>
          </div>
        </div>

        {/* Endpoint results */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 bg-slate-50">
            <div className="grid grid-cols-12 text-xs font-medium text-slate-500 uppercase tracking-wide">
              <div className="col-span-1">Status</div>
              <div className="col-span-5">Endpoint</div>
              <div className="col-span-4">Path</div>
              <div className="col-span-2 text-right">Time</div>
            </div>
          </div>
          {results.map((r) => (
            <div key={r.path} className="px-5 py-3 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
              <div className="grid grid-cols-12 items-center text-sm">
                <div className="col-span-1">
                  {r.status === 'loading' && <span className="w-2.5 h-2.5 bg-slate-300 rounded-full inline-block animate-pulse" />}
                  {r.status === 'ok' && <span className="w-2.5 h-2.5 bg-green-500 rounded-full inline-block" />}
                  {r.status === 'error' && <span className="w-2.5 h-2.5 bg-red-500 rounded-full inline-block" />}
                </div>
                <div className="col-span-5 font-medium text-slate-900">{r.name}</div>
                <div className="col-span-4 text-slate-500 font-mono text-xs">{r.path}</div>
                <div className="col-span-2 text-right text-slate-400 text-xs">
                  {r.time !== undefined ? `${r.time}ms` : '...'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

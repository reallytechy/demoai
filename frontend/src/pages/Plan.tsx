import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'

function fmt(n: number) {
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n)
}

export default function Plan() {
  const [plan, setPlan] = useState<any>(null)
  const [hasPlan, setHasPlan] = useState(false)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')

  const base = import.meta.env.VITE_BACKEND_URL || ''

  useEffect(() => {
    fetch(`${base}/api/plan`)
      .then((r) => r.json())
      .then((d) => { setHasPlan(d.has_plan); if (d.has_plan) setPlan(d) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [base])

  const handleGenerate = async () => {
    setGenerating(true)
    setError('')
    try {
      const r = await fetch(`${base}/api/plan/generate`, { method: 'POST' })
      if (!r.ok) {
        const d = await r.json().catch(() => ({ detail: 'Failed' }))
        throw new Error(d.detail || 'Generation failed')
      }
      const d = await r.json()
      setPlan(d)
      setHasPlan(true)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setGenerating(false)
    }
  }

  if (loading) {
    return <div className="min-h-screen bg-slate-50"><Navbar /><div className="pt-20 text-center text-slate-500">Loading...</div></div>
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="pt-20 pb-12 px-4 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Your Financial Plan</h1>
            <p className="text-slate-500 text-sm">Personalized plan generated from your uploaded documents</p>
          </div>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50 text-sm font-medium transition-colors"
          >
            {generating ? 'Generating...' : hasPlan ? 'Regenerate' : 'Generate Plan'}
          </button>
        </div>

        {generating && (
          <div className="bg-brand-50 border border-brand-200 rounded-2xl p-6 mb-6 text-center">
            <div className="w-8 h-8 border-3 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <div className="text-sm font-medium text-brand-800">Generating your personalized financial plan...</div>
            <div className="text-xs text-brand-600 mt-1">Analyzing documents with 4 specialist agents. This takes 30-60 seconds.</div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6 text-sm text-red-800">{error}</div>
        )}

        {!hasPlan && !generating && (
          <div className="text-center py-16">
            <svg className="w-16 h-16 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-slate-500 mb-2">No plan generated yet</p>
            <p className="text-xs text-slate-400 mb-4">Upload your financial documents first, then generate your plan.</p>
            <Link to="/upload" className="text-brand-600 hover:text-brand-700 text-sm font-medium">Upload documents &rarr;</Link>
          </div>
        )}

        {hasPlan && plan && !generating && (
          <div className="space-y-6">
            {/* Snapshot */}
            {plan.snapshot && !plan.snapshot.raw && (
              <Section title="Financial Snapshot" icon="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" color="blue">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <SnapCard label="Monthly Income" value={`₹${fmt(plan.snapshot.monthly_income || 0)}`} color="green" />
                  <SnapCard label="Monthly Expenses" value={`₹${fmt(plan.snapshot.monthly_expenses || 0)}`} color="red" />
                  <SnapCard label="Credit Score" value={`${plan.snapshot.credit_score || '—'}`} color={plan.snapshot.credit_score < 600 ? 'red' : plan.snapshot.credit_score < 700 ? 'amber' : 'green'} />
                  <SnapCard label="Total Debt" value={`₹${fmt(plan.snapshot.total_debt || 0)}`} color="red" />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
                  <SnapCard label="Monthly Surplus" value={`₹${fmt(plan.snapshot.monthly_surplus || 0)}`} color="green" />
                  <SnapCard label="DTI Ratio" value={`${plan.snapshot.debt_to_income_pct || 0}%`} color="amber" />
                  <SnapCard label="Score Band" value={plan.snapshot.credit_score_band || '—'} color="blue" />
                </div>
                {plan.snapshot.accounts?.length > 0 && (
                  <div className="mt-4">
                    <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Accounts Found</div>
                    <div className="flex flex-wrap gap-2">
                      {plan.snapshot.accounts.map((a: any, i: number) => (
                        <span key={i} className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded-lg">
                          {a.name} — {a.type} {a.balance ? `(₹${fmt(a.balance)})` : ''} <span className={a.status === 'Active' ? 'text-green-600' : 'text-red-500'}>{a.status}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </Section>
            )}

            {/* Urgent Actions */}
            {plan.debt_actions?.actions && (
              <Section title="Urgent Actions" icon="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" color="red">
                {plan.debt_actions.risk_level && (
                  <div className="mb-3">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      plan.debt_actions.risk_level === 'critical' ? 'bg-red-100 text-red-700' :
                      plan.debt_actions.risk_level === 'high' ? 'bg-orange-100 text-orange-700' :
                      plan.debt_actions.risk_level === 'moderate' ? 'bg-amber-100 text-amber-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      Risk: {plan.debt_actions.risk_level.toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="space-y-2">
                  {plan.debt_actions.actions.map((a: any, i: number) => (
                    <div key={i} className="flex items-start gap-3 bg-red-50/50 rounded-lg p-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-red-100 text-red-700 rounded-full flex items-center justify-center text-xs font-bold">{a.priority || i + 1}</span>
                      <div>
                        <div className="text-sm font-medium text-slate-900">{a.action}</div>
                        <div className="text-xs text-slate-500">{a.reason}</div>
                      </div>
                      {a.impact && (
                        <span className={`ml-auto flex-shrink-0 text-xs px-2 py-0.5 rounded-full ${
                          a.impact === 'high' ? 'bg-red-100 text-red-600' : a.impact === 'medium' ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-500'
                        }`}>{a.impact}</span>
                      )}
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Budget Plan */}
            {plan.budget_plan?.recommended_budget && (
              <Section title="Budget Plan (50/30/20)" icon="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" color="purple">
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {['needs', 'wants', 'savings'].map((key) => {
                    const b = plan.budget_plan.recommended_budget[key]
                    if (!b) return null
                    const colors: Record<string, string> = { needs: 'blue', wants: 'purple', savings: 'green' }
                    return (
                      <div key={key} className={`bg-${colors[key]}-50 rounded-xl p-3 text-center`}>
                        <div className="text-lg font-bold text-slate-900">₹{fmt(b.amount)}</div>
                        <div className="text-xs text-slate-500 capitalize">{key} ({b.pct}%)</div>
                      </div>
                    )
                  })}
                </div>
                {plan.budget_plan.top_cuts?.length > 0 && (
                  <div>
                    <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Where to Cut</div>
                    {plan.budget_plan.top_cuts.map((c: any, i: number) => (
                      <div key={i} className="flex items-center justify-between text-sm py-1.5 border-b border-slate-50 last:border-0">
                        <span className="text-slate-700">{c.area}: {c.suggestion}</span>
                        <span className="text-green-600 font-medium">Save ₹{fmt(c.save_amount)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </Section>
            )}

            {/* Payoff Plan */}
            {plan.payoff_plan && !plan.payoff_plan.raw && (
              <Section title="Debt Payoff Plan" icon="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" color="orange">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                  <SnapCard label="Strategy" value={(plan.payoff_plan.strategy || '—').toUpperCase()} color="blue" />
                  <SnapCard label="Debt-Free In" value={plan.payoff_plan.debt_free_date || `${plan.payoff_plan.total_months || '—'} months`} color="green" />
                  <SnapCard label="Extra/Month" value={`₹${fmt(plan.payoff_plan.extra_monthly_payment || 0)}`} color="amber" />
                  <SnapCard label="Interest Saved" value={`₹${fmt(plan.payoff_plan.total_interest_saved || 0)}`} color="green" />
                </div>
                {plan.payoff_plan.reason && (
                  <div className="text-sm text-slate-600 mb-3">{plan.payoff_plan.reason}</div>
                )}
                {plan.payoff_plan.payoff_order?.length > 0 && (
                  <div>
                    <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Payoff Order</div>
                    {plan.payoff_plan.payoff_order.map((p: any, i: number) => (
                      <div key={i} className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0">
                        <span className="w-6 h-6 bg-orange-100 text-orange-700 rounded-full flex items-center justify-center text-xs font-bold">{i + 1}</span>
                        <span className="text-sm text-slate-700 flex-1">{p.name}</span>
                        <span className="text-sm text-slate-500">₹{fmt(p.balance)}</span>
                        <span className="text-xs text-slate-400">Month {p.payoff_month}</span>
                      </div>
                    ))}
                  </div>
                )}
              </Section>
            )}

            {/* Savings Goals */}
            {plan.savings_goals?.phases && (
              <Section title="Savings Goals" icon="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" color="green">
                {plan.savings_goals.emergency_fund_target > 0 && (
                  <div className="bg-green-50 rounded-xl p-3 mb-4 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-green-900">Emergency Fund Target</div>
                      <div className="text-xs text-green-600">{plan.savings_goals.emergency_fund_months || 3} months of expenses</div>
                    </div>
                    <div className="text-lg font-bold text-green-700">₹{fmt(plan.savings_goals.emergency_fund_target)}</div>
                  </div>
                )}
                <div className="space-y-3">
                  {plan.savings_goals.phases.map((p: any, i: number) => (
                    <div key={i} className="flex items-start gap-3 bg-slate-50 rounded-lg p-3">
                      <span className="flex-shrink-0 w-8 h-8 bg-green-100 text-green-700 rounded-lg flex items-center justify-center text-xs font-bold">{i + 1}</span>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-slate-900">{p.name} <span className="text-slate-400 font-normal">(Months {p.months})</span></div>
                        <div className="text-xs text-slate-600 mt-0.5">{p.goal}</div>
                        <div className="text-xs text-slate-500 mt-1">Save ₹{fmt(p.monthly_amount)}/month → Target: ₹{fmt(p.target_total)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            <div className="text-xs text-slate-400 text-center pt-4">
              Generated {new Date(plan.created_at).toLocaleString()} — based on your uploaded documents
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function Section({ title, icon, color, children }: { title: string; icon: string; color: string; children: React.ReactNode }) {
  const iconColors: Record<string, string> = {
    blue: 'text-blue-600 bg-blue-100', red: 'text-red-600 bg-red-100', purple: 'text-purple-600 bg-purple-100',
    orange: 'text-orange-600 bg-orange-100', green: 'text-green-600 bg-green-100',
  }
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconColors[color] || iconColors.blue}`}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
          </svg>
        </div>
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  )
}

function SnapCard({ label, value, color }: { label: string; value: string; color?: string }) {
  const colors: Record<string, string> = { red: 'text-red-600', green: 'text-green-600', amber: 'text-amber-600', blue: 'text-blue-600' }
  return (
    <div className="bg-slate-50 rounded-xl p-3 text-center">
      <div className={`text-lg font-bold ${colors[color || ''] || 'text-slate-900'}`}>{value}</div>
      <div className="text-xs text-slate-400">{label}</div>
    </div>
  )
}

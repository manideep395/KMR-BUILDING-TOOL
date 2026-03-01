import BackButton from '../components/ui/BackButton'
import { useState } from 'react'
import useProjectStore from '../store/projectStore'
import { EmptyState, SectionHeader, AnimatedNumber } from '../components/ui/UIComponents'
import { useNavigate } from 'react-router-dom'
import { simulateScenario } from '../api/client'
import toast from 'react-hot-toast'

export default function SimulatePage() {
    const navigate = useNavigate()
    const { project, calculation } = useProjectStore()
    const [params, setParams] = useState({ budget_change_pct: 0, timeline_change_pct: 0, labor_availability_pct: 100, material_price_spike_pct: 0, weather_disruption_days: 0 })
    const [result, setResult] = useState(null)
    const [loading, setLoading] = useState(false)

    if (!project || !calculation) {
        return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 24px' }}>
            <EmptyState icon="🔮" title="No Project" description="Run a calculation first." action={<button className="btn btn-primary" onClick={() => navigate('/input')}>Start Project</button>} />
        </div>
    }

    const run = async () => {
        setLoading(true)
        try {
            const res = await simulateScenario({ project, base_cost: calculation.total_project_cost, base_duration_days: calculation.phases?.reduce((s, p) => s + p.duration_days, 0) || 300, ...params })
            setResult(res.data)
        } catch (e) { toast.error('Simulation failed') }
        setLoading(false)
    }

    const costChangeColor = !result ? '#94A3B8' : result.cost_change_pct > 15 ? 'var(--red)' : result.cost_change_pct > 5 ? 'var(--amber)' : 'var(--green)'

    const sliders = [
        { key: 'budget_change_pct', label: 'Budget Change (%)', min: -30, max: 30, step: 5, suffix: '%' },
        { key: 'timeline_change_pct', label: 'Timeline Change (%)', min: -20, max: 30, step: 5, suffix: '%' },
        { key: 'labor_availability_pct', label: 'Labor Availability (%)', min: 50, max: 150, step: 5, suffix: '%' },
        { key: 'material_price_spike_pct', label: 'Material Price Spike (%)', min: 0, max: 40, step: 5, suffix: '%' },
        { key: 'weather_disruption_days', label: 'Rain/Disruption Days', min: 0, max: 30, step: 1, suffix: ' days' },
    ]

    return (
        <div style={{ minHeight: '100vh', padding: '88px 24px 60px' }}>
            <div className="container">
                <BackButton />
                <SectionHeader label="What-If Analysis" title="AI Scenario Simulator" subtitle="Adjust project parameters and see how your costs, timeline, and risks change instantly." />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 24 }}>
                    {/* Controls */}
                    <div className="glass-card slide-up" style={{ padding: '28px' }}>
                        <h4 style={{ marginBottom: 20 }}>Scenario Parameters</h4>
                        {sliders.map(s => (
                            <div key={s.key} style={{ marginBottom: 24 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                    <label className="form-label">{s.label}</label>
                                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', color: params[s.key] !== 0 && s.key !== 'labor_availability_pct' ? 'var(--amber)' : 'var(--cyan)' }}>
                                        {params[s.key]}{s.suffix}
                                    </span>
                                </div>
                                <input type="range" min={s.min} max={s.max} step={s.step} value={params[s.key]}
                                    onChange={e => setParams(prev => ({ ...prev, [s.key]: +e.target.value }))}
                                    style={{ width: '100%', accentColor: 'var(--amber)' }} />
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                    <span>{s.min}{s.suffix}</span><span>{s.max}{s.suffix}</span>
                                </div>
                            </div>
                        ))}
                        <button className="btn btn-primary" style={{ width: '100%' }} onClick={run} disabled={loading}>
                            {loading ? 'Simulating...' : '🔮 Run Simulation'}
                        </button>
                        <button className="btn btn-ghost" style={{ width: '100%', marginTop: 8 }} onClick={() => { setParams({ budget_change_pct: 0, timeline_change_pct: 0, labor_availability_pct: 100, material_price_spike_pct: 0, weather_disruption_days: 0 }); setResult(null) }}>Reset</button>
                    </div>

                    {/* Results */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div className="glass-card slide-up delay-1" style={{ padding: '24px' }}>
                            <div className="label" style={{ marginBottom: 12 }}>Baseline vs Scenario</div>
                            <table className="data-table">
                                <thead><tr><th>Metric</th><th>Baseline</th><th>Scenario</th></tr></thead>
                                <tbody>
                                    <tr>
                                        <td>Total Cost</td>
                                        <td className="mono">₹{(calculation.total_project_cost / 100000).toFixed(1)}L</td>
                                        <td className="mono" style={{ color: costChangeColor }}>{result ? `₹${(result.revised_total_cost / 100000).toFixed(1)}L` : '—'}</td>
                                    </tr>
                                    <tr>
                                        <td>Cost Change</td>
                                        <td className="mono">0%</td>
                                        <td className="mono" style={{ color: costChangeColor }}>{result ? `${result.cost_change_pct > 0 ? '+' : ''}${result.cost_change_pct.toFixed(1)}%` : '—'}</td>
                                    </tr>
                                    <tr>
                                        <td>Completion</td>
                                        <td className="mono">{project.end_date}</td>
                                        <td className="mono" style={{ color: result?.days_change > 0 ? 'var(--red)' : 'var(--green)' }}>{result?.revised_completion_date || '—'}</td>
                                    </tr>
                                    <tr>
                                        <td>Days Change</td>
                                        <td className="mono">0</td>
                                        <td className="mono" style={{ color: result?.days_change > 0 ? 'var(--red)' : 'var(--green)' }}>{result ? `${result.days_change > 0 ? '+' : ''}${result.days_change} days` : '—'}</td>
                                    </tr>
                                    <tr>
                                        <td>Risk Change</td>
                                        <td className="mono">—</td>
                                        <td className="mono" style={{ color: result?.risk_score_change > 0 ? 'var(--red)' : 'var(--green)' }}>{result ? `+${result.risk_score_change.toFixed(0)} pts` : '—'}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {result && (
                            <>
                                <div className="glass-card slide-up" style={{ padding: '20px', borderLeft: '3px solid var(--cyan)' }}>
                                    <div className="label" style={{ color: 'var(--cyan)', marginBottom: 8 }}>WORKFORCE REALLOCATION</div>
                                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: 1.6 }}>{result.workforce_reallocation}</p>
                                </div>
                                <div className="glass-card slide-up" style={{ padding: '20px', borderLeft: `3px solid ${costChangeColor}` }}>
                                    <div className="label" style={{ marginBottom: 8 }}>SCENARIO SUMMARY</div>
                                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: 1.6 }}>{result.summary}</p>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}


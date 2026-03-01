import BackButton from '../components/ui/BackButton'
import { useState } from 'react'
import useProjectStore from '../store/projectStore'
import { EmptyState, SectionHeader } from '../components/ui/UIComponents'
import { useNavigate } from 'react-router-dom'
import { aiNegotiate } from '../api/client'
import toast from 'react-hot-toast'

export default function NegotiatePage() {
    const navigate = useNavigate()
    const { project, calculation } = useProjectStore()
    const [params, setParams] = useState({ contractor_name: '', quoted_price: '', scope_of_work: 'Full contract' })
    const [result, setResult] = useState(null)
    const [loading, setLoading] = useState(false)

    if (!project || !calculation) {
        return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 24px' }}>
            <EmptyState icon="🤝" title="No Project Data" description="Run a project calculation first." action={<button className="btn btn-primary" onClick={() => navigate('/input')}>Start Project</button>} />
        </div>
    }

    const run = async () => {
        if (!params.contractor_name || !params.quoted_price) return toast.error('Enter contractor name and quote')
        setLoading(true)
        try {
            const res = await aiNegotiate({ project, your_budget: calculation.total_project_cost, ...params })
            setResult(res.data)
        } catch (e) { }
        setLoading(false)
    }

    return (
        <div style={{ minHeight: '100vh', padding: '88px 24px 60px' }}>
            <div className="container">
                <BackButton />
                <SectionHeader label="Vendor Management" title="AI Negotiation Playbook" subtitle={`Fair market estimate for your project is ₹${(calculation.total_project_cost / 100000).toFixed(1)}L. Get AI scripts to negotiate quotes effectively.`} />

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
                    {/* Form */}
                    <div className="glass-card slide-up" style={{ padding: '24px', height: 'fit-content' }}>
                        <h4 style={{ marginBottom: 20 }}>Contractor Quote Details</h4>
                        <div className="form-group" style={{ marginBottom: 16 }}>
                            <label className="form-label">Contractor Name</label>
                            <input value={params.contractor_name} onChange={e => setParams({ ...params, contractor_name: e.target.value })} placeholder="e.g. Apex Builders" />
                        </div>
                        <div className="form-group" style={{ marginBottom: 16 }}>
                            <label className="form-label">Quoted Price (₹)</label>
                            <input type="number" value={params.quoted_price} onChange={e => setParams({ ...params, quoted_price: +e.target.value })} placeholder="e.g. 8500000" />
                        </div>
                        <div className="form-group" style={{ marginBottom: 24 }}>
                            <label className="form-label">Scope of Work</label>
                            <select value={params.scope_of_work} onChange={e => setParams({ ...params, scope_of_work: e.target.value })}>
                                <option>Full Turnkey Contract (Material + Labor)</option>
                                <option>Labor Contract Only</option>
                                <option>Civil Work Only (Core & Shell)</option>
                                <option>MEP & Finishing Only</option>
                            </select>
                        </div>
                        <button className="btn btn-primary" style={{ width: '100%' }} onClick={run} disabled={loading || !params.contractor_name || !params.quoted_price}>
                            {loading ? 'Analyzing Quote...' : '🧠 Generate Negotiation Script'}
                        </button>
                    </div>

                    {/* Results */}
                    {result && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div className="glass-card slide-up delay-1" style={{ padding: '24px', borderLeft: `4px solid ${result.is_fair ? 'var(--green)' : 'var(--red)'}` }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                    <h4 style={{ margin: 0, color: result.is_fair ? 'var(--green)' : 'var(--red)' }}>
                                        {result.is_fair ? '✅ Fair Quote' : '⚠️ Overpriced Quote'}
                                    </h4>
                                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.2rem', color: result.difference_pct > 0 ? 'var(--red)' : 'var(--green)' }}>
                                        {result.difference_pct > 0 ? '+' : ''}{result.difference_pct.toFixed(1)}%
                                    </div>
                                </div>
                                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{result.analysis}</p>
                            </div>

                            <div className="glass-card slide-up delay-2" style={{ padding: '24px' }}>
                                <div className="label" style={{ color: 'var(--cyan)', marginBottom: 12 }}>💬 NEGOTIATION SCRIPT</div>
                                <div style={{ background: 'rgba(6,182,212,0.05)', border: '1px solid rgba(6,182,212,0.2)', borderRadius: 12, padding: '16px', fontSize: '0.9rem', lineHeight: 1.6, color: 'var(--text-primary)', fontStyle: 'italic', whiteSpace: 'pre-wrap' }}>
                                    "{result.script}"
                                </div>

                                {result.key_data_points && result.key_data_points.length > 0 && (
                                    <>
                                        <div className="label" style={{ color: 'var(--amber)', marginTop: 24, marginBottom: 12 }}>🎯 KEY ARGUMENTS</div>
                                        <ul style={{ margin: 0, paddingLeft: 20, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                                            {result.key_data_points.map((dp, i) => (
                                                <li key={i} style={{ marginBottom: 6 }}>{dp}</li>
                                            ))}
                                        </ul>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}


import useProjectStore from '../store/projectStore'
import BackButton from '../components/ui/BackButton'
import { EmptyState, SectionHeader } from '../components/ui/UIComponents'
import { useNavigate } from 'react-router-dom'

export default function OptimizePage() {
    const navigate = useNavigate()
    const { optimizeData, project } = useProjectStore()

    if (!optimizeData || !project) {
        return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 24px' }}>
            <EmptyState icon="🚀" title="No Optimization Data" description="Run a calculation first." action={<button className="btn btn-primary" onClick={() => navigate('/input')}>Start Project</button>} />
        </div>
    }

    return (
        <div style={{ minHeight: '100vh', padding: '88px 24px 60px' }}>
            <div className="container">
                <BackButton />
                <SectionHeader label="Resource Optimization" title="AI-Powered Schedule Optimizer" subtitle={`Mode: ${project.optimization_priority} — ${optimizeData.summary}`} />

                {/* Summary card */}
                <div className="glass-card slide-up" style={{ padding: '28px', marginBottom: 24, background: 'rgba(245,158,11,0.05)', borderTop: '3px solid var(--amber)' }}>
                    <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', alignItems: 'center' }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '2rem', color: 'var(--green)' }}>₹{Math.abs(optimizeData.total_cost_savings / 1000).toFixed(0)}K</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Cost Savings</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '2rem', color: 'var(--cyan)' }}>{optimizeData.total_days_savings}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Days Saved</div>
                        </div>
                        <div style={{ flex: 1, minWidth: 200 }}>
                            <div className="label" style={{ marginBottom: 8 }}>Key Recommendations</div>
                            {optimizeData.recommendations?.slice(0, 3).map((r, i) => (
                                <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                                    <span style={{ color: 'var(--amber)', flexShrink: 0 }}>→</span> {r}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Phase comparison */}
                <div className="glass-card slide-up" style={{ padding: '24px', marginBottom: 24 }}>
                    <h4 style={{ marginBottom: 16 }}>Phase-by-Phase Optimization</h4>
                    <div className="scrollable">
                        <table className="data-table">
                            <thead><tr><th>Phase</th><th>Original Duration</th><th>Optimized Duration</th><th>Workers Before</th><th>Workers After</th><th>Cost Savings</th></tr></thead>
                            <tbody>
                                {optimizeData.optimized_phases?.map(p => (
                                    <tr key={p.phase}>
                                        <td>{p.phase}</td>
                                        <td className="mono">{p.original_duration} days</td>
                                        <td className="mono" style={{ color: p.optimized_duration < p.original_duration ? 'var(--green)' : 'var(--amber)' }}>{p.optimized_duration} days</td>
                                        <td className="mono">{p.workers_original}</td>
                                        <td className="mono" style={{ color: p.workers_optimized > p.workers_original ? 'var(--amber)' : 'var(--green)' }}>{p.workers_optimized}</td>
                                        <td className="mono" style={{ color: p.cost_savings > 0 ? 'var(--green)' : 'var(--red)' }}>₹{Math.abs(p.cost_savings).toLocaleString('en-IN')}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Material ordering calendar */}
                <div className="glass-card slide-up" style={{ padding: '24px' }}>
                    <h4 style={{ marginBottom: 16 }}>Material Ordering Calendar</h4>
                    <div className="scrollable">
                        <table className="data-table">
                            <thead><tr><th>Material</th><th>Quantity</th><th>Order Date</th><th>Delivery Date</th><th>Notes</th></tr></thead>
                            <tbody>
                                {optimizeData.material_order_calendar?.map((item, i) => (
                                    <tr key={i}>
                                        <td>{item.item}</td>
                                        <td className="mono">{item.quantity_bags || item.quantity_mt || item.quantity_cft || item.quantity_sqft || item['quantity_1000s']}</td>
                                        <td className="mono">{item.order_date}</td>
                                        <td className="mono">{item.delivery_date}</td>
                                        <td style={{ fontSize: '0.82rem', color: 'var(--cyan)' }}>{item.notes}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    )
}


import useProjectStore from '../store/projectStore'
import BackButton from '../components/ui/BackButton'
import { EmptyState, SectionHeader } from '../components/ui/UIComponents'
import { useNavigate } from 'react-router-dom'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { aiSuggest } from '../api/client'
import { useState } from 'react'

const COLORS = ['#F59E0B', '#EF4444', '#06B6D4', '#10B981', '#A855F7']

export default function CarbonPage() {
    const navigate = useNavigate()
    const { carbonData, project } = useProjectStore()
    const [greenAlts, setGreenAlts] = useState([])
    const [loadingGreen, setLoadingGreen] = useState(false)

    if (!carbonData || !project) {
        return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 24px' }}>
            <EmptyState icon="🌿" title="No Carbon Data" description="Run a calculation first." action={<button className="btn btn-primary" onClick={() => navigate('/input')}>Start Project</button>} />
        </div>
    }

    const chartData = carbonData.items?.map(i => ({ name: i.category, value: Math.round(i.co2_kg) })) || []
    const totalTonnes = (carbonData.total_co2_kg / 1000).toFixed(1)

    const loadGreen = async () => {
        setLoadingGreen(true)
        try {
            const r = await aiSuggest({ project, suggestion_type: 'green' })
            setGreenAlts(r.data.alternatives || [])
        } catch (e) { }
        setLoadingGreen(false)
    }

    return (
        <div style={{ minHeight: '100vh', padding: '88px 24px 60px' }}>
            <div className="container">
                <BackButton />
                <SectionHeader label="Environmental Impact" title="Carbon Footprint Estimator" subtitle={`Your project will produce approximately ${totalTonnes} tonnes CO₂e — equivalent to planting ${carbonData.trees_to_offset?.toLocaleString()} trees to offset.`} />

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24, marginBottom: 24 }}>
                    {/* Tree counter card */}
                    <div className="glass-card slide-up" style={{ padding: '28px', textAlign: 'center', borderTop: '3px solid var(--green)' }}>
                        <div style={{ fontSize: '4rem', marginBottom: 8, animation: 'float 3s ease-in-out infinite' }}>🌳</div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '2.5rem', color: 'var(--green)', marginBottom: 4 }}>
                            {carbonData.trees_to_offset?.toLocaleString('en-IN')}
                        </div>
                        <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Trees needed to be carbon neutral</div>
                        <div style={{ marginTop: 12, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            Based on 10-year absorption of 22 kg CO₂/tree/year
                        </div>
                    </div>

                    {/* Donut chart */}
                    <div className="glass-card slide-up delay-1" style={{ padding: '24px' }}>
                        <h4 style={{ marginBottom: 16 }}>Carbon by Category</h4>
                        <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                                <Pie data={chartData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                                    {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                </Pie>
                                <Tooltip formatter={v => [`${v.toLocaleString()} kg CO₂e`]} contentStyle={{ background: '#111418', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 8 }} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Breakdown table */}
                <div className="glass-card slide-up" style={{ padding: '24px', marginBottom: 24 }}>
                    <h4 style={{ marginBottom: 16 }}>Carbon Emissions Breakdown</h4>
                    <table className="data-table">
                        <thead><tr><th>Category</th><th>Quantity</th><th>Emission Factor</th><th>CO₂e (kg)</th><th>% of Total</th></tr></thead>
                        <tbody>
                            {carbonData.items?.map((item, i) => (
                                <tr key={i}>
                                    <td>{item.category}</td>
                                    <td className="mono">{item.quantity_kg?.toLocaleString('en-IN')} kg</td>
                                    <td className="mono">{item.emission_factor} kg/kg</td>
                                    <td className="mono" style={{ color: COLORS[i % COLORS.length] }}>{item.co2_kg?.toLocaleString('en-IN')}</td>
                                    <td className="mono">{carbonData.total_co2_kg ? ((item.co2_kg / carbonData.total_co2_kg) * 100).toFixed(1) : 0}%</td>
                                </tr>
                            ))}
                            <tr style={{ fontWeight: 700 }}>
                                <td>TOTAL</td><td>—</td><td>—</td>
                                <td className="mono" style={{ color: 'var(--amber)' }}>{carbonData.total_co2_kg?.toLocaleString('en-IN')} kg</td>
                                <td className="mono">100%</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Green alternatives */}
                <div className="glass-card slide-up" style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <h4>🌿 Green Alternatives (AI-Powered)</h4>
                        <button className="btn btn-cyan" style={{ padding: '8px 16px', fontSize: '0.82rem' }} onClick={loadGreen} disabled={loadingGreen}>
                            {loadingGreen ? 'Loading...' : 'Get AI Green Tips'}
                        </button>
                    </div>
                    {greenAlts.length === 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {carbonData.green_suggestions?.map((s, i) => (
                                <div key={i} style={{ display: 'flex', gap: 8, fontSize: '0.9rem', color: 'var(--text-secondary)', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                    <span style={{ color: 'var(--green)', flexShrink: 0 }}>🌿</span> {s}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
                            {greenAlts.map((a, i) => (
                                <div key={i} className="glass-card" style={{ padding: '16px', borderTop: '2px solid var(--green)' }}>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--green)', fontWeight: 600, marginBottom: 4 }}>{a.material} → {a.alternative}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 8 }}>{a.description}</div>
                                    <div style={{ display: 'flex', gap: 12, fontSize: '0.75rem' }}>
                                        <span style={{ color: a.cost_delta_pct > 0 ? 'var(--red)' : 'var(--green)' }}>Cost: {a.cost_delta_pct > 0 ? '+' : ''}{a.cost_delta_pct}%</span>
                                        <span style={{ color: 'var(--green)' }}>CO₂: -{a.carbon_saving_pct}%</span>
                                        <span style={{ color: 'var(--cyan)' }}>ROI: {a.long_term_roi_years}yr</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}


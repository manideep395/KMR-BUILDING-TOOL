import useProjectStore from '../store/projectStore'
import BackButton from '../components/ui/BackButton'
import { EmptyState, SectionHeader } from '../components/ui/UIComponents'
import { useNavigate } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts'

const COLORS = ['#F59E0B', '#06B6D4', '#10B981']

export default function BenchmarkPage() {
    const navigate = useNavigate()
    const { benchmarkData, project } = useProjectStore()

    if (!benchmarkData || !project) {
        return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 24px' }}>
            <EmptyState icon="📈" title="No Benchmark Data" description="Run a calculation first." action={<button className="btn btn-primary" onClick={() => navigate('/input')}>Start Project</button>} />
        </div>
    }

    const chartData = [
        { name: 'Your Project', value: benchmarkData.cost_per_sqft, fill: '#F59E0B' },
        { name: 'Industry Avg', value: benchmarkData.industry_avg_per_sqft, fill: '#94A3B8' },
        { name: 'Regional Avg', value: benchmarkData.regional_avg_per_sqft, fill: '#06B6D4' },
        { name: 'Best-in-Class', value: benchmarkData.best_in_class_per_sqft, fill: '#10B981' },
    ]

    const catChartData = benchmarkData.category_comparison?.map(c => ({
        name: c.category.slice(0, 8),
        'Your Cost': Math.round(c.your_cost),
        'Industry': Math.round(c.industry_avg),
        'Regional': Math.round(c.regional_avg),
    })) || []

    const devColor = benchmarkData.deviation_regional > 15 ? 'var(--red)' : benchmarkData.deviation_regional > 5 ? 'var(--amber)' : 'var(--green)'

    return (
        <div style={{ minHeight: '100vh', padding: '88px 24px 60px' }}>
            <div className="container">
                <BackButton />
                <SectionHeader label="Cost Benchmarking" title="Intelligence Benchmark Analysis" subtitle={`Compare your project costs to industry, regional, and best-in-class benchmarks for ${project.city}.`} />

                {/* Overview cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
                    {chartData.map(d => (
                        <div key={d.name} className="glass-card slide-up" style={{ padding: '20px', textAlign: 'center', borderTop: `3px solid ${d.fill}` }}>
                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.6rem', color: d.fill, marginBottom: 4 }}>₹{d.value?.toLocaleString()}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{d.name}</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>per sq ft</div>
                        </div>
                    ))}
                </div>

                {/* AI Insight */}
                <div className="glass-card slide-up" style={{ padding: '20px', marginBottom: 24, borderLeft: '3px solid var(--cyan)' }}>
                    <div className="label" style={{ color: 'var(--cyan)', marginBottom: 8 }}>📊 BENCHMARK INSIGHT</div>
                    <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-primary)', lineHeight: 1.7 }}>{benchmarkData.overall_insight}</p>
                    <div style={{ marginTop: 12, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                        <div>
                            <span className="label">vs Industry: </span>
                            <span style={{ color: benchmarkData.deviation_industry > 10 ? 'var(--red)' : 'var(--green)', fontFamily: 'var(--font-mono)' }}>
                                {benchmarkData.deviation_industry > 0 ? '+' : ''}{benchmarkData.deviation_industry?.toFixed(1)}%
                            </span>
                        </div>
                        <div>
                            <span className="label">vs Regional: </span>
                            <span style={{ color: devColor, fontFamily: 'var(--font-mono)' }}>
                                {benchmarkData.deviation_regional > 0 ? '+' : ''}{benchmarkData.deviation_regional?.toFixed(1)}%
                            </span>
                        </div>
                    </div>
                </div>

                {/* Bar chart comparison */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 20, marginBottom: 24 }}>
                    <div className="glass-card" style={{ padding: '24px' }}>
                        <h4 style={{ marginBottom: 16 }}>Cost Per Sq Ft — Head-to-Head</h4>
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={chartData} layout="vertical">
                                <XAxis type="number" tick={{ fill: '#94A3B8', fontSize: 11 }} tickFormatter={v => `₹${v}`} />
                                <YAxis type="category" dataKey="name" tick={{ fill: '#94A3B8', fontSize: 11 }} width={85} />
                                <Tooltip formatter={v => [`₹${v}/sqft`]} contentStyle={{ background: '#111418', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 8 }} />
                                <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                                    {chartData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="glass-card" style={{ padding: '24px' }}>
                        <h4 style={{ marginBottom: 16 }}>Category-wise Breakdown</h4>
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={catChartData}>
                                <XAxis dataKey="name" tick={{ fill: '#94A3B8', fontSize: 10 }} />
                                <YAxis tick={{ fill: '#94A3B8', fontSize: 10 }} tickFormatter={v => `₹${v}`} />
                                <Tooltip contentStyle={{ background: '#111418', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 8 }} />
                                <Legend />
                                <Bar dataKey="Your Cost" fill="#F59E0B" radius={[3, 3, 0, 0]} />
                                <Bar dataKey="Industry" fill="#94A3B8" radius={[3, 3, 0, 0]} />
                                <Bar dataKey="Regional" fill="#06B6D4" radius={[3, 3, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Category insights table */}
                <div className="glass-card slide-up" style={{ padding: '24px' }}>
                    <h4 style={{ marginBottom: 16 }}>Category-wise Insights</h4>
                    <div className="scrollable">
                        <table className="data-table">
                            <thead><tr><th>Category</th><th>Your Cost/sqft</th><th>Industry Avg</th><th>Deviation</th><th>Insight</th></tr></thead>
                            <tbody>
                                {benchmarkData.category_comparison?.map(c => (
                                    <tr key={c.category}>
                                        <td>{c.category}</td>
                                        <td className="mono">₹{c.your_cost?.toFixed(0)}</td>
                                        <td className="mono">₹{c.industry_avg?.toFixed(0)}</td>
                                        <td className="mono" style={{ color: c.deviation_from_industry > 10 ? 'var(--red)' : c.deviation_from_industry < -5 ? 'var(--green)' : 'var(--amber)' }}>
                                            {c.deviation_from_industry > 0 ? '+' : ''}{c.deviation_from_industry?.toFixed(1)}%
                                        </td>
                                        <td style={{ fontSize: '0.8rem', maxWidth: 220 }}>{c.insight}</td>
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


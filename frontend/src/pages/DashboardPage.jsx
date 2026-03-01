import BackButton from '../components/ui/BackButton'
import { useNavigate } from 'react-router-dom'
import useProjectStore from '../store/projectStore'
import MagneticCard from '../components/anti-gravity/MagneticCard'
import { AnimatedNumber, EmptyState, SectionHeader, RiskBadge } from '../components/ui/UIComponents'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LineChart, Line } from 'recharts'
import { useEffect, useState } from 'react'
import { getAllPrices, aiExplain, getWarnings } from '../api/client'
import { saveAs } from 'file-saver'
import toast from 'react-hot-toast'

const KPI_CONFIG = [
    { key: 'total_project_cost', label: 'Total Project Cost', prefix: '₹', color: 'amber', icon: '💰', route: '/report', format: v => (v / 100000).toFixed(1) + 'L' },
    { key: 'cost_per_sqft', label: 'Cost per Sq Ft', prefix: '₹', color: 'cyan', icon: '📐', route: '/benchmark', format: v => v.toLocaleString() },
    { key: 'duration', label: 'Project Duration', suffix: ' days', color: 'white', icon: '📅', route: '/gantt' },
    { key: 'overall_risk', label: 'Overall Risk Score', suffix: '/100', color: 'red', icon: '⚠️', route: '/risk' },
    { key: 'total_co2', label: 'Carbon Footprint', suffix: ' t CO₂e', color: 'green', icon: '🌿', route: '/carbon' },
    { key: 'compliance_score', label: 'Compliance Score', suffix: '/100', color: 'cyan', icon: '✅', route: '/compliance' },
    { key: 'trees', label: 'Trees to Offset', color: 'green', icon: '🌳', route: '/carbon' },
    { key: 'waste_pct', label: 'Material Waste', suffix: '%', color: 'amber', icon: '♻️', route: '/procurement' },
    { key: 'peak_workers', label: 'Peak Workforce', suffix: ' workers', color: 'white', icon: '👷', route: '/optimize' },
]

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload?.length) {
        return (
            <div style={{ background: '#111418', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 8, padding: '10px 14px', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                <strong>{label}</strong>
                {payload.map((p, i) => {
                    const isDays = p.dataKey === 'days'
                    return (
                        <div key={i} style={{ color: p.color }}>
                            {isDays ? `${p.value} days` : `₹${p.value?.toLocaleString('en-IN')}`}
                        </div>
                    )
                })}
            </div>
        )
    }
    return null
}

export default function DashboardPage() {
    const navigate = useNavigate()
    const { project, calculation, riskData, carbonData, complianceData, procurementData, warningsData, setWarningsData, language } = useProjectStore()
    const [prices, setPrices] = useState([])
    const [aiExplanation, setAiExplanation] = useState('')
    const [warnings, setWarnings] = useState([])

    useEffect(() => {
        getAllPrices().then(r => {
            const cities = r.data?.cities || []
            const data = r.data?.data || {}
            const arr = cities.slice(0, 8).map(c => ({
                city: c,
                cement: data[c]?.cement_per_bag,
                steel: Math.round((data[c]?.steel_per_mt || 0) / 1000),
                steel_raw: data[c]?.steel_per_mt,
                prev_steel: data[c]?.prev_month?.steel_per_mt,
            }))
            setPrices(arr)
        }).catch(() => { })
    }, [])

    useEffect(() => {
        if (!project || !calculation) return
        aiExplain({ project, calculation_result: calculation, language }).then(r => {
            setAiExplanation(r.data.explanation)
        }).catch(() => { })
    }, [project, calculation, language])

    useEffect(() => {
        if (!project || !calculation?.phases) return
        const riskScores = riskData ? {
            budget: riskData.budget_risk?.score,
            delay: riskData.delay_risk?.score,
            labor: riskData.labor_risk?.score,
        } : {}
        getWarnings({ project, phases: calculation.phases, risk_scores: riskScores, current_date: new Date().toISOString().split('T')[0] })
            .then(r => { setWarningsData(r.data); setWarnings(r.data.warnings || []) })
            .catch(() => { })
    }, [project, calculation])

    if (!project || !calculation) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 24px' }}>
                <EmptyState
                    icon="🏗️"
                    title="No Project Loaded"
                    description="Start by entering your project details or using a quick-start template."
                    action={<button className="btn btn-primary" onClick={() => navigate('/input')}>Start New Project</button>}
                />
            </div>
        )
    }

    // Derive KPI values
    const totalPhysicalDays = calculation.phases?.reduce((s, p) => s + p.duration_days, 0) || 0
    const overallRisk = riskData?.overall_risk || 0
    const carbonKg = carbonData?.total_co2_kg || 0
    const trees = carbonData?.trees_to_offset || 0
    const compScore = complianceData?.compliance_score || 0
    const wastePct = procurementData?.items ? (procurementData.items.reduce((s, i) => s + i.waste_pct, 0) / procurementData.items.length).toFixed(1) : 6.2
    const peakWorkers = Math.max(...(calculation.phases?.map(p => p.workers) || [0]))

    const matCostData = calculation.material_costs?.map(m => ({ name: m.category, value: Math.round(m.total) })) || []
    const phaseData = calculation.phases?.map(p => ({ name: p.phase, days: p.duration_days })) || []

    const kpiValues = {
        total_project_cost: calculation.total_project_cost,
        cost_per_sqft: calculation.cost_per_sqft,
        duration: totalPhysicalDays,
        overall_risk: overallRisk,
        total_co2: Math.round(carbonKg / 1000),
        compliance_score: compScore,
        trees,
        waste_pct: parseFloat(wastePct),
        peak_workers: peakWorkers,
    }

    const COLORS = ['#F59E0B', '#06B6D4', '#10B981', '#EF4444', '#A855F7', '#F97316', '#64748B', '#EC4899', '#14B8A6', '#8B5CF6']

    return (
        <div style={{ minHeight: '100vh', padding: '88px 24px 60px' }}>
            {/* Material price ticker */}
            <div className="ticker-wrap" style={{ marginBottom: 0 }}>
                <div className="ticker">
                    {[...prices, ...prices].map((p, i) => (
                        <span key={i} style={{ display: 'inline-flex', gap: 8, alignItems: 'center', fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>
                            <span style={{ color: 'var(--amber)' }}>{p.city}</span>
                            <span style={{ color: 'var(--text-muted)' }}>Cement: ₹{p.cement}/bag</span>
                            <span style={{ color: 'var(--text-muted)' }}>Steel: ₹{p.steel_raw?.toLocaleString('en-IN')}/MT</span>
                            <span style={{ color: p.steel_raw > p.prev_steel ? 'var(--red)' : 'var(--green)' }}>
                                {p.steel_raw > p.prev_steel ? '↑' : '↓'}
                            </span>
                            <span style={{ opacity: 0.3 }}>•</span>
                        </span>
                    ))}
                </div>
            </div>

            <div className="container" style={{ paddingTop: 24 }}>
                <BackButton />
                {/* Warning strip */}
                {warnings.length > 0 && (
                    <div style={{ marginBottom: 24 }}>
                        {warnings.slice(0, 3).map((w, i) => (
                            <div key={i} className={`warning-strip warning-${w.severity}`}>
                                <span style={{ flex: 1 }}>{w.message}</span>
                                <button className="btn btn-ghost" style={{ padding: '4px 10px', fontSize: '0.72rem' }}
                                    onClick={() => toast.success(w.recommendation)}>
                                    What to do?
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 32 }}>
                    <div>
                        <div className="label" style={{ marginBottom: 8 }}>PROJECT INTELLIGENCE DASHBOARD</div>
                        <h2 style={{ marginBottom: 4 }}>{project.project_name}</h2>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            <span className="badge badge-cyan">{project.project_type}</span>
                            <span className="badge badge-amber">{project.quality_grade}</span>
                            <span className="badge badge-gray">{project.city}, {project.state}</span>
                            <span className="badge badge-gray">{project.area_sqft?.toLocaleString()} sqft · {project.floors}F</span>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <button className="btn btn-ghost" onClick={() => navigate('/input')}>Edit Project</button>
                        <button className="btn btn-primary" onClick={() => navigate('/report')}>📄 Download Report</button>
                    </div>
                </div>

                {/* KPI Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
                    {KPI_CONFIG.map((kpi, i) => {
                        const raw = kpiValues[kpi.key] || 0
                        const riskColor = kpi.key === 'overall_risk' && raw > 70 ? 'red' : kpi.key === 'overall_risk' && raw > 45 ? 'amber' : kpi.color
                        return (
                            <MagneticCard
                                key={kpi.key}
                                className={`slide-up delay-${(i % 8) + 1} ${raw > 70 && kpi.key === 'overall_risk' ? 'pulse-red' : ''}`}
                                style={{ padding: '20px' }}
                                onClick={() => navigate(kpi.route)}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                                    <span className="label" style={{ fontSize: '0.65rem' }}>{kpi.label}</span>
                                    <span style={{ fontSize: '1.2rem' }}>{kpi.icon}</span>
                                </div>
                                <div className={`kpi-number kpi-${riskColor}`} style={{ fontSize: '1.5rem' }}>
                                    {kpi.key === 'total_project_cost'
                                        ? `₹${(raw / 100000).toFixed(1)}L`
                                        : <AnimatedNumber value={raw} prefix={kpi.prefix || ''} suffix={kpi.suffix || ''} decimals={kpi.key === 'waste_pct' ? 1 : 0} />
                                    }
                                </div>
                                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 4 }}>Click to explore →</div>
                            </MagneticCard>
                        )
                    })}
                </div>

                {/* AI Explanation */}
                {aiExplanation && (
                    <div className="glass-card slide-up" style={{ padding: '24px', marginBottom: 28, borderLeft: '3px solid var(--cyan)' }}>
                        <div className="label" style={{ color: 'var(--cyan)', marginBottom: 10 }}>🧠 AI ANALYSIS</div>
                        <p style={{ color: 'var(--text-primary)', lineHeight: 1.8, fontSize: '0.95rem', margin: 0 }}>{aiExplanation}</p>
                    </div>
                )}

                {/* Charts Row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 20, marginBottom: 28 }}>
                    {/* Material Cost Breakdown */}
                    <div className="glass-card" style={{ padding: '24px' }}>
                        <h4 style={{ marginBottom: 16 }}>Material Cost Breakdown</h4>
                        <ResponsiveContainer width="100%" height={240}>
                            <BarChart data={matCostData}>
                                <XAxis dataKey="name" tick={{ fill: '#94A3B8', fontSize: 11 }} angle={-30} textAnchor="end" interval={0} height={50} />
                                <YAxis tick={{ fill: '#94A3B8', fontSize: 11 }} tickFormatter={v => `₹${(v / 100000).toFixed(0)}L`} />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                    {matCostData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Phase Timeline */}
                    <div className="glass-card" style={{ padding: '24px' }}>
                        <h4 style={{ marginBottom: 16 }}>Phase Timeline (days)</h4>
                        <ResponsiveContainer width="100%" height={240}>
                            <BarChart data={phaseData} layout="vertical">
                                <XAxis type="number" tick={{ fill: '#94A3B8', fontSize: 11 }} />
                                <YAxis type="category" dataKey="name" tick={{ fill: '#94A3B8', fontSize: 11 }} width={80} />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="days" fill="var(--amber)" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Cost Variants */}
                <div className="glass-card slide-up" style={{ padding: '24px', marginBottom: 28 }}>
                    <h4 style={{ marginBottom: 20 }}>Cost Estimate Variants (Monte Carlo)</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                        {[
                            { label: '🟢 Optimistic', value: calculation.cost_variants?.optimistic, color: 'var(--green)' },
                            { label: '🟡 Most Likely', value: calculation.cost_variants?.most_likely, color: 'var(--amber)' },
                            { label: '🔴 Pessimistic', value: calculation.cost_variants?.pessimistic, color: 'var(--red)' },
                        ].map(v => (
                            <div key={v.label} style={{ textAlign: 'center', padding: '20px', background: 'rgba(255,255,255,0.03)', borderRadius: 12, border: `1px solid ${v.color}30` }}>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 6 }}>{v.label}</div>
                                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.4rem', color: v.color }}>
                                    ₹{((v.value || 0) / 100000).toFixed(1)}L
                                </div>
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>₹{(v.value || 0).toLocaleString('en-IN')}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Material Quantities */}
                <div className="glass-card slide-up" style={{ padding: '24px' }}>
                    <h4 style={{ marginBottom: 16 }}>Material Quantities Required</h4>
                    <div className="scrollable">
                        <table className="data-table">
                            <thead><tr>
                                <th>Material</th><th>Quantity</th><th>Unit</th>
                            </tr></thead>
                            <tbody>
                                {[
                                    { name: 'Cement (OPC 53)', qty: calculation.material_quantities?.cement_bags, unit: 'bags' },
                                    { name: 'Steel TMT Fe500', qty: calculation.material_quantities?.steel_mt, unit: 'MT' },
                                    { name: 'River Sand', qty: calculation.material_quantities?.sand_cft, unit: 'cft' },
                                    { name: 'Aggregate (20mm)', qty: calculation.material_quantities?.aggregate_cft, unit: 'cft' },
                                    { name: 'Bricks / Blocks', qty: calculation.material_quantities?.bricks_count, unit: 'nos' },
                                    { name: 'Paint (2 coats)', qty: calculation.material_quantities?.paint_liters, unit: 'liters' },
                                    { name: 'Floor Tiles', qty: calculation.material_quantities?.tiles_sqft, unit: 'sqft' },
                                ].map(r => (
                                    <tr key={r.name}>
                                        <td>{r.name}</td>
                                        <td className="mono">{r.qty?.toLocaleString('en-IN')}</td>
                                        <td style={{ color: 'var(--amber)' }}>{r.unit}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Quick nav to all features */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12, marginTop: 28 }}>
                    {[
                        { label: '📊 Gantt Chart', route: '/gantt' },
                        { label: '⚠️ Risk Analysis', route: '/risk' },
                        { label: '🔮 Simulator', route: '/simulate' },
                        { label: '🚀 Optimize', route: '/optimize' },
                        { label: '📈 Benchmark', route: '/benchmark' },
                        { label: '🛒 Procurement', route: '/procurement' },
                        { label: '🌿 Carbon', route: '/carbon' },
                        { label: '✅ Compliance', route: '/compliance' },
                        { label: '💼 ROI Calc', route: '/roi' },
                        { label: '🤝 Negotiate', route: '/negotiate' },
                    ].map(n => (
                        <button key={n.route} className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center', fontSize: '0.82rem' }} onClick={() => navigate(n.route)}>
                            {n.label}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    )
}


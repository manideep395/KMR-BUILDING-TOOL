import useProjectStore from '../store/projectStore'
import BackButton from '../components/ui/BackButton'
import { EmptyState, SectionHeader } from '../components/ui/UIComponents'
import { useNavigate } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts'
import { useState, useEffect } from 'react'
import { calculateROI } from '../api/client'

export default function ROIPage() {
    const navigate = useNavigate()
    const { project, calculation, roiData, setRoiData } = useProjectStore()
    const [params, setParams] = useState({ soft_costs_pct: 0.15, expected_sale_price: project?.budget ? project.budget * 1.5 : 0, expected_rental_yield_annual: 0 })
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (!project || !roiData) {
            if (project && calculation) {
                runCalc()
            }
        }
    }, [project])

    const runCalc = async () => {
        setLoading(true)
        try {
            const res = await calculateROI({ project, total_cost: calculation.total_project_cost, land_cost: 0, ...params })
            setRoiData(res.data)
        } catch (e) { }
        setLoading(false)
    }

    if (!project || (!roiData && !loading)) {
        return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 24px' }}>
            <EmptyState icon="📈" title="No ROI Data" description="Run a calculation first to estimate returns." action={<button className="btn btn-primary" onClick={() => navigate('/input')}>Start Project</button>} />
        </div>
    }

    const chartData = roiData?.yearly_cashflow?.map(cf => ({
        name: `Year ${cf.year}`,
        Returns: cf.cumulative_return
    })) || []

    return (
        <div style={{ minHeight: '100vh', padding: '88px 24px 60px' }}>
            <div className="container">
                <BackButton />
                <SectionHeader label="Investment Returns" title="Financial ROI Calculator" subtitle="Estimate IRR, break-even period, and long-term yields based on construction costs." />

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
                    {/* Controls */}
                    <div className="glass-card slide-up" style={{ padding: '24px' }}>
                        <h4 style={{ marginBottom: 20 }}>Financial Parameters</h4>
                        <div className="form-group" style={{ marginBottom: 16 }}>
                            <label className="form-label">Soft Costs & Financing (%)</label>
                            <input type="number" step="0.01" value={params.soft_costs_pct} onChange={e => setParams({ ...params, soft_costs_pct: +e.target.value })} />
                        </div>
                        <div className="form-group" style={{ marginBottom: 16 }}>
                            <label className="form-label">Expected Sale Price (₹)</label>
                            <input type="number" value={params.expected_sale_price} onChange={e => setParams({ ...params, expected_sale_price: +e.target.value, expected_rental_yield_annual: 0 })} />
                        </div>
                        <div style={{ textAlign: 'center', margin: '10px 0', color: 'var(--text-muted)' }}>— OR —</div>
                        <div className="form-group" style={{ marginBottom: 24 }}>
                            <label className="form-label">Annual Rental Income (₹)</label>
                            <input type="number" value={params.expected_rental_yield_annual} onChange={e => setParams({ ...params, expected_rental_yield_annual: +e.target.value, expected_sale_price: 0 })} />
                        </div>
                        <button className="btn btn-primary" style={{ width: '100%' }} onClick={runCalc} disabled={loading}>
                            {loading ? 'Calculating...' : 'Recalculate ROI'}
                        </button>
                    </div>

                    {/* Metrics */}
                    {roiData && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div className="glass-card slide-up delay-1" style={{ padding: '24px', display: 'flex', flexWrap: 'wrap', gap: 20, background: 'rgba(245,158,11,0.05)', borderTop: '3px solid var(--amber)' }}>
                                <div style={{ flex: 1, minWidth: 120 }}>
                                    <div className="label">Total Investment</div>
                                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.8rem', color: 'var(--text-primary)' }}>₹{(roiData.total_investment / 100000).toFixed(1)}L</div>
                                </div>
                                {params.expected_rental_yield_annual > 0 ? (
                                    <>
                                        <div style={{ flex: 1, minWidth: 120 }}>
                                            <div className="label">Net Rental Yield</div>
                                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.8rem', color: 'var(--cyan)' }}>{roiData.net_roi_pct.toFixed(2)}%</div>
                                        </div>
                                        <div style={{ flex: 1, minWidth: 120 }}>
                                            <div className="label">Breakeven</div>
                                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.8rem', color: 'var(--green)' }}>{roiData.breakeven_years} yrs</div>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div style={{ flex: 1, minWidth: 120 }}>
                                            <div className="label">5-Year IRR</div>
                                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.8rem', color: 'var(--cyan)' }}>{roiData.irr_5yr.toFixed(1)}%</div>
                                        </div>
                                        <div style={{ flex: 1, minWidth: 120 }}>
                                            <div className="label">10-Year IRR</div>
                                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.8rem', color: 'var(--green)' }}>{roiData.irr_10yr.toFixed(1)}%</div>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Chart */}
                            <div className="glass-card slide-up delay-2" style={{ padding: '24px', flex: 1 }}>
                                <h4 style={{ marginBottom: 16 }}>Cumulative Cash Flow (10 Years)</h4>
                                <ResponsiveContainer width="100%" height={220}>
                                    <BarChart data={chartData}>
                                        <XAxis dataKey="name" tick={{ fill: '#94A3B8', fontSize: 10 }} />
                                        <YAxis tick={{ fill: '#94A3B8', fontSize: 10 }} tickFormatter={v => `${(v / 100000).toFixed(0)}L`} />
                                        <Tooltip formatter={v => `₹${v.toLocaleString()}`} contentStyle={{ background: '#111418', border: '1px solid var(--cyan)', borderRadius: 8 }} />
                                        <ReferenceLine y={0} stroke="#475569" strokeDasharray="3 3" />
                                        <Bar dataKey="Returns" radius={[4, 4, 0, 0]}>
                                            {chartData.map((d, i) => (
                                                <Cell key={i} fill={d.Returns >= 0 ? 'var(--green)' : 'var(--red)'} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}


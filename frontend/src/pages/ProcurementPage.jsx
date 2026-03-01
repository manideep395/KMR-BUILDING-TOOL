import useProjectStore from '../store/projectStore'
import BackButton from '../components/ui/BackButton'
import { EmptyState, SectionHeader } from '../components/ui/UIComponents'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts'

export default function ProcurementPage() {
    const navigate = useNavigate()
    const { procurementData, project } = useProjectStore()
    const [filter, setFilter] = useState('all')

    if (!procurementData || !project) {
        return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 24px' }}>
            <EmptyState icon="🛒" title="No Procurement Data" description="Run a calculation first to see your procurement plan." action={<button className="btn btn-primary" onClick={() => navigate('/input')}>Start Project</button>} />
        </div>
    }

    const items = procurementData.items || []
    const filteredItems = filter === 'all' ? items : items.filter(i => i.waste_level === filter)

    const wasteCounts = {
        green: items.filter(i => i.waste_level === 'green').length,
        amber: items.filter(i => i.waste_level === 'amber').length,
        red: items.filter(i => i.waste_level === 'red').length,
    }

    const chartData = [
        { name: 'Low Waste (<5%)', value: wasteCounts.green, fill: 'var(--green)' },
        { name: 'Medium (5-10%)', value: wasteCounts.amber, fill: 'var(--amber)' },
        { name: 'High (>10%)', value: wasteCounts.red, fill: 'var(--red)' },
    ].filter(d => d.value > 0)

    return (
        <div style={{ minHeight: '100vh', padding: '88px 24px 60px' }}>
            <div className="container">
                <BackButton />
                <SectionHeader label="Material Sourcing" title="Smart Procurement Planner" subtitle={`Total Procurement Cost: ₹${(procurementData.total_procurement_cost / 100000).toFixed(1)}L. Potential Bulk Savings: ₹${(procurementData.potential_savings_bulk / 100000).toFixed(1)}L.`} />

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24, marginBottom: 24 }}>
                    {/* Summary Cards */}
                    <div className="glass-card slide-up" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Total Materials</div>
                                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '2rem', color: 'var(--cyan)' }}>{items.length}</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Bulk Target Items</div>
                                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '2rem', color: 'var(--amber)' }}>{items.filter(i => i.bulk_discount_available).length}</div>
                            </div>
                        </div>

                        <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', padding: '16px', borderRadius: 8 }}>
                            <div style={{ fontSize: '0.8rem', color: 'var(--amber)', marginBottom: 8 }}>💡 Smart Sourcing Tip</div>
                            <div style={{ fontSize: '0.85rem' }}>Consolidate orders for Cement, Steel, and Tiles to negotiate a ~5% bulk discount, saving roughly <strong>₹{procurementData.potential_savings_bulk?.toLocaleString()}</strong>.</div>
                        </div>
                    </div>

                    {/* Waste Chart */}
                    <div className="glass-card slide-up delay-1" style={{ padding: '24px', display: 'flex', gap: 16, alignItems: 'center' }}>
                        <div style={{ flex: 1 }}>
                            <h4 style={{ marginBottom: 4 }}>Waste Analysis</h4>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>Materials categorized by expected wastage %</p>
                        </div>
                        <div style={{ width: 120, height: 120 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={chartData} cx="50%" cy="50%" innerRadius={35} outerRadius={55} paddingAngle={2} dataKey="value">
                                        {chartData.map((_, i) => <Cell key={i} fill={chartData[i].fill} />)}
                                    </Pie>
                                    <RechartsTooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="slide-up delay-2" style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                    <button className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-ghost'}`} style={{ padding: '6px 16px', fontSize: '0.8rem' }} onClick={() => setFilter('all')}>All Items</button>
                    <button className={`btn ${filter === 'green' ? 'btn-primary' : 'btn-ghost'}`} style={{ padding: '6px 16px', fontSize: '0.8rem' }} onClick={() => setFilter('green')}>Low Waste</button>
                    <button className={`btn ${filter === 'amber' ? 'btn-primary' : 'btn-ghost'}`} style={{ padding: '6px 16px', fontSize: '0.8rem' }} onClick={() => setFilter('amber')}>Medium Waste</button>
                    <button className={`btn ${filter === 'red' ? 'btn-primary' : 'btn-ghost'}`} style={{ padding: '6px 16px', fontSize: '0.8rem' }} onClick={() => setFilter('red')}>High Waste</button>
                </div>

                {/* Data Table */}
                <div className="glass-card slide-up delay-3" style={{ padding: '24px' }}>
                    <div className="scrollable">
                        <table className="data-table">
                            <thead><tr>
                                <th>Material</th><th>Base Qty</th><th>Waste %</th><th>Order Qty</th><th>Order Date</th><th>Delivery</th><th>Total Cost</th><th>Bulk</th>
                            </tr></thead>
                            <tbody>
                                {filteredItems.map(item => (
                                    <tr key={item.material}>
                                        <td style={{ fontWeight: 500 }}>{item.material}</td>
                                        <td className="mono">{item.required_qty} {item.unit}</td>
                                        <td className="mono" style={{ color: `var(--${item.waste_level})` }}>{item.waste_pct}%</td>
                                        <td className="mono" style={{ color: 'var(--cyan)' }}>{item.order_qty} {item.unit}</td>
                                        <td className="mono">{item.order_date}</td>
                                        <td className="mono">{item.delivery_date}</td>
                                        <td className="mono">₹{item.total_cost.toLocaleString()}</td>
                                        <td>{item.bulk_discount_available ? '✅ Yes' : '❌ No'}</td>
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


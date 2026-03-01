import useProjectStore from '../store/projectStore'
import BackButton from '../components/ui/BackButton'
import { EmptyState, SectionHeader, RiskBadge } from '../components/ui/UIComponents'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'

export default function PortfolioPage() {
    const navigate = useNavigate()
    const { portfolio, loadProject, setProject } = useProjectStore()
    const [filter, setFilter] = useState('all')

    const projects = Object.values(portfolio).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    const filtered = filter === 'all' ? projects : projects.filter(p => p.project.project_type.toLowerCase() === filter)

    const handleOpen = (id) => {
        loadProject(id)
        navigate('/dashboard')
    }

    const handleNew = () => {
        setProject(null)
        navigate('/input')
    }

    return (
        <div style={{ minHeight: '100vh', padding: '88px 24px 60px' }}>
            <div className="container">
                <BackButton />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 32 }}>
                    <SectionHeader label="My Projects" title="Intelligence Portfolio" subtitle="Manage and monitor all your construction projects across locations." />
                    <button className="btn btn-primary" onClick={handleNew}>+ New Project</button>
                </div>

                {projects.length === 0 ? (
                    <EmptyState icon="🏗️" title="No Projects Yet" description="Your portfolio is empty. Create your first project to get started." action={<button className="btn btn-primary" onClick={handleNew}>Start First Project</button>} />
                ) : (
                    <>
                        <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
                            <button className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setFilter('all')}>All Projects</button>
                            <button className={`btn ${filter === 'residential' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setFilter('residential')}>Residential</button>
                            <button className={`btn ${filter === 'commercial' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setFilter('commercial')}>Commercial</button>
                            <button className={`btn ${filter === 'infrastructure' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setFilter('infrastructure')}>Infrastructure</button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
                            {filtered.map((p, i) => {
                                const proj = p.project
                                const calc = p.calculation
                                const risk = p.riskData
                                const duration = calc?.phases?.reduce((s, x) => s + x.duration_days, 0) || 0

                                return (
                                    <div key={p.id} className={`glass-card slide-up delay-${(i % 6) + 1}`} style={{ padding: '24px', cursor: 'pointer', transition: 'all 0.2s', borderTop: '2px solid transparent' }} onClick={() => handleOpen(p.id)} onMouseEnter={e => e.currentTarget.style.borderTopColor = 'var(--cyan)'} onMouseLeave={e => e.currentTarget.style.borderTopColor = 'transparent'}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                                            <span className="badge badge-gray">{proj.project_type}</span>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(p.timestamp).toLocaleDateString()}</span>
                                        </div>
                                        <h3 style={{ marginBottom: 8, fontSize: '1.2rem' }}>{proj.project_name}</h3>
                                        <div style={{ display: 'flex', gap: 6, fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 20 }}>
                                            <span>📍 {proj.city}</span> • <span>📐 {proj.area_sqft?.toLocaleString()} sqft</span>
                                        </div>

                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
                                            <div>
                                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Est. Cost</div>
                                                <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--cyan)' }}>₹{(calc?.total_project_cost / 100000).toFixed(1)}L</div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Duration</div>
                                                <div style={{ fontFamily: 'var(--font-mono)' }}>{duration}d</div>
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            {risk ? (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Risk:</span>
                                                    <RiskBadge level={risk.overall_risk >= 75 ? 'Critical' : risk.overall_risk >= 50 ? 'High' : risk.overall_risk >= 25 ? 'Medium' : 'Low'} />
                                                </div>
                                            ) : <div />}
                                            <button className="btn btn-ghost" style={{ padding: '4px 8px', fontSize: '0.8rem' }}>Open →</button>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                        {filtered.length === 0 && <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>No projects match this filter.</div>}
                    </>
                )}
            </div>
        </div>
    )
}


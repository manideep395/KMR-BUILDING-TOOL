import useProjectStore from '../store/projectStore'
import BackButton from '../components/ui/BackButton'
import { EmptyState, SectionHeader } from '../components/ui/UIComponents'
import { useNavigate } from 'react-router-dom'
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts'
import { useState, useEffect } from 'react'
import { scoreContractors, findNearbyBuilders } from '../api/client'
import { Search, MapPin, Building, Star, Phone, Activity, FolderKanban } from 'lucide-react'

const SAMPLE_CONTRACTORS = [
    { name: 'Apex Builders', on_time_projects: 45, within_budget_projects: 40, projects_completed: 50, quality_complaints: 2, safety_incidents: 0, years_experience: 15, certifications: 3 },
    { name: 'Sunrise Const.', on_time_projects: 80, within_budget_projects: 70, projects_completed: 100, quality_complaints: 5, safety_incidents: 1, years_experience: 20, certifications: 4 },
    { name: 'Metro Infra', on_time_projects: 15, within_budget_projects: 12, projects_completed: 20, quality_complaints: 4, safety_incidents: 2, years_experience: 5, certifications: 1 },
]

export default function ContractorPage() {
    const navigate = useNavigate()
    const { project } = useProjectStore()
    const [scores, setScores] = useState([])
    const [loading, setLoading] = useState(true)

    const [viewMode, setViewMode] = useState('evaluation') // 'evaluation' | 'search'

    // Nearby Search State
    const [locality, setLocality] = useState('')
    const [nearbyBuilders, setNearbyBuilders] = useState([])
    const [isSearching, setIsSearching] = useState(false)
    const [searchPerformed, setSearchPerformed] = useState(false)

    useEffect(() => {
        if (!project) return
        scoreContractors({ project, contractors: SAMPLE_CONTRACTORS })
            .then(res => setScores(res.data.scores))
            .catch(() => { })
            .finally(() => setLoading(false))
    }, [project])

    if (!project) {
        return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <EmptyState icon="👷" title="No Project Found" action={<button className="btn btn-primary" onClick={() => navigate('/input')}>Start Project</button>} />
        </div>
    }

    const formatChartData = (c) => [
        { subject: 'On-Time', A: c.breakdown['On-Time Delivery'] },
        { subject: 'Budget', A: c.breakdown['Cost Adherence'] },
        { subject: 'Quality', A: c.breakdown['Quality'] },
        { subject: 'Safety', A: c.breakdown['Safety'] },
        { subject: 'Experience', A: c.breakdown['Experience'] },
    ]

    const handleSearch = async (e) => {
        e.preventDefault()
        if (!locality.trim() || !project) return

        setIsSearching(true)
        setSearchPerformed(true)
        try {
            const res = await findNearbyBuilders({
                locality: locality,
                project_type: project.project_type || 'Residential'
            })
            setNearbyBuilders(res.data.builders || [])
        } catch (error) {
            console.error(error)
        } finally {
            setIsSearching(false)
        }
    }

    return (
        <div style={{ minHeight: '100vh', padding: '88px 24px 60px' }}>
            <div className="container">
                <BackButton />
                <SectionHeader
                    label="Contractors & Builders"
                    title="Vendor Network"
                    subtitle="Discover local builders or evaluate vendor reliability."
                />

                <div style={{ display: 'flex', gap: 12, marginBottom: 24, borderBottom: '1px solid var(--border-card)', paddingBottom: 16 }}>
                    <button
                        className={`btn ${viewMode === 'search' ? 'btn-primary' : 'btn-ghost'}`}
                        style={{ padding: '8px 16px', borderRadius: 20 }}
                        onClick={() => setViewMode('search')}
                    >
                        🔍 Find Nearby Builders
                    </button>
                    <button
                        className={`btn ${viewMode === 'evaluation' ? 'btn-primary' : 'btn-ghost'}`}
                        style={{ padding: '8px 16px', borderRadius: 20 }}
                        onClick={() => setViewMode('evaluation')}
                    >
                        📊 AI Candidate Evaluation
                    </button>
                </div>

                {viewMode === 'search' ? (
                    <div className="slide-up">
                        <div className="glass-card" style={{ padding: '24px', marginBottom: 24 }}>
                            <h3 style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                                <MapPin size={20} className="text-amber" /> Search Local Builders
                            </h3>
                            <form onSubmit={handleSearch} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                                <div style={{ flex: 1, position: 'relative' }}>
                                    <MapPin size={18} style={{ position: 'absolute', left: 16, top: 14, color: 'var(--text-muted)' }} />
                                    <input
                                        type="text"
                                        value={locality}
                                        onChange={(e) => setLocality(e.target.value)}
                                        placeholder="Enter your city or locality (e.g., Whitefield, Bangalore)"
                                        style={{ width: '100%', paddingLeft: 44 }}
                                    />
                                </div>
                                <button type="submit" className="btn btn-primary" disabled={!locality.trim() || isSearching} style={{ padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 8 }}>
                                    {isSearching ? <span className="spinner" style={{ width: 16, height: 16 }} /> : <Search size={18} />}
                                    Search
                                </button>
                            </form>
                        </div>

                        {isSearching ? (
                            <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
                                <div className="spinner" style={{ margin: '0 auto 16px', width: 32, height: 32, borderTopColor: 'var(--amber)' }} />
                                Scanning AI registry for top builders in <span style={{ color: 'var(--amber)' }}>{locality}</span>...
                            </div>
                        ) : searchPerformed && nearbyBuilders.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: 40, background: 'rgba(255,255,255,0.02)', borderRadius: 16 }}>
                                No builders found for this locality. Try a broader city search.
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
                                {nearbyBuilders.map((builder, i) => (
                                    <div key={i} className={`glass-card slide-up delay-${i % 3}`} style={{ padding: '24px', position: 'relative' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                                            <h3 style={{ fontSize: '1.2rem' }}>{builder.name}</h3>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(245,158,11,0.1)', color: 'var(--amber)', padding: '4px 8px', borderRadius: 12, fontSize: '0.85rem', fontWeight: 600 }}>
                                                <Star size={14} fill="var(--amber)" /> {builder.rating}
                                            </div>
                                        </div>

                                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <Building size={16} /> {builder.specialty}
                                        </div>

                                        <div style={{ display: 'flex', gap: 16, marginBottom: 20, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                <Activity size={14} /> {builder.experience_years} Yrs Exp.
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                <FolderKanban size={14} /> {builder.projects_completed} Projects
                                            </div>
                                        </div>

                                        <div style={{ paddingTop: 16, borderTop: '1px solid var(--border-card)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <a href={`tel:${builder.contact.replace(/\s+/g, '')}`} className="btn btn-ghost" style={{ padding: '8px 12px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)' }}>
                                                <Phone size={16} style={{ color: 'var(--amber)' }} />
                                                {builder.contact}
                                            </a>
                                            <button className="btn btn-outline" style={{ padding: '6px 16px', fontSize: '0.8rem' }} onClick={() => navigate('/negotiate')}>
                                                Negotiate
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    loading ? <div style={{ textAlign: 'center', padding: 40 }}>Loading AI evaluations...</div> :
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
                            {scores.map((s, i) => (
                                <div key={s.name} className={`glass-card slide-up delay-${i + 1}`} style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
                                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: s.overall_score >= 80 ? 'var(--green)' : s.overall_score >= 50 ? 'var(--amber)' : 'var(--red)' }} />

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                                        <div>
                                            <h3 style={{ marginBottom: 4 }}>{s.name}</h3>
                                            <div style={{ color: 'var(--amber)', fontSize: '0.9rem' }}>{'★'.repeat(s.star_rating)}{'☆'.repeat(5 - s.star_rating)}</div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.8rem', color: s.overall_score >= 80 ? 'var(--green)' : 'var(--amber)' }}>{s.overall_score.toFixed(1)}</div>
                                            <div className="label">Overall Score</div>
                                        </div>
                                    </div>

                                    <div style={{ height: 220, margin: '0 -20px' }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={formatChartData(s)}>
                                                <PolarGrid stroke="rgba(255,255,255,0.1)" />
                                                <PolarAngleAxis dataKey="subject" tick={{ fill: '#94A3B8', fontSize: 10 }} />
                                                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                                <Tooltip contentStyle={{ background: '#111418', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 8 }} />
                                                <Radar name="Score" dataKey="A" stroke={s.overall_score >= 80 ? '#10B981' : '#F59E0B'} fill={s.overall_score >= 80 ? '#10B981' : '#F59E0B'} fillOpacity={0.4} />
                                            </RadarChart>
                                        </ResponsiveContainer>
                                    </div>

                                    <div style={{ marginTop: 16, display: 'flex', gap: 12, justifyContent: 'center' }}>
                                        <span className={`badge ${s.hire_confidence === 'High' ? 'badge-green' : s.hire_confidence === 'Medium' ? 'badge-amber' : 'badge-red'}`}>
                                            {s.hire_confidence} Confidence
                                        </span>
                                        <button className="btn btn-ghost" style={{ padding: '4px 12px', fontSize: '0.75rem' }} onClick={() => navigate('/negotiate')}>Negotiate</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                )}
            </div>
        </div>
    )
}

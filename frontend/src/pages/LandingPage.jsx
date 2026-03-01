import { useNavigate } from 'react-router-dom'
import useProjectStore from '../store/projectStore'
import MagneticCard from '../components/anti-gravity/MagneticCard'
import ParticleBackground from '../components/anti-gravity/ParticleBackground'
import { AnimatedNumber } from '../components/ui/UIComponents'
import { ArrowRight, Zap, BarChart3, Shield, TrendingUp, FileText, Globe } from 'lucide-react'

const FEATURES = [
    { icon: '⚙️', title: 'Smart Cost Engine', desc: 'Real-time material + labor breakdowns with Indian regional pricing', color: 'var(--amber)' },
    { icon: '🧠', title: 'MANI Insights', desc: 'Plain-language explanations, negotiation scripts, green alternatives', color: 'var(--cyan)' },
    { icon: '📊', title: 'Critical Path Analysis', desc: 'Full CPA with interactive Gantt charts & task network visualization', color: 'var(--amber)' },
    { icon: '⚠️', title: 'Risk Prediction', desc: 'Budget overrun, delay, weather & labor shortage risk scores', color: 'var(--red)' },
    { icon: '🌿', title: 'Carbon Footprint', desc: 'Embodied carbon estimator with tree offset calculator & green alternatives', color: 'var(--green)' },
    { icon: '📋', title: 'Compliance Checker', desc: 'FSI/FAR limits, seismic zones, fire safety, green building requirements', color: 'var(--cyan)' },
]

const QUICK_TEMPLATES = [
    { label: '🏠 2BHK Residential', data: { project_name: '2BHK Home', project_type: 'Residential', area_sqft: 1200, floors: 2, budget: 5000000, city: 'Bangalore', state: 'Karnataka', quality_grade: 'Standard', optimization_priority: 'Balanced', start_date: '2025-04-01', end_date: '2026-06-30', currency: 'INR' } },
    { label: '🏪 Commercial Shop', data: { project_name: 'Commercial Shop', project_type: 'Commercial', area_sqft: 800, floors: 1, budget: 3500000, city: 'Hyderabad', state: 'Telangana', quality_grade: 'Standard', optimization_priority: 'Minimize Cost', start_date: '2025-05-01', end_date: '2025-12-31', currency: 'INR' } },
    { label: '🏭 Warehouse', data: { project_name: 'Industrial Warehouse', project_type: 'Industrial', area_sqft: 10000, floors: 1, budget: 15000000, city: 'Pune', state: 'Maharashtra', quality_grade: 'Economy', optimization_priority: 'Minimize Cost', start_date: '2025-06-01', end_date: '2026-03-31', currency: 'INR' } },
    { label: '💼 IT Office', data: { project_name: 'IT Office Space', project_type: 'Commercial', area_sqft: 5000, floors: 3, budget: 25000000, city: 'Bangalore', state: 'Karnataka', quality_grade: 'Premium', optimization_priority: 'Balanced', start_date: '2025-04-01', end_date: '2026-09-30', currency: 'INR' } },
]

const STATS = [
    { label: 'Projects Optimized', value: 12400, suffix: '+' },
    { label: 'Cost Saved (Crore ₹)', value: 847, suffix: '+' },
    { label: 'Indian Cities Covered', value: 28, suffix: '' },
    { label: 'AI Consultations', value: 95000, suffix: '+' },
]

export default function LandingPage() {
    const navigate = useNavigate()
    const { setProject } = useProjectStore()

    const handleTemplate = (data) => {
        setProject(data)
        navigate('/dashboard')
    }

    return (
        <div style={{ position: 'relative', minHeight: '100vh', overflowX: 'hidden' }}>
            <ParticleBackground />

            {/* Hero Section */}
            <section style={{ position: 'relative', zIndex: 1, minHeight: '100vh', display: 'flex', alignItems: 'center', padding: '120px 24px 80px' }}>
                <div className="container" style={{ maxWidth: '1200px' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '40px' }}>

                        {/* Left Content */}
                        <div style={{ flex: '1 1 500px', maxWidth: 650 }}>
                            <h1 className="slide-up" style={{
                                background: 'linear-gradient(135deg, #F59E0B 0%, #FCD34D 40%, #06B6D4 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                lineHeight: 1.1,
                                marginBottom: 20,
                                textAlign: 'left',
                                fontSize: 'clamp(3rem, 5vw, 4.5rem)'
                            }}>
                                KMR INNOVATORS<br />CONSTRUCTION AI
                            </h1>
                            <p className="slide-up delay-1" style={{ fontSize: '1.15rem', maxWidth: 600, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 32, textAlign: 'left' }}>
                                Transform raw project inputs into fully optimized, AI-explained, risk-predicted, and visually rich construction intelligence. Built for India's builders — from residential homes to high-rise towers.
                            </p>

                            {/* Quick Start Templates */}
                            <div className="slide-up delay-2" style={{ marginBottom: 32 }}>
                                <div style={{ fontSize: '0.75rem', color: 'var(--amber)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 12, textAlign: 'left' }}>⚡ Quick Start — One Click to Full Dashboard</div>
                                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-start' }}>
                                    {QUICK_TEMPLATES.map((t) => (
                                        <button
                                            key={t.label}
                                            className="btn btn-ghost"
                                            style={{ fontSize: '0.85rem', padding: '10px 16px', background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.2)' }}
                                            onClick={() => handleTemplate(t.data)}
                                        >
                                            {t.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="slide-up delay-3" style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'flex-start' }}>
                                <button className="btn btn-primary" style={{ fontSize: '1rem', padding: '16px 36px' }} onClick={() => navigate('/input')}>
                                    Start New Project <ArrowRight size={18} />
                                </button>
                                <button className="btn btn-secondary" style={{ fontSize: '1rem', padding: '16px 32px' }} onClick={() => navigate('/portfolio')}>
                                    View Portfolio
                                </button>
                            </div>
                        </div>

                        {/* Right Content - 3D CSS Building Animation */}
                        <div className="slide-up delay-2" style={{ flex: '1 1 400px', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '350px' }}>
                            <div className="hero-3d-wrapper">
                                <div className="isometric-city">
                                    <div className="iso-building b1">
                                        <div className="iso-face top"></div>
                                        <div className="iso-face left"></div>
                                        <div className="iso-face right"></div>
                                    </div>
                                    <div className="iso-building b2">
                                        <div className="iso-face top"></div>
                                        <div className="iso-face left"></div>
                                        <div className="iso-face right"></div>
                                    </div>
                                    <div className="iso-building b3">
                                        <div className="iso-face top"></div>
                                        <div className="iso-face left"></div>
                                        <div className="iso-face right"></div>
                                    </div>
                                    <div className="iso-grid"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats Bar */}
            <section style={{ position: 'relative', zIndex: 1, borderTop: '1px solid rgba(245,158,11,0.15)', borderBottom: '1px solid rgba(245,158,11,0.15)', padding: '40px 24px', background: 'rgba(245,158,11,0.03)' }}>
                <div className="container">
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 24, textAlign: 'center' }}>
                        {STATS.map((s, i) => (
                            <div key={s.label} className={`slide-up delay-${i + 1}`}>
                                <div className="kpi-number kpi-amber">
                                    <AnimatedNumber value={s.value} suffix={s.suffix} />
                                </div>
                                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{s.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section style={{ position: 'relative', zIndex: 1, padding: '80px 24px' }}>
                <div className="container">
                    <div style={{ textAlign: 'center', marginBottom: 48 }}>
                        <div className="label" style={{ marginBottom: 12 }}>Platform Capabilities</div>
                        <div className="amber-line" style={{ margin: '0 auto 16px' }} />
                        <h2>19 Intelligent Modules</h2>
                        <p style={{ maxWidth: 500, margin: '12px auto 0' }}>Everything a smart construction project needs — from cost breakdown to carbon footprint.</p>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
                        {FEATURES.map((f, i) => (
                            <MagneticCard key={f.title} className={`slide-up delay-${(i % 8) + 1}`} style={{ padding: '28px' }}>
                                <div style={{ fontSize: '2rem', marginBottom: 12 }}>{f.icon}</div>
                                <h4 style={{ color: f.color, marginBottom: 8, fontSize: '1.1rem' }}>{f.title}</h4>
                                <p style={{ fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
                            </MagneticCard>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section style={{ position: 'relative', zIndex: 1, padding: '80px 24px', textAlign: 'center', background: 'linear-gradient(180deg, transparent, rgba(245,158,11,0.04))' }}>
                <div className="container">
                    <h2 style={{ marginBottom: 16 }}>Ready to Build Smarter?</h2>
                    <p style={{ maxWidth: 500, margin: '0 auto 32px' }}>Enter your project details and get a complete AI-powered construction intelligence report in seconds.</p>
                    <button className="btn btn-primary" style={{ fontSize: '1.1rem', padding: '18px 48px' }} onClick={() => navigate('/input')}>
                        Start Free Analysis <Zap size={20} />
                    </button>
                </div>
            </section>
        </div>
    )
}

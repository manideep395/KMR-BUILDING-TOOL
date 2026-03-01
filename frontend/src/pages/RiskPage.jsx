import useProjectStore from '../store/projectStore'
import BackButton from '../components/ui/BackButton'
import { EmptyState, SectionHeader, RiskBadge } from '../components/ui/UIComponents'
import { useNavigate } from 'react-router-dom'
import { RadialBarChart, RadialBar, ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts'

const RISK_KEYS = [
    { key: 'budget_risk', label: 'Budget Overrun', icon: '💰' },
    { key: 'delay_risk', label: 'Schedule Delay', icon: '⏱️' },
    { key: 'labor_risk', label: 'Labor Shortage', icon: '👷' },
    { key: 'weather_risk', label: 'Weather Impact', icon: '🌧️' },
    { key: 'compliance_risk', label: 'Compliance', icon: '📋' },
]

function GaugeCard({ label, icon, score, level, explanation, delay }) {
    const getColor = (score) => score >= 75 ? 'var(--red)' : score >= 50 ? 'var(--amber)' : 'var(--green)'
    const color = getColor(score)
    const isPulsing = score >= 75

    return (
        <div className={`glass-card slide-up delay-${delay} ${isPulsing ? 'pulse-red' : ''}`} style={{ padding: '24px', textAlign: 'center' }}>
            <div style={{ marginBottom: 8 }}>
                <span style={{ fontSize: '1.6rem' }}>{icon}</span>
                <div className="label" style={{ marginTop: 4, color: 'var(--text-secondary)' }}>{label}</div>
            </div>

            {/* SVG Gauge */}
            <div style={{ position: 'relative', display: 'inline-block', marginBottom: 12 }}>
                <svg width="120" height="70" viewBox="0 0 120 70">
                    {/* Background arc */}
                    <path d="M 10 65 A 50 50 0 0 1 110 65" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" strokeLinecap="round" />
                    {/* Value arc */}
                    <path
                        d="M 10 65 A 50 50 0 0 1 110 65"
                        fill="none"
                        stroke={color}
                        strokeWidth="10"
                        strokeLinecap="round"
                        strokeDasharray={`${(score / 100) * 157} 157`}
                        style={{ filter: `drop-shadow(0 0 8px ${color})` }}
                    />
                    <text x="60" y="58" textAnchor="middle" fill={color} fontSize="20" fontFamily="JetBrains Mono" fontWeight="700">
                        {Math.round(score)}
                    </text>
                </svg>
            </div>

            <div style={{ marginBottom: 12 }}>
                <RiskBadge level={level} />
            </div>
            <p style={{ fontSize: '0.82rem', lineHeight: 1.6, color: 'var(--text-secondary)', margin: 0, textAlign: 'left' }}>
                {explanation}
            </p>
        </div>
    )
}

export default function RiskPage() {
    const navigate = useNavigate()
    const { riskData, project } = useProjectStore()

    if (!riskData || !project) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 24px' }}>
                <EmptyState icon="⚠️" title="No Risk Data" description="Run a project calculation first to see risk assessment." action={<button className="btn btn-primary" onClick={() => navigate('/input')}>Start Project</button>} />
            </div>
        )
    }

    const overallColor = riskData.overall_risk >= 75 ? 'var(--red)' : riskData.overall_risk >= 50 ? 'var(--amber)' : 'var(--green)'

    const radarData = RISK_KEYS.map(r => ({
        name: r.label,
        score: riskData[r.key]?.score || 0,
    }))

    return (
        <div style={{ minHeight: '100vh', padding: '88px 24px 60px' }}>
            <div className="container">
                <BackButton />
                <SectionHeader label="Risk Assessment" title="Predictive Risk Engine" subtitle="AI-powered risk scoring across 5 critical dimensions of your construction project." />

                {/* High risk banner */}
                {riskData.warnings?.length > 0 && (
                    <div style={{ marginBottom: 24 }}>
                        {riskData.warnings.map((w, i) => (
                            <div key={i} className="warning-strip warning-red" style={{ marginBottom: 8 }}>{w}</div>
                        ))}
                    </div>
                )}

                {/* Overall risk */}
                <div className="glass-card slide-up" style={{ padding: '28px', marginBottom: 28, display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '3.5rem', color: overallColor, lineHeight: 1, textShadow: `0 0 30px ${overallColor}` }}>
                            {Math.round(riskData.overall_risk)}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', letterSpacing: '0.1em' }}>OVERALL RISK / 100</div>
                    </div>
                    <div style={{ flex: 1, minWidth: 200 }}>
                        <h4 style={{ marginBottom: 8, color: overallColor }}>
                            {riskData.overall_risk >= 75 ? '🔴 HIGH RISK — Immediate Attention Required' : riskData.overall_risk >= 50 ? '🟡 MEDIUM RISK — Monitor Closely' : '🟢 LOW RISK — Project on Track'}
                        </h4>
                        <p style={{ margin: 0, fontSize: '0.9rem' }}>
                            Risk score is a weighted average: Budget (30%) + Delay (25%) + Labor (20%) + Weather (15%) + Compliance (10%).
                            Your project in {project.city} shows a composite risk of <strong style={{ color: overallColor }}>{riskData.overall_risk?.toFixed(1)}/100</strong>.
                        </p>
                    </div>
                </div>

                {/* Gauge cards grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 20 }}>
                    {RISK_KEYS.map((r, i) => {
                        const rd = riskData[r.key]
                        if (!rd) return null
                        return (
                            <GaugeCard key={r.key} label={r.label} icon={r.icon} score={rd.score} level={rd.level} explanation={rd.explanation} delay={i + 1} />
                        )
                    })}
                </div>
            </div>
        </div>
    )
}


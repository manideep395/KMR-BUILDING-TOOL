import useProjectStore from '../store/projectStore'
import BackButton from '../components/ui/BackButton'
import { EmptyState, SectionHeader } from '../components/ui/UIComponents'
import { useNavigate } from 'react-router-dom'

export default function CompliancePage() {
    const navigate = useNavigate()
    const { complianceData, project } = useProjectStore()

    if (!complianceData || !project) {
        return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 24px' }}>
            <EmptyState icon="✅" title="No Compliance Data" description="Run a calculation first." action={<button className="btn btn-primary" onClick={() => navigate('/input')}>Start Project</button>} />
        </div>
    }

    const score = complianceData.compliance_score || 0
    const scoreColor = score >= 80 ? 'var(--green)' : score >= 60 ? 'var(--amber)' : 'var(--red)'

    return (
        <div style={{ minHeight: '100vh', padding: '88px 24px 60px' }}>
            <div className="container">
                <BackButton />
                <SectionHeader label="Regulatory Compliance" title="Building Code Checker" subtitle={`Compliance verification for ${project.project_type} project in ${project.city}, ${project.state}`} />

                {/* Score */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 28 }}>
                    {[
                        { label: 'Compliance Score', value: `${score.toFixed(0)}/100`, color: scoreColor, emoji: score >= 80 ? '✅' : score >= 60 ? '⚠️' : '❌' },
                        { label: 'Checks Passed', value: complianceData.pass_count, color: 'var(--green)', emoji: '✅' },
                        { label: 'Warnings', value: complianceData.warning_count, color: 'var(--amber)', emoji: '⚠️' },
                        { label: 'Failed Checks', value: complianceData.fail_count, color: 'var(--red)', emoji: '❌' },
                    ].map(c => (
                        <div key={c.label} className="glass-card slide-up" style={{ padding: '20px', textAlign: 'center' }}>
                            <div style={{ fontSize: '1.5rem', marginBottom: 6 }}>{c.emoji}</div>
                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '2rem', color: c.color, marginBottom: 4 }}>{c.value}</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{c.label}</div>
                        </div>
                    ))}
                </div>

                {/* Individual checks */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {complianceData.checks?.map((check, i) => {
                        const statusColor = check.status === 'pass' ? 'var(--green)' : check.status === 'fail' ? 'var(--red)' : 'var(--amber)'
                        const statusEmoji = check.status === 'pass' ? '✅' : check.status === 'fail' ? '❌' : '⚠️'
                        return (
                            <div key={i} className={`glass-card slide-up delay-${(i % 6) + 1}`} style={{ padding: '20px', borderLeft: `4px solid ${statusColor}` }}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                            <span style={{ fontSize: '1.1rem' }}>{statusEmoji}</span>
                                            <h4 style={{ fontSize: '1rem', color: statusColor }}>{check.check}</h4>
                                        </div>
                                        <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 4 }}>{check.details}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>📚 {check.rule_reference}</div>
                                        {check.fix_suggestion && (
                                            <div style={{ marginTop: 8, padding: '8px 12px', background: 'rgba(245,158,11,0.08)', borderRadius: 8, fontSize: '0.82rem', color: 'var(--amber)' }}>
                                                💡 {check.fix_suggestion}
                                            </div>
                                        )}
                                    </div>
                                    <span className={`badge ${check.status === 'pass' ? 'badge-green' : check.status === 'fail' ? 'badge-red' : 'badge-amber'}`} style={{ flexShrink: 0 }}>
                                        {check.status.toUpperCase()}
                                    </span>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}


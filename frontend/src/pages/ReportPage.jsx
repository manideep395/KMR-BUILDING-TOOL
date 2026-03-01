import useProjectStore from '../store/projectStore'
import BackButton from '../components/ui/BackButton'
import { EmptyState, SectionHeader } from '../components/ui/UIComponents'
import { useNavigate } from 'react-router-dom'
import { generateReport } from '../api/client'
import { useState } from 'react'

export default function ReportPage() {
    const navigate = useNavigate()
    const { project, calculation, riskData, carbonData, complianceData } = useProjectStore()
    const [loading, setLoading] = useState(false)

    if (!project || !calculation) {
        return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 24px' }}>
            <EmptyState icon="📄" title="No Project Data" description="Run a project calculation first." action={<button className="btn btn-primary" onClick={() => navigate('/input')}>Start Project</button>} />
        </div>
    }

    const handleDownload = async () => {
        setLoading(true)
        try {
            await generateReport({
                project,
                calculation_result: calculation,
                risk_response: riskData,
                carbon_response: carbonData,
                compliance_response: complianceData
            })
        } catch (e) { }
        setLoading(false)
    }

    return (
        <div style={{ minHeight: '100vh', padding: '88px 24px 60px' }}>
            <div className="container" style={{ maxWidth: 800 }}>
                <BackButton />
                <SectionHeader label="Export" title="Executive Summary Report" subtitle="Download a comprehensive, AI-generated PDF dossier of your entire project intelligence." />

                <div className="glass-card slide-up" style={{ padding: '32px', textAlign: 'center' }}>
                    <div style={{ fontSize: '4rem', marginBottom: 20, animation: 'float 3s infinite' }}>📄</div>
                    <h2 style={{ marginBottom: 16 }}>{project.project_name} — Intelligence Report</h2>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: 32, maxWidth: 500, margin: '0 auto 32px' }}>
                        Includes executive summary, detailed cost breakdown, Phase timeline, CPA network, Risk assessment scores, Carbon footprint, and Compliance verification.
                    </p>

                    <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: 'rgba(6,182,212,0.1)', borderRadius: 8, color: 'var(--cyan)', fontSize: '0.85rem' }}>
                            <span style={{ fontSize: '1.2rem' }}>💰</span> Cost Data Included
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: 'rgba(239,68,68,0.1)', borderRadius: 8, color: 'var(--red)', fontSize: '0.85rem' }}>
                            <span style={{ fontSize: '1.2rem' }}>⚠️</span> Risk Scores Included
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: 'rgba(16,185,129,0.1)', borderRadius: 8, color: 'var(--green)', fontSize: '0.85rem' }}>
                            <span style={{ fontSize: '1.2rem' }}>🌿</span> Carbon Data Included
                        </div>
                    </div>

                    <button className="btn btn-primary" style={{ marginTop: 40, padding: '16px 40px', fontSize: '1.1rem' }} onClick={handleDownload} disabled={loading}>
                        {loading ? 'Generating PDF...' : '⬇️ Download PDF Report'}
                    </button>
                </div>
            </div>
        </div>
    )
}


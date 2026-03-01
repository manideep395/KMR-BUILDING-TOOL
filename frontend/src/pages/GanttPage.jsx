import BackButton from '../components/ui/BackButton'
import { useState } from 'react'
import useProjectStore from '../store/projectStore'
import { EmptyState, SectionHeader } from '../components/ui/UIComponents'
import { useNavigate } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import ReactFlow, { Background, Controls, MiniMap } from 'reactflow'
import 'reactflow/dist/style.css'

const COLORS_CRIT = { critical: '#F59E0B', normal: '#06B6D4' }

export default function GanttPage() {
    const navigate = useNavigate()
    const { cpaData, calculation, project } = useProjectStore()
    const [view, setView] = useState('gantt')
    const [hoveredTask, setHoveredTask] = useState(null)

    if (!cpaData || !calculation) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 24px' }}>
                <EmptyState icon="📊" title="No CPA Data" description="Run a project calculation first to see the Gantt chart and critical path analysis." action={<button className="btn btn-primary" onClick={() => navigate('/input')}>Start Project</button>} />
            </div>
        )
    }

    const tasks = cpaData.tasks || []
    const criticalPath = cpaData.critical_path || []

    // Build Gantt data from phases
    const ganttData = calculation.phases?.map(p => ({
        name: p.phase,
        start: 0,
        duration: p.duration_days,
        workers: p.workers,
        isCritical: p.phase !== 'MEP' && p.phase !== 'Handover',
    })) || []

    let offset = 0
    const ganttWithOffsets = ganttData.map((p, i) => {
        const item = { ...p, startDay: offset }
        offset += p.duration
        return item
    })

    return (
        <div style={{ minHeight: '100vh', padding: '88px 24px 60px' }}>
            <div className="container">
                <BackButton />
                <SectionHeader label="Schedule & CPA" title="Gantt Chart & Critical Path" subtitle={`Total project duration: ${cpaData.project_duration} days. Critical path has ${criticalPath.length} tasks with zero float.`} />

                {/* View toggle */}
                <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
                    <button className={`btn ${view === 'gantt' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setView('gantt')}>📊 Gantt View</button>
                    <button className={`btn ${view === 'network' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setView('network')}>🔗 Network Diagram</button>
                    <button className={`btn ${view === 'table' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setView('table')}>📋 CPA Table</button>
                </div>

                {view === 'gantt' && (
                    <div className="glass-card slide-up" style={{ padding: '24px' }}>
                        <div style={{ marginBottom: 12, display: 'flex', gap: 16 }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: 'var(--text-muted)' }}><span style={{ width: 12, height: 12, background: 'var(--amber)', borderRadius: 2, display: 'inline-block' }} /> Critical Path</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: 'var(--text-muted)' }}><span style={{ width: 12, height: 12, background: 'var(--cyan)', borderRadius: 2, display: 'inline-block' }} /> Non-Critical</span>
                        </div>
                        {/* Phase-level Gantt */}
                        <div style={{ overflowX: 'auto' }}>
                            <div style={{ minWidth: 600 }}>
                                {ganttWithOffsets.map((phase, i) => {
                                    const maxDays = ganttWithOffsets.reduce((s, p) => s + p.duration, 0)
                                    const startPct = (phase.startDay / maxDays) * 100
                                    const widthPct = (phase.duration / maxDays) * 100
                                    return (
                                        <div key={phase.name} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                                            <div style={{ width: 100, fontSize: '0.82rem', color: 'var(--text-secondary)', flexShrink: 0 }}>{phase.name}</div>
                                            <div style={{ flex: 1, height: 28, position: 'relative', background: 'rgba(255,255,255,0.04)', borderRadius: 6 }}>
                                                <div style={{
                                                    position: 'absolute',
                                                    left: `${startPct}%`,
                                                    width: `${widthPct}%`,
                                                    height: '100%',
                                                    background: phase.isCritical ? 'linear-gradient(90deg, #F59E0B, #D97706)' : 'linear-gradient(90deg, #06B6D4, #0891B2)',
                                                    borderRadius: 6,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    paddingLeft: 8,
                                                    fontSize: '0.72rem',
                                                    fontFamily: 'var(--font-mono)',
                                                    color: '#000',
                                                    fontWeight: 700,
                                                    transition: 'all 0.3s',
                                                    boxShadow: phase.isCritical ? '0 2px 12px rgba(245,158,11,0.4)' : '0 2px 12px rgba(6,182,212,0.3)',
                                                }}>
                                                    {phase.duration}d · {phase.workers}w
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Detail tasks table */}
                        <div style={{ marginTop: 24 }}>
                            <h4 style={{ marginBottom: 12 }}>Task-Level Schedule (Top 10)</h4>
                            <div className="scrollable">
                                <table className="data-table">
                                    <thead><tr>
                                        <th>ID</th><th>Task</th><th>Phase</th><th>Duration</th><th>ES</th><th>EF</th><th>LS</th><th>LF</th><th>Float</th><th>Status</th>
                                    </tr></thead>
                                    <tbody>
                                        {tasks.slice(0, 12).map(t => (
                                            <tr key={t.id}>
                                                <td className="mono" style={{ color: 'var(--amber)' }}>{t.id}</td>
                                                <td>{t.name}</td>
                                                <td><span className="badge badge-gray" style={{ fontSize: '0.65rem' }}>{t.phase}</span></td>
                                                <td className="mono">{t.duration}d</td>
                                                <td className="mono">{t.es}</td>
                                                <td className="mono">{t.ef}</td>
                                                <td className="mono">{t.ls}</td>
                                                <td className="mono">{t.lf}</td>
                                                <td className="mono" style={{ color: t.slack === 0 ? 'var(--red)' : 'var(--green)' }}>{t.slack}</td>
                                                <td>{t.is_critical ? <span className="badge badge-red">Critical</span> : <span className="badge badge-cyan">Non-Critical</span>}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {view === 'network' && (
                    <div className="glass-card" style={{ height: 600, padding: 0, overflow: 'hidden' }}>
                        {cpaData.nodes && cpaData.edges ? (
                            <ReactFlow
                                nodes={cpaData.nodes}
                                edges={cpaData.edges}
                                fitView
                                style={{ background: 'transparent' }}
                            >
                                <Background color="#1a1c1f" />
                                <Controls />
                                <MiniMap style={{ background: '#111418' }} />
                            </ReactFlow>
                        ) : (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
                                Network diagram data loading...
                            </div>
                        )}
                    </div>
                )}

                {view === 'table' && (
                    <div className="glass-card slide-up" style={{ padding: '24px' }}>
                        <h4 style={{ marginBottom: 16 }}>Critical Path: {criticalPath.join(' → ')}</h4>
                        <div className="scrollable">
                            <table className="data-table">
                                <thead><tr>
                                    <th>Task</th><th>Name</th><th>Duration</th><th>Workers</th><th>ES</th><th>EF</th><th>LS</th><th>LF</th><th>Float</th><th>Critical</th>
                                </tr></thead>
                                <tbody>
                                    {tasks.map(t => (
                                        <tr key={t.id} style={{ background: t.is_critical ? 'rgba(245,158,11,0.04)' : 'transparent' }}>
                                            <td className="mono" style={{ color: 'var(--amber)' }}>{t.id}</td>
                                            <td>{t.name}</td>
                                            <td className="mono">{t.duration}d</td>
                                            <td className="mono">{t.workers}</td>
                                            <td className="mono">{t.es}</td>
                                            <td className="mono">{t.ef}</td>
                                            <td className="mono">{t.ls}</td>
                                            <td className="mono">{t.lf}</td>
                                            <td className="mono" style={{ color: t.slack === 0 ? 'var(--red)' : 'var(--green)' }}>{t.slack}</td>
                                            <td>{t.is_critical ? '🔴' : '🟢'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}


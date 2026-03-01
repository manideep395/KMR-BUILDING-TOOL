import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import useProjectStore from '../../store/projectStore'
import { Building2, LayoutDashboard, BarChart3, AlertTriangle, Sliders, Zap, BarChart2, ShoppingCart, Leaf, ShieldCheck, TrendingUp, UserCheck, MessageSquare, FileText, FolderKanban, Menu, X, Globe, Info, Sun, Moon } from 'lucide-react'

const navItems = [
    { path: '/', label: 'Home', icon: Building2 },
    { path: '/input', label: 'New Project', icon: Sliders },
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/gantt', label: 'Gantt / CPA', icon: BarChart3 },
    { path: '/risk', label: 'Risk', icon: AlertTriangle },
    { path: '/simulate', label: 'Simulator', icon: Zap },
    { path: '/optimize', label: 'Optimize', icon: Zap },
    { path: '/benchmark', label: 'Benchmark', icon: BarChart2 },
    { path: '/procurement', label: 'Procurement', icon: ShoppingCart },
    { path: '/carbon', label: 'Carbon', icon: Leaf },
    { path: '/compliance', label: 'Compliance', icon: ShieldCheck },
    { path: '/roi', label: 'ROI', icon: TrendingUp },
    { path: '/contractor', label: 'Contractors', icon: UserCheck },
    { path: '/negotiate', label: 'Negotiate', icon: MessageSquare },
    { path: '/report', label: 'Report', icon: FileText },
    { path: '/portfolio', label: 'Portfolio', icon: FolderKanban },
]

export default function Navbar() {
    const [open, setOpen] = useState(false)
    const { project, simpleView, setSimpleView, language, setLanguage, theme, setTheme } = useProjectStore()
    const navigate = useNavigate()

    return (
        <>
            <nav style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                zIndex: 1000,
                background: 'rgba(10,12,15,0.94)',
                backdropFilter: 'blur(20px)',
                borderBottom: '1px solid rgba(245,158,11,0.15)',
                padding: '0 24px',
                height: '64px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
            }}>
                {/* Logo */}
                <div
                    style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
                    onClick={() => navigate('/')}
                >
                    <div style={{
                        width: 36, height: 36,
                        background: 'linear-gradient(135deg, #F59E0B, #06B6D4)',
                        borderRadius: 10,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.2rem',
                    }}>🏗️</div>
                    <div>
                        <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 800, color: 'var(--amber)', letterSpacing: '0.06em', lineHeight: 1 }}>
                            KMR <span style={{ color: 'var(--cyan)' }}>INNOVATORS</span>
                        </div>
                        <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '0.15em', lineHeight: 1 }}>INTELLIGENCE PLATFORM</div>
                    </div>
                </div>

                {/* Desktop quick nav */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'nowrap', overflow: 'hidden' }}>
                    {navItems.slice(0, 6).map(item => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            style={({ isActive }) => ({
                                display: 'flex',
                                alignItems: 'center',
                                gap: 5,
                                padding: '6px 12px',
                                borderRadius: 8,
                                fontSize: '0.78rem',
                                fontFamily: 'var(--font-body)',
                                fontWeight: 500,
                                textDecoration: 'none',
                                color: isActive ? 'var(--amber)' : 'var(--text-secondary)',
                                background: isActive ? 'rgba(245,158,11,0.1)' : 'transparent',
                                border: isActive ? '1px solid rgba(245,158,11,0.2)' : '1px solid transparent',
                                transition: 'all 0.2s',
                            })}
                        >
                            <item.icon size={14} />
                            <span className="hide-sm">{item.label}</span>
                        </NavLink>
                    ))}
                </div>

                {/* Controls */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {project && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.3)', borderRadius: 8 }}>
                            <span style={{ fontSize: '0.65rem', color: 'var(--cyan)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Active:</span>
                            <span style={{ fontSize: '0.78rem', color: 'var(--text-primary)' }}>{project.project_name?.slice(0, 20)}</span>
                        </div>
                    )}
                    <button
                        className="btn btn-ghost"
                        style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                        onClick={() => setSimpleView(!simpleView)}
                        title="Toggle Simple/Technical View"
                    >
                        {simpleView ? '📊 Technical' : '💬 Simple'}
                    </button>
                    <button
                        className="btn btn-ghost"
                        style={{ padding: '6px 12px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                        onClick={() => navigate('/about')}
                    >
                        <Info size={14} /> About
                    </button>
                    <button
                        className="btn btn-ghost"
                        style={{ padding: '4px 8px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 4, borderRadius: 20, border: '1px solid rgba(255,255,255,0.1)' }}
                        onClick={() => setLanguage(language === 'English' ? 'Hindi' : 'English')}
                        title="Toggle AI Language"
                    >
                        <Globe size={14} style={{ color: 'var(--cyan)' }} />
                        <span style={{ color: language === 'English' ? 'var(--amber)' : 'var(--text-muted)' }}>EN</span>
                        <span style={{ opacity: 0.3 }}>|</span>
                        <span style={{ color: language === 'Hindi' ? 'var(--amber)' : 'var(--text-muted)' }}>HI</span>
                    </button>
                    <button
                        className="btn btn-ghost"
                        style={{ padding: '6px 10px', display: 'flex', alignItems: 'center' }}
                        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                        title="Toggle Light/Dark Theme"
                    >
                        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                    </button>
                    <button
                        className="btn btn-ghost"
                        style={{ padding: '6px 10px' }}
                        onClick={() => setOpen(!open)}
                    >
                        {open ? <X size={18} /> : <Menu size={18} />}
                    </button>
                </div>
            </nav>

            {/* Slide-out menu */}
            {open && (
                <div style={{
                    position: 'fixed',
                    top: 64,
                    right: 0,
                    bottom: 0,
                    width: 260,
                    background: 'rgba(10,12,15,0.97)',
                    backdropFilter: 'blur(20px)',
                    borderLeft: '1px solid rgba(245,158,11,0.15)',
                    zIndex: 999,
                    padding: '24px 0',
                    overflowY: 'auto',
                }}>
                    {navItems.map((item, i) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            onClick={() => setOpen(false)}
                            style={({ isActive }) => ({
                                display: 'flex',
                                alignItems: 'center',
                                gap: 12,
                                padding: '12px 24px',
                                fontSize: '0.9rem',
                                fontFamily: 'var(--font-body)',
                                textDecoration: 'none',
                                color: isActive ? 'var(--amber)' : 'var(--text-secondary)',
                                background: isActive ? 'rgba(245,158,11,0.08)' : 'transparent',
                                borderLeft: isActive ? '3px solid var(--amber)' : '3px solid transparent',
                                transition: 'all 0.2s',
                            })}
                        >
                            <item.icon size={16} />
                            {item.label}
                        </NavLink>
                    ))}
                </div>
            )}
        </>
    )
}

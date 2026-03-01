import { useState, useEffect, useRef } from 'react'

// Animated counting number from 0 to target
export function AnimatedNumber({ value, prefix = '', suffix = '', duration = 1500, decimals = 0 }) {
    const [display, setDisplay] = useState(0)
    const startRef = useRef(null)
    const rafRef = useRef(null)

    useEffect(() => {
        if (typeof value !== 'number') return
        const start = Date.now()
        startRef.current = start
        const animate = () => {
            const elapsed = Date.now() - start
            const progress = Math.min(elapsed / duration, 1)
            // Ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3)
            setDisplay(value * eased)
            if (progress < 1) {
                rafRef.current = requestAnimationFrame(animate)
            } else {
                setDisplay(value)
            }
        }
        rafRef.current = requestAnimationFrame(animate)
        return () => cancelAnimationFrame(rafRef.current)
    }, [value, duration])

    const formatted = decimals > 0
        ? display.toFixed(decimals)
        : Math.round(display).toLocaleString('en-IN')

    return <span>{prefix}{formatted}{suffix}</span>
}

// Shimmer skeleton loader
export function Skeleton({ width = '100%', height = '20px', style = {} }) {
    return (
        <div
            className="shimmer"
            style={{ width, height, borderRadius: '8px', ...style }}
        />
    )
}

// Risk level badge
export function RiskBadge({ level }) {
    const colors = {
        LOW: 'badge-green',
        MEDIUM: 'badge-amber',
        HIGH: 'badge-red',
        CRITICAL: 'badge-red',
    }
    return <span className={`badge ${colors[level] || 'badge-gray'}`}>{level}</span>
}

// KPI mini card for dashboard
export function KpiCard({ label, value, prefix = '', suffix = '', color = 'amber', subLabel = '', icon, onClick, delay = 0, animate = true }) {
    const colorMap = {
        amber: 'kpi-amber',
        cyan: 'kpi-cyan',
        red: 'kpi-red',
        green: 'kpi-green',
        white: '',
    }

    return (
        <div
            className={`glass-card slide-up delay-${delay}`}
            style={{ padding: '24px', cursor: onClick ? 'pointer' : 'default' }}
            onClick={onClick}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <span className="label">{label}</span>
                {icon && <span style={{ fontSize: '1.4rem', opacity: 0.8 }}>{icon}</span>}
            </div>
            <div className={`kpi-number ${colorMap[color]}`} style={{ marginBottom: 4 }}>
                {animate && typeof value === 'number'
                    ? <AnimatedNumber value={value} prefix={prefix} suffix={suffix} />
                    : `${prefix}${typeof value === 'number' ? value.toLocaleString('en-IN') : value}${suffix}`
                }
            </div>
            {subLabel && <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{subLabel}</div>}
        </div>
    )
}

// Section header with amber line
export function SectionHeader({ label, title, subtitle }) {
    return (
        <div style={{ marginBottom: 32 }}>
            {label && <div className="label" style={{ marginBottom: 8 }}>{label}</div>}
            <div className="amber-line" />
            <h2>{title}</h2>
            {subtitle && <p style={{ marginTop: 8, maxWidth: 600 }}>{subtitle}</p>}
        </div>
    )
}

// Empty state
export function EmptyState({ icon = '📊', title = 'No Data', description = 'Run a calculation to see results here.', action }) {
    return (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: '3rem', marginBottom: 16 }}>{icon}</div>
            <h4 style={{ color: 'var(--text-secondary)', marginBottom: 8, textTransform: 'none' }}>{title}</h4>
            <p style={{ maxWidth: 400, margin: '0 auto 20px' }}>{description}</p>
            {action}
        </div>
    )
}

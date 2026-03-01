import { useRef, useCallback } from 'react'

export default function MagneticCard({ children, className = '', style = {}, onClick }) {
    const cardRef = useRef(null)

    const handleMouseMove = useCallback((e) => {
        const card = cardRef.current
        if (!card) return
        const rect = card.getBoundingClientRect()
        const cx = rect.left + rect.width / 2
        const cy = rect.top + rect.height / 2
        const dx = (e.clientX - cx) / (rect.width / 2)
        const dy = (e.clientY - cy) / (rect.height / 2)
        const rotX = -dy * 6
        const rotY = dx * 6
        card.style.transform = `perspective(1000px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateY(-8px) scale(1.02)`
    }, [])

    const handleMouseLeave = useCallback(() => {
        const card = cardRef.current
        if (!card) return
        card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateY(0) scale(1)'
    }, [])

    return (
        <div
            ref={cardRef}
            className={`glass-card ${className}`}
            style={{
                transition: 'transform 0.2s cubic-bezier(0.4,0,0.2,1), box-shadow 0.2s, border-color 0.2s',
                willChange: 'transform',
                cursor: onClick ? 'pointer' : 'default',
                ...style,
            }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onClick={onClick}
        >
            {children}
        </div>
    )
}

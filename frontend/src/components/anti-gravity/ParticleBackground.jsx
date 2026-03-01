import { useEffect, useRef } from 'react'

// Lightweight particle background — pure CSS + JS canvas, no external lib needed
export default function ParticleBackground() {
    const canvasRef = useRef(null)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')

        const resize = () => {
            canvas.width = window.innerWidth
            canvas.height = window.innerHeight
        }
        resize()
        window.addEventListener('resize', resize)

        const particles = Array.from({ length: 60 }, () => ({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 3 + 1,
            speed: Math.random() * 0.4 + 0.1,
            opacity: Math.random() * 0.15 + 0.03,
            type: Math.random() > 0.5 ? 'hex' : 'tri',
        }))

        const drawHex = (ctx, x, y, r, opacity) => {
            ctx.beginPath()
            for (let i = 0; i < 6; i++) {
                const angle = (Math.PI / 3) * i
                ctx.lineTo(x + r * Math.cos(angle), y + r * Math.sin(angle))
            }
            ctx.closePath()
            ctx.strokeStyle = `rgba(245,158,11,${opacity})`
            ctx.lineWidth = 0.8
            ctx.stroke()
        }

        const drawTri = (ctx, x, y, r, opacity) => {
            ctx.beginPath()
            ctx.moveTo(x, y - r)
            ctx.lineTo(x + r * 0.866, y + r * 0.5)
            ctx.lineTo(x - r * 0.866, y + r * 0.5)
            ctx.closePath()
            ctx.strokeStyle = `rgba(6,182,212,${opacity})`
            ctx.lineWidth = 0.8
            ctx.stroke()
        }

        let rafId
        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height)
            particles.forEach(p => {
                p.y -= p.speed
                if (p.y < -20) {
                    p.y = canvas.height + 20
                    p.x = Math.random() * canvas.width
                }
                if (p.type === 'hex') drawHex(ctx, p.x, p.y, p.size * 4, p.opacity)
                else drawTri(ctx, p.x, p.y, p.size * 3, p.opacity)
            })
            rafId = requestAnimationFrame(animate)
        }
        animate()

        return () => {
            window.removeEventListener('resize', resize)
            cancelAnimationFrame(rafId)
        }
    }, [])

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'fixed',
                inset: 0,
                pointerEvents: 'none',
                zIndex: 0,
                opacity: 0.6,
            }}
        />
    )
}

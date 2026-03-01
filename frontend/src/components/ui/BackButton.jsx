import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function BackButton({ to = -1, label = "Back", style = {} }) {
    const navigate = useNavigate()
    return (
        <button
            onClick={() => navigate(to)}
            className="btn btn-ghost"
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                fontSize: '0.85rem',
                marginBottom: '20px',
                color: 'var(--text-secondary)',
                ...style
            }}
        >
            <ArrowLeft size={16} /> {label}
        </button>
    )
}

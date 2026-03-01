import { useState, useRef, useEffect } from 'react'
import useProjectStore from '../../store/projectStore'
import { streamChat } from '../../api/client'
import { MessageSquare, X, Send, Bot, User, Loader } from 'lucide-react'

export default function ChatAssistant() {
    const { project, calculation, language } = useProjectStore()
    const [open, setOpen] = useState(false)
    const [messages, setMessages] = useState([
        { role: 'assistant', content: '🏗️ Hi! I\'m your AI construction consultant. I can answer questions about your project costs, risks, timeline, and more. What would you like to know?' }
    ])
    const [input, setInput] = useState('')
    const [streaming, setStreaming] = useState(false)
    const bottomRef = useRef(null)

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages, streaming])

    const send = () => {
        if (!input.trim() || streaming) return
        const userMsg = input.trim()
        setInput('')
        setMessages(prev => [...prev, { role: 'user', content: userMsg }])
        setStreaming(true)

        let assistantMsg = ''
        setMessages(prev => [...prev, { role: 'assistant', content: '' }])

        streamChat(
            {
                project: project || { project_name: 'General Query', project_type: 'Residential', area_sqft: 1000, floors: 2, budget: 5000000, city: 'Bangalore', state: 'Karnataka', quality_grade: 'Standard', optimization_priority: 'Balanced', start_date: '2025-04-01', end_date: '2026-04-01', currency: 'INR' },
                calculation_result: calculation || {},
                message: userMsg,
                chat_history: messages.slice(-10),
                language,
            },
            (token) => {
                assistantMsg += token
                setMessages(prev => {
                    const updated = [...prev]
                    updated[updated.length - 1] = { role: 'assistant', content: assistantMsg }
                    return updated
                })
            },
            () => setStreaming(false)
        )
    }

    const handleKey = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            send()
        }
    }

    const quickPrompts = [
        'Why is my risk score high?',
        'How can I reduce costs?',
        'Explain the Gantt chart',
        'What materials should I order first?',
    ]

    return (
        <>
            {/* Floating chat bubble */}
            <button
                onClick={() => setOpen(!open)}
                className={open ? 'pulse-amber' : ''}
                style={{
                    position: 'fixed',
                    bottom: 28,
                    right: 28,
                    width: 58,
                    height: 58,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #F59E0B, #06B6D4)',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 2000,
                    boxShadow: '0 8px 32px rgba(245,158,11,0.4)',
                    transition: 'all 0.3s',
                    transform: open ? 'scale(0.9)' : 'scale(1)',
                }}
                title="AI Construction Assistant"
            >
                {open ? <X size={24} color="#000" /> : <MessageSquare size={24} color="#000" />}
            </button>

            {/* Chat panel */}
            {open && (
                <div style={{
                    position: 'fixed',
                    bottom: 96,
                    right: 28,
                    width: 380,
                    maxWidth: 'calc(100vw - 48px)',
                    height: 520,
                    background: 'rgba(10,12,15,0.97)',
                    backdropFilter: 'blur(24px)',
                    border: '1px solid rgba(245,158,11,0.25)',
                    borderRadius: 20,
                    display: 'flex',
                    flexDirection: 'column',
                    zIndex: 2000,
                    overflow: 'hidden',
                    boxShadow: '0 24px 64px rgba(0,0,0,0.6), 0 0 40px rgba(245,158,11,0.1)',
                }}>
                    {/* Header */}
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(245,158,11,0.15)', background: 'rgba(245,158,11,0.05)', display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #F59E0B, #06B6D4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Bot size={18} color="#000" />
                        </div>
                        <div>
                            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', color: 'var(--amber)', letterSpacing: '0.06em' }}>AI ASSISTANT</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Powered by Claude AI — always available</div>
                        </div>
                        {streaming && <Loader size={14} color="var(--cyan)" style={{ marginLeft: 'auto', animation: 'spin 1s linear infinite' }} />}
                    </div>

                    {/* Messages */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {messages.map((msg, i) => (
                            <div key={i} style={{
                                display: 'flex',
                                gap: 8,
                                flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                            }}>
                                <div style={{
                                    width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                                    background: msg.role === 'user' ? 'rgba(245,158,11,0.2)' : 'rgba(6,182,212,0.2)',
                                    border: `1px solid ${msg.role === 'user' ? 'rgba(245,158,11,0.4)' : 'rgba(6,182,212,0.4)'}`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    {msg.role === 'user'
                                        ? <User size={14} color="var(--amber)" />
                                        : <Bot size={14} color="var(--cyan)" />
                                    }
                                </div>
                                <div style={{
                                    background: msg.role === 'user' ? 'rgba(245,158,11,0.1)' : 'rgba(255,255,255,0.04)',
                                    border: `1px solid ${msg.role === 'user' ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.07)'}`,
                                    borderRadius: msg.role === 'user' ? '12px 4px 12px 12px' : '4px 12px 12px 12px',
                                    padding: '10px 14px',
                                    maxWidth: '82%',
                                    fontSize: '0.85rem',
                                    lineHeight: 1.6,
                                    color: 'var(--text-primary)',
                                    fontFamily: 'var(--font-body)',
                                    whiteSpace: 'pre-wrap',
                                }}>
                                    {msg.content || (streaming && i === messages.length - 1
                                        ? <span style={{ color: 'var(--cyan)' }}>●●●</span>
                                        : ''
                                    )}
                                </div>
                            </div>
                        ))}
                        <div ref={bottomRef} />
                    </div>

                    {/* Quick prompts */}
                    {messages.length <= 2 && (
                        <div style={{ padding: '0 16px 8px', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            {quickPrompts.map(q => (
                                <button
                                    key={q}
                                    onClick={() => { setInput(q); }}
                                    style={{
                                        background: 'rgba(255,255,255,0.04)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: 8,
                                        padding: '5px 10px',
                                        fontSize: '0.72rem',
                                        color: 'var(--text-secondary)',
                                        cursor: 'pointer',
                                        fontFamily: 'var(--font-body)',
                                        transition: 'all 0.2s',
                                    }}
                                >
                                    {q}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Input */}
                    <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', gap: 8 }}>
                        <textarea
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={handleKey}
                            placeholder="Ask anything about your project..."
                            rows={2}
                            style={{
                                flex: 1,
                                background: 'rgba(255,255,255,0.04)',
                                border: '1px solid rgba(245,158,11,0.2)',
                                borderRadius: 10,
                                color: 'var(--text-primary)',
                                fontFamily: 'var(--font-body)',
                                fontSize: '0.85rem',
                                padding: '8px 12px',
                                resize: 'none',
                                outline: 'none',
                            }}
                        />
                        <button
                            onClick={send}
                            disabled={!input.trim() || streaming}
                            style={{
                                background: streaming ? 'rgba(245,158,11,0.3)' : 'linear-gradient(135deg, #F59E0B, #D97706)',
                                border: 'none',
                                borderRadius: 10,
                                padding: '8px 14px',
                                cursor: streaming ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.2s',
                            }}
                        >
                            <Send size={18} color="#000" />
                        </button>
                    </div>
                </div>
            )}

            <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
        </>
    )
}

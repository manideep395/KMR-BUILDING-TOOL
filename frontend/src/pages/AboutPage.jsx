import { Link } from 'react-router-dom'
import { SectionHeader } from '../components/ui/UIComponents'

export default function AboutPage() {
    return (
        <div style={{ minHeight: '100vh', padding: '100px 24px 60px' }}>
            <div className="container slide-up">
                <SectionHeader title="About KMR Innovators" subtitle="Pioneering AI-Driven Construction Intelligence" />

                <div className="glass-card slide-up delay-1" style={{ padding: '32px', marginBottom: 24, fontSize: '1.05rem', lineHeight: 1.8, color: 'var(--text-secondary)' }}>
                    <p style={{ marginBottom: 16 }}>
                        At KMR Innovators, we are dedicated to transforming the construction industry through cutting-edge artificial intelligence, data analytics, and predictive modeling. Our flagship platform helps builders, contractors, and individuals optimize project costs, reduce timelines, and ensure environmental compliance with unprecedented accuracy.
                    </p>
                    <p style={{ marginBottom: 16 }}>
                        Built initially for the unique nuances of the Indian construction landscape, our engine factors in granular details from real-time material pricing in tier-1/tier-2 cities to localized labor availability and compliance codes.
                    </p>
                    <p style={{ marginBottom: 16 }}>
                        Ready to elevate your next construction project? Get in touch with our team of experts to discover how KMR Innovators can help you build smarter, faster, and more sustainably.
                    </p>

                    <div style={{ marginTop: 32, padding: '24px', background: 'rgba(255,255,255,0.03)', borderRadius: 12, border: '1px solid var(--border-card)' }}>
                        <h3 style={{ color: 'var(--text-primary)', marginBottom: 16, fontSize: '1.2rem' }}>Contact Information</h3>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                            <li style={{ marginBottom: 8 }}><strong>Name:</strong> KASIREDDY MANIDEEP REDDY</li>
                            <li style={{ marginBottom: 8 }}>
                                <strong>Email:</strong> <a href="mailto:kasireddymanideepreddy405@gmail.com" style={{ color: 'var(--amber)', textDecoration: 'none' }}>kasireddymanideepreddy405@gmail.com</a>
                            </li>
                            <li>
                                <strong>Mobile:</strong> <a href="tel:+919390424085" style={{ color: 'var(--amber)', textDecoration: 'none' }}>(+91) 9390424085</a>
                            </li>
                        </ul>
                    </div>
                </div>

                <div style={{ marginTop: 32, textAlign: 'center' }}>
                    <Link to="/" className="btn btn-primary" style={{ padding: '10px 24px' }}>Back to Home</Link>
                </div>
            </div>
        </div>
    )
}

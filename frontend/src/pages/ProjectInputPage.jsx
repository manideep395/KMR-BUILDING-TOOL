import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import useProjectStore from '../store/projectStore'
import { calculateProject, assessRisk, getCriticalPath, getCarbonFootprint, checkCompliance, getProcurement, optimizeResources, benchmarkProject } from '../api/client'
import toast from 'react-hot-toast'
import { SectionHeader } from '../components/ui/UIComponents'

const INDIAN_STATES = ['Andhra Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Delhi', 'Gujarat', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Odisha', 'Punjab', 'Rajasthan', 'Tamil Nadu', 'Telangana', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal']

const CITIES_BY_STATE = {
    'Maharashtra': ['Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Aurangabad'],
    'Karnataka': ['Bangalore', 'Mysore', 'Belgaum', 'Hubli'],
    'Telangana': ['Hyderabad', 'Warangal', 'Nizamabad'],
    'Delhi': ['Delhi', 'Noida', 'Gurugram'],
    'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Salem'],
    'Gujarat': ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot'],
    'West Bengal': ['Kolkata', 'Asansol', 'Siliguri'],
    'Rajasthan': ['Jaipur', 'Jodhpur', 'Udaipur', 'Kota'],
    'Uttar Pradesh': ['Lucknow', 'Agra', 'Varanasi', 'Kanpur'],
    'Madhya Pradesh': ['Indore', 'Bhopal', 'Jabalpur'],
    'Bihar': ['Patna', 'Gaya', 'Bhagalpur'],
    'Andhra Pradesh': ['Visakhapatnam', 'Vijayawada', 'Guntur'],
    'Kerala': ['Kochi', 'Thiruvananthapuram', 'Kozhikode'],
    'Punjab': ['Chandigarh', 'Ludhiana', 'Amritsar'],
    'Odisha': ['Bhubaneswar', 'Cuttack', 'Rourkela'],
    'Assam': ['Guwahati', 'Dibrugarh', 'Silchar'],
    'Chhattisgarh': ['Raipur', 'Bilaspur', 'Durg'],
    'Uttarakhand': ['Dehradun', 'Haridwar', 'Nainital'],
}

const QUICK_TEMPLATES = {
    'Residential': { project_name: '2BHK Home', project_type: 'Residential', area_sqft: 1200, floors: 2, budget: 5000000, city: 'Bangalore', state: 'Karnataka', quality_grade: 'Standard', optimization_priority: 'Balanced', start_date: '2025-04-01', end_date: '2026-06-30', currency: 'INR' },
    'Commercial': { project_name: 'Commercial Shop', project_type: 'Commercial', area_sqft: 800, floors: 1, budget: 3500000, city: 'Hyderabad', state: 'Telangana', quality_grade: 'Standard', optimization_priority: 'Minimize Cost', start_date: '2025-05-01', end_date: '2025-12-31', currency: 'INR' },
    'Industrial': { project_name: 'Industrial Warehouse', project_type: 'Industrial', area_sqft: 10000, floors: 1, budget: 15000000, city: 'Pune', state: 'Maharashtra', quality_grade: 'Economy', optimization_priority: 'Minimize Cost', start_date: '2025-06-01', end_date: '2026-03-31', currency: 'INR' },
    'IT Office': { project_name: 'IT Office Space', project_type: 'Commercial', area_sqft: 5000, floors: 3, budget: 25000000, city: 'Bangalore', state: 'Karnataka', quality_grade: 'Premium', optimization_priority: 'Balanced', start_date: '2025-04-01', end_date: '2026-09-30', currency: 'INR' },
}

const LOADING_STEPS = [
    '🔍 Analyzing project parameters...',
    '🏗️ Computing material requirements...',
    '💰 Calculating regional costs...',
    '👷 Evaluating workforce needs...',
    '📅 Building phase timeline...',
    '⚠️ Assessing risk factors...',
    '🌤️ Fetching weather forecast...',
    '🧠 Running Claude AI analysis...',
    '📊 Generating full intelligence report...',
]

const QUALITY_GRADES = [
    { value: 'Economy', emoji: '🏠', desc: 'Basic materials, cost-optimized', color: 'var(--green)' },
    { value: 'Standard', emoji: '🏢', desc: 'Good quality, ISI-certified materials', color: 'var(--cyan)' },
    { value: 'Premium', emoji: '🏛️', desc: 'High-end finishes, premium brands', color: 'var(--amber)' },
    { value: 'Luxury', emoji: '💎', desc: 'Top-of-line materials, custom work', color: '#A855F7' },
]

export default function ProjectInputPage() {
    const navigate = useNavigate()
    const { setProject, setCalculation, setRiskData, setCpaData, setCarbonData, setComplianceData, setProcurementData, setOptimizeData, setBenchmarkData } = useProjectStore()

    const [form, setForm] = useState({
        project_name: '',
        project_type: 'Residential',
        area_sqft: 1500,
        floors: 2,
        budget: 8000000,
        currency: 'INR',
        start_date: '2025-04-01',
        end_date: '2026-06-30',
        city: 'Bangalore',
        state: 'Karnataka',
        quality_grade: 'Standard',
        optimization_priority: 'Balanced',
    })
    const [errors, setErrors] = useState({})
    const [loading, setLoading] = useState(false)
    const [loadingStep, setLoadingStep] = useState(0)
    const [completion, setCompletion] = useState(0)

    // Calculate form completion percentage
    useEffect(() => {
        const fields = ['project_name', 'project_type', 'area_sqft', 'floors', 'budget', 'start_date', 'end_date', 'city', 'state', 'quality_grade']
        const filled = fields.filter(f => form[f] && form[f] !== '').length
        setCompletion(Math.round((filled / fields.length) * 100))
    }, [form])

    const cities = CITIES_BY_STATE[form.state] || ['City']

    const update = (key, value) => {
        setForm(prev => ({ ...prev, [key]: value }))
        if (errors[key]) setErrors(prev => ({ ...prev, [key]: null }))
        if (key === 'state') {
            setForm(prev => ({ ...prev, state: value, city: (CITIES_BY_STATE[value] || ['City'])[0] }))
        }
    }

    const applyTemplate = (key) => {
        const t = QUICK_TEMPLATES[key]
        if (t) setForm({ ...t })
    }

    const validate = () => {
        const errs = {}
        if (!form.project_name.trim()) errs.project_name = 'Project name is required'
        if (!form.area_sqft || form.area_sqft < 100) errs.area_sqft = 'Area must be at least 100 sqft'
        if (!form.budget || form.budget < 100000) errs.budget = 'Budget must be at least ₹1 Lakh'
        if (!form.start_date) errs.start_date = 'Start date required'
        if (!form.end_date) errs.end_date = 'End date required'
        if (form.start_date && form.end_date && form.start_date >= form.end_date) errs.end_date = 'End date must be after start date'
        setErrors(errs)
        return Object.keys(errs).length === 0
    }

    const runLoadingSteps = async (stepCallback) => {
        for (let i = 0; i < LOADING_STEPS.length; i++) {
            setLoadingStep(i)
            await new Promise(r => setTimeout(r, 400))
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!validate()) return

        setLoading(true)
        setProject(form)

        try {
            // Run loading animation in parallel with API calls
            const loadingPromise = runLoadingSteps()

            // Core calculation
            const calcRes = await calculateProject(form)
            const calc = calcRes.data
            setCalculation(calc)

            // Parallel secondary calls
            const [riskRes, cpaRes, carbonRes, complianceRes, procRes, optRes, benchRes] = await Promise.allSettled([
                assessRisk({ project: form, total_cost: calc.total_project_cost, budget: form.budget }),
                getCriticalPath({ project: form, phases: calc.phases }),
                getCarbonFootprint(form),
                checkCompliance(form),
                getProcurement(form),
                optimizeResources({ project: form, phases: calc.phases, total_cost: calc.total_project_cost }),
                benchmarkProject({ project: form, total_cost: calc.total_project_cost, material_costs: calc.material_costs }),
            ])

            if (riskRes.status === 'fulfilled') setRiskData(riskRes.value.data)
            if (cpaRes.status === 'fulfilled') setCpaData(cpaRes.value.data)
            if (carbonRes.status === 'fulfilled') setCarbonData(carbonRes.value.data)
            if (complianceRes.status === 'fulfilled') setComplianceData(complianceRes.value.data)
            if (procRes.status === 'fulfilled') setProcurementData(procRes.value.data)
            if (optRes.status === 'fulfilled') setOptimizeData(optRes.value.data)
            if (benchRes.status === 'fulfilled') setBenchmarkData(benchRes.value.data)

            await loadingPromise
            toast.success('🏗️ Project analysis complete!')
            navigate('/dashboard')
        } catch (err) {
            toast.error('Calculation failed. Check backend connection.')
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 24px' }}>
                <div style={{ textAlign: 'center', maxWidth: 500 }}>
                    <div style={{ fontSize: '4rem', marginBottom: 24, animation: 'float 2s ease-in-out infinite' }}>🏗️</div>
                    <h2 style={{ marginBottom: 8, color: 'var(--amber)' }}>ANALYZING PROJECT</h2>
                    <p style={{ marginBottom: 32, color: 'var(--text-secondary)' }}>Running AI construction intelligence engine...</p>
                    <div className="glass-card" style={{ padding: '32px', textAlign: 'left' }}>
                        {LOADING_STEPS.map((step, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                <div style={{
                                    width: 20, height: 20, borderRadius: '50%',
                                    background: i < loadingStep ? 'var(--green)' : i === loadingStep ? 'var(--amber)' : 'rgba(255,255,255,0.1)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '0.6rem', flexShrink: 0,
                                    transition: 'all 0.3s',
                                }}>
                                    {i < loadingStep ? '✓' : i === loadingStep ? '●' : ''}
                                </div>
                                <span style={{ fontSize: '0.9rem', color: i === loadingStep ? 'var(--text-primary)' : i < loadingStep ? 'var(--text-muted)' : 'var(--text-muted)', transition: 'all 0.3s' }}>
                                    {step}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div style={{ minHeight: '100vh', padding: '100px 24px 60px' }}>
            <div className="container" style={{ maxWidth: 900 }}>
                <SectionHeader label="Project Setup" title="Configure Your Project" subtitle="Fill in your construction project details for a complete AI-powered analysis." />

                {/* Quick Templates */}
                <div className="glass-card slide-up" style={{ padding: '20px', marginBottom: 24 }}>
                    <div className="label" style={{ marginBottom: 12 }}>⚡ Quick Start Templates</div>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        {Object.keys(QUICK_TEMPLATES).map(key => (
                            <button key={key} className="btn btn-ghost" style={{ fontSize: '0.85rem', padding: '8px 16px' }} onClick={() => applyTemplate(key)}>
                                {key === 'Residential' ? '🏠 2BHK Home' : key === 'Commercial' ? '🏪 Commercial Shop' : key === 'Industrial' ? '🏭 Warehouse' : '💼 IT Office'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Completion bar */}
                <div style={{ marginBottom: 24 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span className="label">Form Completion</span>
                        <span className="label" style={{ color: 'var(--cyan)' }}>{completion}%</span>
                    </div>
                    <div className="progress-bar"><div className="progress-fill" style={{ width: `${completion}%` }} /></div>
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
                        {/* Project Name */}
                        <div className="glass-card slide-up" style={{ padding: '20px', gridColumn: '1 / -1' }}>
                            <div className="form-group">
                                <label className="form-label">Project Name</label>
                                <input value={form.project_name} onChange={e => update('project_name', e.target.value)} placeholder="e.g., My Dream Home, IT Park Phase 1" className={errors.project_name ? 'error' : ''} />
                                {errors.project_name && <span style={{ color: 'var(--red)', fontSize: '0.78rem' }}>{errors.project_name}</span>}
                            </div>
                        </div>

                        {/* Project Type */}
                        <div className="glass-card slide-up delay-1" style={{ padding: '20px' }}>
                            <div className="form-group">
                                <label className="form-label">Project Type</label>
                                <select value={form.project_type} onChange={e => update('project_type', e.target.value)}>
                                    <option>Residential</option>
                                    <option>Commercial</option>
                                    <option>Industrial</option>
                                    <option>Infrastructure</option>
                                </select>
                            </div>
                        </div>

                        {/* Currency */}
                        <div className="glass-card slide-up delay-1" style={{ padding: '20px' }}>
                            <div className="form-group">
                                <label className="form-label">Currency</label>
                                <select value={form.currency} onChange={e => update('currency', e.target.value)}>
                                    <option value="INR">₹ INR (Indian Rupee)</option>
                                    <option value="USD">$ USD (US Dollar)</option>
                                </select>
                            </div>
                        </div>

                        {/* Area */}
                        <div className="glass-card slide-up delay-2" style={{ padding: '20px' }}>
                            <div className="form-group">
                                <label className="form-label">Total Built-up Area (sq ft)</label>
                                <input type="number" value={form.area_sqft} onChange={e => update('area_sqft', +e.target.value)} min="100" max="500000" className={errors.area_sqft ? 'error' : ''} />
                                <input type="range" min="100" max="50000" step="100" value={form.area_sqft} onChange={e => update('area_sqft', +e.target.value)} style={{ width: '100%', accentColor: 'var(--amber)', marginTop: 4 }} />
                                {errors.area_sqft && <span style={{ color: 'var(--red)', fontSize: '0.78rem' }}>{errors.area_sqft}</span>}
                            </div>
                        </div>

                        {/* Floors */}
                        <div className="glass-card slide-up delay-2" style={{ padding: '20px' }}>
                            <div className="form-group">
                                <label className="form-label">Number of Floors: <span style={{ color: 'var(--amber)' }}>{form.floors}</span></label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <button type="button" className="btn btn-ghost" style={{ padding: '8px 16px', fontSize: '1.2rem' }} onClick={() => update('floors', Math.max(1, form.floors - 1))}>−</button>
                                    <input type="number" value={form.floors} onChange={e => update('floors', Math.max(1, Math.min(100, +e.target.value)))} style={{ textAlign: 'center', width: 80 }} />
                                    <button type="button" className="btn btn-ghost" style={{ padding: '8px 16px', fontSize: '1.2rem' }} onClick={() => update('floors', Math.min(100, form.floors + 1))}>+</button>
                                </div>
                            </div>
                        </div>

                        {/* Budget */}
                        <div className="glass-card slide-up delay-3" style={{ padding: '20px' }}>
                            <div className="form-group">
                                <label className="form-label">Budget ({form.currency === 'INR' ? '₹' : '$'})</label>
                                <input type="number" value={form.budget} onChange={e => update('budget', +e.target.value)} min="100000" className={errors.budget ? 'error' : ''} />
                                <input type="range" min="500000" max="200000000" step="100000" value={form.budget} onChange={e => update('budget', +e.target.value)} style={{ width: '100%', accentColor: 'var(--amber)', marginTop: 4 }} />
                                <span style={{ fontSize: '0.78rem', color: 'var(--cyan)' }}>
                                    {form.currency === 'INR' ? `₹${(form.budget / 100000).toFixed(1)} Lakhs` : `$${(form.budget / 1000).toFixed(0)}K`}
                                </span>
                                {errors.budget && <span style={{ color: 'var(--red)', fontSize: '0.78rem' }}>{errors.budget}</span>}
                            </div>
                        </div>

                        {/* State */}
                        <div className="glass-card slide-up delay-3" style={{ padding: '20px' }}>
                            <div className="form-group">
                                <label className="form-label">State</label>
                                <select value={form.state} onChange={e => update('state', e.target.value)}>
                                    {INDIAN_STATES.map(s => <option key={s}>{s}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* City */}
                        <div className="glass-card slide-up delay-4" style={{ padding: '20px' }}>
                            <div className="form-group">
                                <label className="form-label">City</label>
                                <select value={form.city} onChange={e => update('city', e.target.value)}>
                                    {cities.map(c => <option key={c}>{c}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* Dates */}
                        <div className="glass-card slide-up delay-4" style={{ padding: '20px' }}>
                            <div className="form-group">
                                <label className="form-label">Start Date</label>
                                <input type="date" value={form.start_date} onChange={e => update('start_date', e.target.value)} className={errors.start_date ? 'error' : ''} />
                            </div>
                        </div>

                        <div className="glass-card slide-up delay-5" style={{ padding: '20px' }}>
                            <div className="form-group">
                                <label className="form-label">End Date (Target Completion)</label>
                                <input type="date" value={form.end_date} onChange={e => update('end_date', e.target.value)} className={errors.end_date ? 'error' : ''} />
                                {errors.end_date && <span style={{ color: 'var(--red)', fontSize: '0.78rem' }}>{errors.end_date}</span>}
                            </div>
                        </div>

                        {/* Quality Grade */}
                        <div className="glass-card slide-up delay-5" style={{ padding: '20px', gridColumn: '1 / -1' }}>
                            <div className="form-group">
                                <label className="form-label">Quality Grade</label>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginTop: 8 }}>
                                    {QUALITY_GRADES.map(g => (
                                        <div
                                            key={g.value}
                                            onClick={() => update('quality_grade', g.value)}
                                            style={{
                                                padding: '16px',
                                                borderRadius: 12,
                                                border: `2px solid ${form.quality_grade === g.value ? g.color : 'rgba(255,255,255,0.07)'}`,
                                                background: form.quality_grade === g.value ? `${g.color}15` : 'rgba(255,255,255,0.02)',
                                                cursor: 'pointer',
                                                textAlign: 'center',
                                                transition: 'all 0.2s',
                                            }}
                                        >
                                            <div style={{ fontSize: '1.8rem', marginBottom: 6 }}>{g.emoji}</div>
                                            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', color: g.color, marginBottom: 4 }}>{g.value}</div>
                                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{g.desc}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Optimization Priority */}
                        <div className="glass-card slide-up delay-6" style={{ padding: '20px', gridColumn: '1 / -1' }}>
                            <div className="form-group">
                                <label className="form-label">Optimization Priority</label>
                                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 8 }}>
                                    {['Minimize Cost', 'Minimize Time', 'Balanced'].map(opt => (
                                        <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '10px 18px', borderRadius: 10, border: `1.5px solid ${form.optimization_priority === opt ? 'var(--amber)' : 'rgba(255,255,255,0.1)'}`, background: form.optimization_priority === opt ? 'rgba(245,158,11,0.1)' : 'transparent', transition: 'all 0.2s' }}>
                                            <input type="radio" name="opt" checked={form.optimization_priority === opt} onChange={() => update('optimization_priority', opt)} style={{ accentColor: 'var(--amber)' }} />
                                            <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.9rem', color: form.optimization_priority === opt ? 'var(--amber)' : 'var(--text-secondary)' }}>{opt}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: 12, marginTop: 32, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                        <button type="button" className="btn btn-ghost" onClick={() => setForm(QUICK_TEMPLATES['Residential'])}>Reset</button>
                        <button type="submit" className="btn btn-primary" style={{ fontSize: '1rem', padding: '14px 36px' }} disabled={completion < 60}>
                            🚀 Analyze Project ({completion}% complete)
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

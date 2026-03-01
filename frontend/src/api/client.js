import axios from 'axios'
import toast from 'react-hot-toast'

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'

const client = axios.create({
    baseURL: API_BASE,
    timeout: 60000,
    headers: { 'Content-Type': 'application/json' },
})

client.interceptors.response.use(
    res => res,
    err => {
        const status = err.response?.status
        if (!err.response) {
            // Silently handle network errors
        } else if (status >= 500) {
            // Server-side error (silenced per user request)
            // toast.error('Server error. Please try again in a moment.', { id: 'server-err', duration: 4000 })
        } else if (status === 422) {
            toast.error('Invalid input data. Please check your project fields.', { duration: 4000 })
        } else {
            const msg = err.response?.data?.detail || err.message || 'An error occurred'
            toast.error(msg, { duration: 4000 })
        }
        return Promise.reject(err)
    }
)

// Construction calculation
export const calculateProject = (data) => client.post('/calculate', data)

// Critical Path Analysis
export const getCriticalPath = (data) => client.post('/critical-path', data)

// Risk assessment
export const assessRisk = (data) => client.post('/risk', data)

// Scenario simulation
export const simulateScenario = (data) => client.post('/simulate', data)

// Resource optimization
export const optimizeResources = (data) => client.post('/optimize', data)

// Benchmark
export const benchmarkProject = (data) => client.post('/benchmark', data)

// Procurement
export const getProcurement = (data) => client.post('/procurement', data)

// Carbon footprint
export const getCarbonFootprint = (data) => client.post('/carbon', data)

// Compliance check
export const checkCompliance = (data) => client.post('/compliance', data)

// ROI calculation
export const calculateROI = (data) => client.post('/roi', data)

// Contractor scoring & finding
export const scoreContractors = (data) => client.post('/contractor/score', data)
export const findNearbyBuilders = (data) => client.post('/contractor/find', data)

// Early warnings
export const getWarnings = (data) => client.post('/warnings', data)

// AI explain
export const aiExplain = (data) => client.post('/ai/explain', data)

// AI negotiate
export const aiNegotiate = (data) => client.post('/ai/negotiate', data)

// AI suggest
export const aiSuggest = (data) => client.post('/ai/suggest', data)

// Generate report
export const generateReport = async (data) => {
    const res = await client.post('/report/generate', data, { responseType: 'blob' })
    const url = window.URL.createObjectURL(new Blob([res.data]))
    const a = document.createElement('a')
    a.href = url
    a.download = `${data.project?.project_name || 'report'}_Report.pdf`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
}

// Material prices
export const getPrices = (city) => client.get(`/prices/${city}`)
export const getAllPrices = () => client.get('/prices')

// Chat streaming
export const streamChat = (data, onToken, onDone) => {
    const url = `${API_BASE}/ai/chat`
    const es = new EventSource(`${url}?dummy=1`) // placeholder
    // Use fetch for POST + SSE
    fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    }).then(res => {
        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        const read = () => {
            reader.read().then(({ done, value }) => {
                if (done) { onDone?.(); return }
                const text = decoder.decode(value, { stream: true })
                const lines = text.split('\n')
                lines.forEach(line => {
                    if (line.startsWith('data: ')) {
                        const payload = line.slice(6)
                        if (payload === '[DONE]') { onDone?.(); return }
                        try {
                            const obj = JSON.parse(payload)
                            if (obj.token) onToken(obj.token)
                        } catch (e) { }
                    }
                })
                read()
            })
        }
        read()
    })
}

export default client

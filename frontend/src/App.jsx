import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Navbar from './components/layout/Navbar'
import ChatAssistant from './components/ai/ChatAssistant'
import ParticleBackground from './components/anti-gravity/ParticleBackground'

import LandingPage from './pages/LandingPage'
import AboutPage from './pages/AboutPage'
import ProjectInputPage from './pages/ProjectInputPage'
import DashboardPage from './pages/DashboardPage'
import GanttPage from './pages/GanttPage'
import RiskPage from './pages/RiskPage'
import SimulatePage from './pages/SimulatePage'
import OptimizePage from './pages/OptimizePage'
import BenchmarkPage from './pages/BenchmarkPage'
import ProcurementPage from './pages/ProcurementPage'
import CarbonPage from './pages/CarbonPage'
import CompliancePage from './pages/CompliancePage'
import ROIPage from './pages/ROIPage'
import ContractorPage from './pages/ContractorPage'
import NegotiatePage from './pages/NegotiatePage'
import ReportPage from './pages/ReportPage'
import PortfolioPage from './pages/PortfolioPage'

export default function App() {
    return (
        <BrowserRouter>
            {/* Global Background */}
            <ParticleBackground />
            {/* Navigation */}
            <Navbar />
            {/* Toast Notifications */}
            <Toaster position="top-right" toastOptions={{
                style: { background: '#111418', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }
            }} />

            {/* Main Content */}
            <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/input" element={<ProjectInputPage />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/gantt" element={<GanttPage />} />
                <Route path="/risk" element={<RiskPage />} />
                <Route path="/simulate" element={<SimulatePage />} />
                <Route path="/optimize" element={<OptimizePage />} />
                <Route path="/benchmark" element={<BenchmarkPage />} />
                <Route path="/procurement" element={<ProcurementPage />} />
                <Route path="/carbon" element={<CarbonPage />} />
                <Route path="/compliance" element={<CompliancePage />} />
                <Route path="/roi" element={<ROIPage />} />
                <Route path="/contractor" element={<ContractorPage />} />
                <Route path="/negotiate" element={<NegotiatePage />} />
                <Route path="/report" element={<ReportPage />} />
                <Route path="/portfolio" element={<PortfolioPage />} />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>

            {/* Global Footer */}
            <footer className="global-footer-bg">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <span>© {new Date().getFullYear()}</span>
                    <span className="global-footer-highlight">KMR INNOVATORS</span>
                    <span style={{ color: 'var(--cyan)' }}>| Construction AI</span>
                </div>
                <div style={{ fontSize: '0.75rem', marginTop: '8px', opacity: 0.6 }}>
                    Redefining the Future of Building Intelligence.
                </div>
            </footer>

            {/* Global AI Chat Bubble */}
            <ChatAssistant />
        </BrowserRouter>
    )
}

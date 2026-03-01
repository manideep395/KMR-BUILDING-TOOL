import { create } from 'zustand'

const savedTheme = typeof window !== 'undefined' ? (localStorage.getItem('theme') || 'dark') : 'dark';
if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', savedTheme);
}

const useProjectStore = create((set, get) => ({
    // Current project data
    project: null,
    calculation: null,
    riskData: null,
    cpaData: null,
    carbonData: null,
    complianceData: null,
    procurementData: null,
    optimizeData: null,
    benchmarkData: null,
    roiData: null,
    warningsData: null,

    // UI state
    isCalculating: false,
    activeTab: 'dashboard',
    simpleView: false,
    language: 'English',
    theme: savedTheme,

    // Portfolio
    portfolio: JSON.parse(localStorage.getItem('portfolio') || '[]'),

    // Actions
    setProject: (project) => set({ project }),
    setCalculation: (calculation) => set({ calculation }),
    setRiskData: (riskData) => set({ riskData }),
    setCpaData: (cpaData) => set({ cpaData }),
    setCarbonData: (carbonData) => set({ carbonData }),
    setComplianceData: (complianceData) => set({ complianceData }),
    setProcurementData: (procurementData) => set({ procurementData }),
    setOptimizeData: (optimizeData) => set({ optimizeData }),
    setBenchmarkData: (benchmarkData) => set({ benchmarkData }),
    setRoiData: (roiData) => set({ roiData }),
    setWarningsData: (warningsData) => set({ warningsData }),
    setIsCalculating: (isCalculating) => set({ isCalculating }),
    setSimpleView: (simpleView) => set({ simpleView }),
    setLanguage: (language) => set({ language }),
    setTheme: (theme) => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        set({ theme });
    },

    saveToPortfolio: () => {
        const { project, calculation, riskData } = get()
        if (!project || !calculation) return

        const entry = {
            id: Date.now(),
            project,
            calculation,
            riskData,
            savedAt: new Date().toISOString(),
            status: 'Planning',
        }
        const portfolio = [...get().portfolio, entry]
        set({ portfolio })
        localStorage.setItem('portfolio', JSON.stringify(portfolio))
    },

    deleteFromPortfolio: (id) => {
        const portfolio = get().portfolio.filter(p => p.id !== id)
        set({ portfolio })
        localStorage.setItem('portfolio', JSON.stringify(portfolio))
    },

    clearProject: () => set({
        project: null, calculation: null, riskData: null, cpaData: null,
        carbonData: null, complianceData: null, procurementData: null,
        optimizeData: null, benchmarkData: null, roiData: null, warningsData: null,
    }),
}))

export default useProjectStore

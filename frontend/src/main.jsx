import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles/globals.css'
import { Toaster } from 'react-hot-toast'

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <App />
        <Toaster
            position="top-right"
            toastOptions={{
                style: {
                    background: '#111418',
                    color: '#F8FAFC',
                    border: '1px solid rgba(245,158,11,0.3)',
                    fontFamily: 'DM Sans, sans-serif',
                },
                success: { iconTheme: { primary: '#10B981', secondary: '#000' } },
                error: { iconTheme: { primary: '#EF4444', secondary: '#000' } },
            }}
        />
    </React.StrictMode>,
)

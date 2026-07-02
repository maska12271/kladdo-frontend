import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'
import './i18n'
import ErrorBoundary from './components/ErrorBoundary'
import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import { SettingsProvider } from './context/SettingsContext'

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <ErrorBoundary>
            <BrowserRouter>
                <ToastProvider>
                    <AuthProvider>
                        <SettingsProvider>
                            <ThemeProvider>
                                <App />
                            </ThemeProvider>
                        </SettingsProvider>
                    </AuthProvider>
                </ToastProvider>
            </BrowserRouter>
        </ErrorBoundary>
    </React.StrictMode>,
)
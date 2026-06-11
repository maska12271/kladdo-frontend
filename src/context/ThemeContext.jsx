import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
    const getInitialTheme = () => {
        const saved = localStorage.getItem('theme')
        if (saved === 'light' || saved === 'dark') return saved
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }

    const [theme, setTheme] = useState(getInitialTheme)

    useEffect(() => {
        const root = document.documentElement
        root.classList.toggle('dark', theme === 'dark')
        localStorage.setItem('theme', theme)
    }, [theme])

    const value = useMemo(() => ({
        theme,
        toggleTheme: () => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark')),
    }), [theme])

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
    return useContext(ThemeContext)
}
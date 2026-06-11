import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { apiPost, setUnauthorizedHandler } from '../api/client'

const AuthContext = createContext(null)

const TOKEN_KEY = 'token'
const USER_KEY = 'user'

function readStoredUser() {
    try {
        const raw = localStorage.getItem(USER_KEY)
        return raw ? JSON.parse(raw) : null
    } catch {
        return null
    }
}

export function AuthProvider({ children }) {
    const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY))
    const [user, setUser] = useState(readStoredUser)

    const logout = useCallback(() => {
        localStorage.removeItem(TOKEN_KEY)
        localStorage.removeItem(USER_KEY)
        setToken(null)
        setUser(null)
    }, [])

    // Let the API client trigger a logout when the backend rejects the token (401).
    useEffect(() => {
        setUnauthorizedHandler(logout)
        return () => setUnauthorizedHandler(null)
    }, [logout])

    const login = useCallback(async (email, password) => {
        const response = await apiPost('/auth/login', { email, password })
        localStorage.setItem(TOKEN_KEY, response.token)
        localStorage.setItem(USER_KEY, JSON.stringify(response.user))
        setToken(response.token)
        setUser(response.user)
        return response.user
    }, [])

    const value = useMemo(() => ({
        token,
        user,
        isAuthenticated: Boolean(token),
        isAdmin: user?.role === 'OWNER' || user?.role === 'ADMINISTRATOR',
        login,
        logout,
    }), [token, user, login, logout])

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
    return useContext(AuthContext)
}

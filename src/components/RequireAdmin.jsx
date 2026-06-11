import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/**
 * Gates a route to owners and administrators. Regular users are redirected to the dashboard.
 */
export default function RequireAdmin({ children }) {
    const { isAdmin } = useAuth()

    if (!isAdmin) {
        return <Navigate to="/dashboard" replace />
    }

    return children
}

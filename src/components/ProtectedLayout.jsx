import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Layout from './Layout'

/**
 * Layout route that requires an authenticated user. Unauthenticated visitors are sent to /login;
 * everyone else gets the app shell with the matched child route rendered in the content area.
 */
export default function ProtectedLayout() {
    const { isAuthenticated } = useAuth()

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />
    }

    return (
        <Layout>
            <Outlet />
        </Layout>
    )
}

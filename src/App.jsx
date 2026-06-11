import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedLayout from './components/ProtectedLayout'
import RequireAdmin from './components/RequireAdmin'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import ProductsPage from './pages/ProductsPage'
import ManufacturersPage from './pages/ManufacturersPage'
import CategoriesPage from './pages/CategoriesPage'
import ClientsPage from './pages/ClientsPage'
import SalesOrdersPage from './pages/SalesOrdersPage'
import PurchaseOrdersPage from './pages/PurchaseOrdersPage'
import TendersPage from './pages/TendersPage'
import UsersPage from './pages/UsersPage'

export default function App() {
    return (
        <Routes>
            <Route path="/login" element={<LoginPage />} />

            <Route element={<ProtectedLayout />}>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/products" element={<ProductsPage />} />
                <Route path="/manufacturers" element={<ManufacturersPage />} />
                <Route path="/categories" element={<CategoriesPage />} />
                <Route path="/clients" element={<ClientsPage />} />
                <Route path="/sales-orders" element={<SalesOrdersPage />} />
                <Route path="/purchase-orders" element={<PurchaseOrdersPage />} />
                <Route path="/tenders" element={<TendersPage />} />
                <Route
                    path="/users"
                    element={
                        <RequireAdmin>
                            <UsersPage />
                        </RequireAdmin>
                    }
                />
            </Route>

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
    )
}

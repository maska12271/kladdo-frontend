import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedLayout from './components/ProtectedLayout'
import RequireAdmin from './components/RequireAdmin'
import RequirePermission from './components/RequirePermission'
import LoadingBlock from './components/LoadingBlock'

const LoginPage = lazy(() => import('./pages/LoginPage'))
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const ProductsPage = lazy(() => import('./pages/ProductsPage'))
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage'))
const ManufacturersPage = lazy(() => import('./pages/ManufacturersPage'))
const ManufacturerDetailPage = lazy(() => import('./pages/ManufacturerDetailPage'))
const ClientsPage = lazy(() => import('./pages/ClientsPage'))
const ClientDetailPage = lazy(() => import('./pages/ClientDetailPage'))
const SalesOrdersPage = lazy(() => import('./pages/SalesOrdersPage'))
const PurchaseOrdersPage = lazy(() => import('./pages/PurchaseOrdersPage'))
const OrderDetailPage = lazy(() => import('./pages/OrderDetailPage'))
const TendersPage = lazy(() => import('./pages/TendersPage'))
const UsersPage = lazy(() => import('./pages/UsersPage'))
const UserDetailPage = lazy(() => import('./pages/UserDetailPage'))
const SettingsPage = lazy(() => import('./pages/SettingsPage'))
const WarehousesPage = lazy(() => import('./pages/WarehousesPage'))
const WarehouseDetailPage = lazy(() => import('./pages/WarehouseDetailPage'))

export default function App() {
    return (
        <Routes>
            <Route
                path="/login"
                element={
                    <Suspense fallback={<div className="flex min-h-screen items-center justify-center p-6"><LoadingBlock /></div>}>
                        <LoginPage />
                    </Suspense>
                }
            />

            <Route element={<ProtectedLayout />}>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route
                    path="/products"
                    element={<RequirePermission module="PRODUCTS"><ProductsPage /></RequirePermission>}
                />
                <Route
                    path="/products/:id"
                    element={<RequirePermission module="PRODUCTS"><ProductDetailPage /></RequirePermission>}
                />
                <Route
                    path="/manufacturers"
                    element={<RequirePermission module="MANUFACTURERS"><ManufacturersPage /></RequirePermission>}
                />
                <Route
                    path="/manufacturers/:id"
                    element={<RequirePermission module="MANUFACTURERS"><ManufacturerDetailPage /></RequirePermission>}
                />
                <Route
                    path="/clients"
                    element={<RequirePermission module="CLIENTS"><ClientsPage /></RequirePermission>}
                />
                <Route
                    path="/clients/:id"
                    element={<RequirePermission module="CLIENTS"><ClientDetailPage /></RequirePermission>}
                />
                <Route
                    path="/sales-orders"
                    element={<RequirePermission module="SALES_ORDERS"><SalesOrdersPage /></RequirePermission>}
                />
                <Route
                    path="/sales-orders/:id"
                    element={<RequirePermission module="SALES_ORDERS"><OrderDetailPage type="sales" /></RequirePermission>}
                />
                <Route
                    path="/purchase-orders"
                    element={<RequirePermission module="PURCHASE_ORDERS"><PurchaseOrdersPage /></RequirePermission>}
                />
                <Route
                    path="/purchase-orders/:id"
                    element={<RequirePermission module="PURCHASE_ORDERS"><OrderDetailPage type="purchase" /></RequirePermission>}
                />
                <Route
                    path="/tenders"
                    element={<RequirePermission module="TENDERS"><TendersPage /></RequirePermission>}
                />
                <Route
                    path="/warehouses"
                    element={<RequirePermission module="WAREHOUSES"><WarehousesPage /></RequirePermission>}
                />
                <Route
                    path="/warehouses/:id"
                    element={<RequirePermission module="WAREHOUSES"><WarehouseDetailPage /></RequirePermission>}
                />
                <Route
                    path="/users"
                    element={
                        <RequireAdmin>
                            <UsersPage />
                        </RequireAdmin>
                    }
                />
                <Route
                    path="/users/:id"
                    element={
                        <RequireAdmin>
                            <UserDetailPage />
                        </RequireAdmin>
                    }
                />
                <Route
                    path="/settings"
                    element={
                        <RequireAdmin>
                            <SettingsPage />
                        </RequireAdmin>
                    }
                />
            </Route>

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
    )
}

import { useEffect, useState } from 'react'
import { apiGet } from '../api/client'
import PageHeader from '../components/PageHeader'
import StatCard from '../components/StatCard'
import DataTable from '../components/DataTable'
import LoadingBlock from '../components/LoadingBlock'
import { isActiveStatus, safeArray, formatMoney } from '../utils/format'

export default function DashboardPage() {
    const [data, setData] = useState({
        products: [],
        tenders: [],
        salesOrders: [],
        purchaseOrders: [],
    })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        setLoading(true)
        try {
            const [productsRes, tendersRes, salesRes, purchaseRes] = await Promise.all([
                apiGet('/products?page=0&size=200&sortBy=id&sortDir=desc'),
                apiGet('/tenders?page=0&size=200&sortBy=id&sortDir=desc'),
                apiGet('/sales-orders?page=0&size=200&sortBy=id&sortDir=desc'),
                apiGet('/purchase-orders?page=0&size=200&sortBy=id&sortDir=desc'),
            ])

            setData({
                products: safeArray(productsRes),
                tenders: safeArray(tendersRes),
                salesOrders: safeArray(salesRes),
                purchaseOrders: safeArray(purchaseRes),
            })
        } finally {
            setLoading(false)
        }
    }

    const lowStockItems = data.products.filter(
        (item) => Number(item.stockQuantity || 0) < Number(item.minimumStock || 0),
    )

    const activeTenders = data.tenders.filter((item) => isActiveStatus(item.status))
    const activeSalesOrders = data.salesOrders.filter((item) => isActiveStatus(item.status))
    const activePurchaseOrders = data.purchaseOrders.filter((item) => isActiveStatus(item.status))

    const lowStockColumns = [
        { key: 'name', label: 'Product' },
        { key: 'manufacturer', label: 'Manufacturer', render: (row) => row.manufacturer?.name || '-' },
        { key: 'stockQuantity', label: 'Stock' },
        { key: 'minimumStock', label: 'Min stock' },
    ]

    const latestTenderColumns = [
        { key: 'title', label: 'Title' },
        { key: 'status', label: 'Status' },
        { key: 'customerName', label: 'Customer' },
        { key: 'estimatedValue', label: 'Value', render: (row) => formatMoney(row.estimatedValue) },
    ]

    if (loading) return <LoadingBlock text="Loading dashboard..." />

    return (
        <div className="space-y-6">
            <PageHeader
                title="Dashboard"
                description="Operational overview with live tender, order, and stock data."
            />

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <StatCard title="Products" value={data.products.length} hint="All products in system" color="blue" />
                <StatCard title="Active tenders" value={activeTenders.length} hint="Open or in progress tenders" color="teal" />
                <StatCard title="Active sales orders" value={activeSalesOrders.length} hint="Currently active sales orders" color="amber" />
                <StatCard title="Low stock items" value={lowStockItems.length} hint="Products below minimum stock" color="rose" />
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
                <div>
                    <h3 className="mb-3 text-lg font-semibold">Low stock products</h3>
                    <DataTable columns={lowStockColumns} rows={lowStockItems} />
                </div>

                <div>
                    <h3 className="mb-3 text-lg font-semibold">Latest tenders</h3>
                    <DataTable columns={latestTenderColumns} rows={data.tenders.slice(0, 5)} />
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <StatCard title="Purchase orders" value={data.purchaseOrders.length} hint="All purchase orders" color="blue" />
                <StatCard title="Active purchase orders" value={activePurchaseOrders.length} hint="Purchase orders in work" color="teal" />
                <StatCard title="Sales orders" value={data.salesOrders.length} hint="All sales orders" color="amber" />
                <StatCard title="Tenders total" value={data.tenders.length} hint="All tenders in system" color="rose" />
            </div>
        </div>
    )
}
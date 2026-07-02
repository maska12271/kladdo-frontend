import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import StatCard from './StatCard'
import DataTable from './DataTable'
import StatusBadge from './StatusBadge'
import { formatDate } from '../utils/format'

/**
 * Operational dashboard for warehouse staff: no revenue or money figures, just what needs working —
 * sales orders waiting to be shipped, purchase orders expected in, and low-stock products. Driven by
 * the {@code fulfilment} and {@code products} blocks of the dashboard stats.
 */
export default function WarehouseDashboard({ stats }) {
    const { t } = useTranslation()
    const navigate = useNavigate()

    const fulfilment = stats?.fulfilment || {}
    const salesToShip = fulfilment.salesToShip || []
    const purchasesIncoming = fulfilment.purchasesIncoming || []
    const lowStock = stats?.products?.lowStock || []
    const lowStockCount = stats?.products?.lowStockCount ?? lowStock.length

    const today = new Date().toISOString().slice(0, 10)

    const salesColumns = [
        { key: 'orderNumber', label: t('warehouseDash.cols.order'), render: (r) => r.orderNumber || `#${r.id}` },
        { key: 'counterpartyName', label: t('warehouseDash.cols.client'), render: (r) => r.counterpartyName || '—' },
        { key: 'orderDate', label: t('warehouseDash.cols.ordered'), render: (r) => formatDate(r.orderDate) },
        { key: 'status', label: t('common.status'), render: (r) => <StatusBadge status={r.status} /> },
    ]

    const purchaseColumns = [
        { key: 'orderNumber', label: t('warehouseDash.cols.order'), render: (r) => r.orderNumber || `#${r.id}` },
        { key: 'counterpartyName', label: t('warehouseDash.cols.supplier'), render: (r) => r.counterpartyName || '—' },
        {
            key: 'dueDate',
            label: t('warehouseDash.cols.expected'),
            render: (r) =>
                r.dueDate ? (
                    <span className={r.dueDate < today ? 'font-semibold text-rose-600 dark:text-rose-400' : ''}>
                        {formatDate(r.dueDate)}
                    </span>
                ) : (
                    '—'
                ),
        },
        { key: 'status', label: t('common.status'), render: (r) => <StatusBadge status={r.status} /> },
    ]

    const lowStockColumns = [
        { key: 'name', label: t('dashboard.cols.product') },
        { key: 'stockQuantity', label: t('dashboard.cols.stock'), render: (r) => <span className="font-semibold text-rose-600 dark:text-rose-400">{r.stockQuantity}</span> },
        { key: 'minimumStock', label: t('dashboard.cols.minStock') },
    ]

    return (
        <div className="space-y-6">
            <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
                <StatCard compact title={t('warehouseDash.kpi.toShip')} value={fulfilment.salesToShipCount ?? salesToShip.length} hint={t('warehouseDash.kpi.toShipHint')} color="teal" />
                <StatCard compact title={t('warehouseDash.kpi.incoming')} value={fulfilment.purchasesIncomingCount ?? purchasesIncoming.length} hint={t('warehouseDash.kpi.incomingHint')} color="blue" />
                <StatCard compact title={t('warehouseDash.kpi.lowStock')} value={lowStockCount} hint={t('warehouseDash.kpi.lowStockHint')} color="rose" />
            </div>

            <section className="space-y-3">
                <h2 className="text-lg font-semibold">{t('warehouseDash.salesToShip')}</h2>
                <DataTable
                    tableId="wh-sales-to-ship"
                    columns={salesColumns}
                    rows={salesToShip}
                    getRowId={(r) => r.id}
                    onRowClick={(r) => navigate(`/sales-orders/${r.id}`)}
                    paginate={false}
                />
            </section>

            <section className="space-y-3">
                <h2 className="text-lg font-semibold">{t('warehouseDash.incoming')}</h2>
                <DataTable
                    tableId="wh-incoming"
                    columns={purchaseColumns}
                    rows={purchasesIncoming}
                    getRowId={(r) => r.id}
                    onRowClick={(r) => navigate(`/purchase-orders/${r.id}`)}
                    paginate={false}
                />
            </section>

            {lowStock.length > 0 && (
                <section className="space-y-3">
                    <h2 className="text-lg font-semibold">{t('dashboard.titles.lowStock', { count: lowStockCount })}</h2>
                    <DataTable
                        tableId="wh-low-stock"
                        columns={lowStockColumns}
                        rows={lowStock}
                        getRowId={(r) => r.id}
                        onRowClick={(r) => navigate(`/products/${r.id}`)}
                        paginate={false}
                    />
                </section>
            )}
        </div>
    )
}

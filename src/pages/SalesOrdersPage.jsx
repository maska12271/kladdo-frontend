import { useEffect, useMemo, useState } from 'react'
import { apiDelete, apiGet, apiPost, apiPut } from '../api/client'
import PageHeader from '../components/PageHeader'
import SearchFilters from '../components/SearchFilters'
import DataTable from '../components/DataTable'
import ActionMenu from '../components/ActionMenu'
import Modal from '../components/Modal'
import ConfirmModal from '../components/ConfirmModal'
import { useModal } from '../hooks/useModal'
import { formatDate, formatMoney, safeArray } from '../utils/format'
import {FormField, SelectField, TextareaField} from "../components/FormField.jsx";
import { Pencil, Trash2 } from 'lucide-react'

const emptyForm = {
    clientId: '',
    tenderId: '',
    orderNumber: '',
    status: 'NEW',
    orderDate: '',
    closingDate: '',
    deliveryAddress: '',
    notes: '',
    deliveryPrice: 0,
    items: [
        {
            productId: '',
            quantity: 1,
            unitPrice: 0,
        },
    ],
}

export default function SalesOrdersPage() {
    const formModal = useModal()
    const deleteModal = useModal()
    const bulkDeleteModal = useModal()

    const [rows, setRows] = useState([])
    const [clients, setClients] = useState([])
    const [products, setProducts] = useState([])
    const [tenders, setTenders] = useState([])
    const [form, setForm] = useState(emptyForm)
    const [editingId, setEditingId] = useState(null)
    const [deletingItem, setDeletingItem] = useState(null)
    const [selectedIds, setSelectedIds] = useState([])
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('')
    const [clientFilter, setClientFilter] = useState('')
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        const [ordersRes, clientsRes, productsRes, tendersRes] = await Promise.all([
            apiGet('/sales-orders?page=0&size=500&sortBy=id&sortDir=desc'),
            apiGet('/clients?page=0&size=500&sortBy=id&sortDir=asc'),
            apiGet('/products?page=0&size=500&sortBy=id&sortDir=asc'),
            apiGet('/tenders?page=0&size=500&sortBy=id&sortDir=asc'),
        ])

        setRows(safeArray(ordersRes))
        setClients(safeArray(clientsRes))
        setProducts(safeArray(productsRes))
        setTenders(safeArray(tendersRes))
    }

    const filteredRows = useMemo(() => {
        return rows.filter((row) => {
            const q = search.toLowerCase()
            const matchesSearch =
                !search ||
                row.orderNumber?.toLowerCase().includes(q) ||
                row.client?.name?.toLowerCase().includes(q) ||
                row.status?.toLowerCase().includes(q)

            const matchesStatus = !statusFilter || row.status === statusFilter
            const matchesClient = !clientFilter || String(row.client?.id) === clientFilter

            return matchesSearch && matchesStatus && matchesClient
        })
    }, [rows, search, statusFilter, clientFilter])

    const openCreate = () => {
        setEditingId(null)
        setForm(emptyForm)
        formModal.open()
    }

    const openEdit = (item) => {
        setEditingId(item.id)
        setForm({
            clientId: item.client?.id || '',
            tenderId: item.tender?.id || '',
            orderNumber: item.orderNumber || '',
            status: item.status || 'NEW',
            orderDate: item.orderDate || '',
            closingDate: item.closingDate || '',
            deliveryAddress: item.deliveryAddress || '',
            notes: item.notes || '',
            deliveryPrice: item.deliveryPrice ?? 0,
            items: item.items?.length
                ? item.items.map((it) => ({
                    productId: it.product?.id || '',
                    quantity: it.quantity ?? 1,
                    unitPrice: it.unitPrice ?? 0,
                }))
                : [{ productId: '', quantity: 1, unitPrice: 0 }],
        })
        formModal.open()
    }

    const openDelete = (item) => {
        setDeletingItem(item)
        deleteModal.open()
    }

    const handleChange = (e) => {
        const { name, value } = e.target
        setForm((prev) => ({ ...prev, [name]: value }))
    }

    const handleItemChange = (index, field, value) => {
        setForm((prev) => ({
            ...prev,
            items: prev.items.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
        }))
    }

    const addItem = () => {
        setForm((prev) => ({
            ...prev,
            items: [...prev.items, { productId: '', quantity: 1, unitPrice: 0 }],
        }))
    }

    const removeItem = (index) => {
        setForm((prev) => ({
            ...prev,
            items: prev.items.filter((_, i) => i !== index),
        }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)

        const payload = {
            clientId: Number(form.clientId),
            tenderId: form.tenderId ? Number(form.tenderId) : null,
            orderNumber: form.orderNumber || null,
            status: form.status,
            orderDate: form.orderDate || null,
            closingDate: form.closingDate || null,
            deliveryAddress: form.deliveryAddress,
            notes: form.notes,
            deliveryPrice: Number(form.deliveryPrice || 0),
            items: form.items.map((item) => ({
                productId: Number(item.productId),
                quantity: Number(item.quantity),
                unitPrice: Number(item.unitPrice),
            })),
        }

        try {
            if (editingId) {
                await apiPut(`/sales-orders/${editingId}`, payload)
            } else {
                await apiPost('/sales-orders', payload)
            }
            formModal.close()
            setEditingId(null)
            setForm(emptyForm)
            await loadData()
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async () => {
        if (!deletingItem) return
        setLoading(true)
        try {
            await apiDelete(`/sales-orders/${deletingItem.id}`)
            deleteModal.close()
            setDeletingItem(null)
            setSelectedIds((prev) => prev.filter((id) => id !== deletingItem.id))
            await loadData()
        } finally {
            setLoading(false)
        }
    }

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return
        setLoading(true)
        try {
            await Promise.all(selectedIds.map((id) => apiDelete(`/sales-orders/${id}`)))
            bulkDeleteModal.close()
            setSelectedIds([])
            await loadData()
        } finally {
            setLoading(false)
        }
    }

    const columns = [
        { key: 'orderNumber', label: 'Order no.' },
        { key: 'client', label: 'Client', render: (row) => row.client?.name || '-' },
        { key: 'status', label: 'Status' },
        { key: 'orderDate', label: 'Order date', render: (row) => formatDate(row.orderDate) },
        { key: 'totalAmount', label: 'Total', render: (row) => formatMoney(row.totalAmount) },
        {
            key: 'actions',
            label: '',
            render: (row) => (
                <div className="flex justify-end">
                    <ActionMenu
                        actions={[
                            { key: 'edit', label: 'Edit', icon: Pencil, onClick: () => openEdit(row) },
                            { key: 'delete', label: 'Delete', icon: Trash2, danger: true, onClick: () => openDelete(row) },
                        ]}
                    />
                </div>
            ),
        },
    ]

    return (
        <div className="space-y-6">
            <PageHeader
                title="Sales Orders"
                description="Create and manage sales orders."
                action={
                    <button onClick={openCreate} className="rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-teal-700">
                        Add sales order
                    </button>
                }
            />

            <SearchFilters
                search={search}
                onSearchChange={setSearch}
                filters={[
                    {
                        key: 'client',
                        value: clientFilter,
                        onChange: setClientFilter,
                        options: [{ value: '', label: 'All clients' }, ...clients.map((c) => ({ value: String(c.id), label: c.name }))],
                    },
                    {
                        key: 'status',
                        value: statusFilter,
                        onChange: setStatusFilter,
                        options: [
                            { value: '', label: 'All statuses' },
                            { value: 'NEW', label: 'New' },
                            { value: 'IN_PROGRESS', label: 'In progress' },
                            { value: 'CONFIRMED', label: 'Confirmed' },
                            { value: 'SHIPPED', label: 'Shipped' },
                            { value: 'CLOSED', label: 'Closed' },
                            { value: 'CANCELLED', label: 'Cancelled' },
                        ],
                    },
                ]}
            />

            <DataTable
                columns={columns}
                rows={filteredRows}
                selectable
                selectedIds={selectedIds}
                onSelectionChange={setSelectedIds}
                bulkActions={
                    <button
                        onClick={bulkDeleteModal.open}
                        className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-rose-700"
                    >
                        <Trash2 className="h-4 w-4" /> Delete selected
                    </button>
                }
            />

            <Modal
                isOpen={formModal.isOpen}
                title={editingId ? "Edit sales order" : "Add sales order"}
                onClose={formModal.close}
            >
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid gap-4 md:grid-cols-2">
                        <SelectField
                            id="sales-order-client"
                            label="Client"
                            name="clientId"
                            value={form.clientId}
                            onChange={handleChange}
                            required
                        >
                            <option value="">Select client</option>
                            {clients.map((item) => (
                                <option key={item.id} value={item.id}>
                                    {item.name}
                                </option>
                            ))}
                        </SelectField>

                        <SelectField
                            id="sales-order-tender"
                            label="Tender"
                            name="tenderId"
                            value={form.tenderId}
                            onChange={handleChange}
                        >
                            <option value="">No tender</option>
                            {tenders.map((item) => (
                                <option key={item.id} value={item.id}>
                                    {item.title}
                                </option>
                            ))}
                        </SelectField>

                        <FormField
                            id="sales-order-number"
                            label="Order number"
                            name="orderNumber"
                            value={form.orderNumber}
                            onChange={handleChange}
                            placeholder="Order number"
                        />

                        <SelectField
                            id="sales-order-status"
                            label="Status"
                            name="status"
                            value={form.status}
                            onChange={handleChange}
                        >
                            <option value="NEW">New</option>
                            <option value="IN_PROGRESS">In progress</option>
                            <option value="CONFIRMED">Confirmed</option>
                            <option value="SHIPPED">Shipped</option>
                            <option value="CLOSED">Closed</option>
                            <option value="CANCELLED">Canceled</option>
                        </SelectField>

                        <FormField
                            id="sales-order-date"
                            label="Order date"
                            type="date"
                            name="orderDate"
                            value={form.orderDate}
                            onChange={handleChange}
                        />

                        <FormField
                            id="sales-order-closing-date"
                            label="Closing date"
                            type="date"
                            name="closingDate"
                            value={form.closingDate}
                            onChange={handleChange}
                        />

                        <FormField
                            id="sales-order-delivery-price"
                            label="Delivery price"
                            type="number"
                            step="0.01"
                            name="deliveryPrice"
                            value={form.deliveryPrice}
                            onChange={handleChange}
                            placeholder="Delivery price"
                        />

                        <FormField
                            id="sales-order-delivery-address"
                            label="Delivery address"
                            name="deliveryAddress"
                            value={form.deliveryAddress}
                            onChange={handleChange}
                            placeholder="Delivery address"
                        />
                    </div>

                    <TextareaField
                        id="sales-order-notes"
                        label="Notes"
                        name="notes"
                        value={form.notes}
                        onChange={handleChange}
                        placeholder="Notes"
                        rows={3}
                    />

                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold">Order items</h3>
                            <button
                                type="button"
                                onClick={addItem}
                                className="rounded-lg bg-slate-800 px-3 py-2 text-sm font-medium text-white dark:bg-slate-700"
                            >
                                Add item
                            </button>
                        </div>

                        {form.items.map((item, index) => (
                            <div
                                key={index}
                                className="grid gap-3 rounded-2xl border border-slate-200 p-4 md:grid-cols-[2fr_1fr_1fr_auto] dark:border-slate-800"
                            >
                                <SelectField
                                    id={`sales-order-item-product-${index}`}
                                    label="Product"
                                    name={`productId-${index}`}
                                    value={item.productId}
                                    onChange={(e) => handleItemChange(index, "productId", e.target.value)}
                                    required
                                >
                                    <option value="">Select product</option>
                                    {products.map((product) => (
                                        <option key={product.id} value={product.id}>
                                            {product.name}
                                        </option>
                                    ))}
                                </SelectField>

                                <FormField
                                    id={`sales-order-item-quantity-${index}`}
                                    label="Quantity"
                                    type="number"
                                    name={`quantity-${index}`}
                                    value={item.quantity}
                                    onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                                    placeholder="Qty"
                                />

                                <FormField
                                    id={`sales-order-item-unit-price-${index}`}
                                    label="Unit price"
                                    type="number"
                                    step="0.01"
                                    name={`unitPrice-${index}`}
                                    value={item.unitPrice}
                                    onChange={(e) => handleItemChange(index, "unitPrice", e.target.value)}
                                    placeholder="Unit price"
                                />

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700 opacity-0 dark:text-slate-200">
                                        Remove
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => removeItem(index)}
                                        disabled={form.items.length === 1}
                                        className="w-full rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
                                    >
                                        Remove
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={formModal.close}
                            className="rounded-xl border border-slate-300 px-4 py-2.5 dark:border-slate-700"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="rounded-xl bg-teal-600 px-4 py-2.5 font-medium text-white hover:bg-teal-700 disabled:opacity-60"
                        >
                            {loading ? "Saving..." : editingId ? "Save changes" : "Create sales order"}
                        </button>
                    </div>
                </form>
            </Modal>

            <ConfirmModal
                isOpen={deleteModal.isOpen}
                title="Delete sales order"
                message={`Delete "${deletingItem?.orderNumber || ''}"?`}
                onClose={deleteModal.close}
                onConfirm={handleDelete}
                loading={loading}
            />

            <ConfirmModal
                isOpen={bulkDeleteModal.isOpen}
                title="Delete sales orders"
                message={`Delete ${selectedIds.length} selected sales order${selectedIds.length === 1 ? '' : 's'}?`}
                onClose={bulkDeleteModal.close}
                onConfirm={handleBulkDelete}
                loading={loading}
            />
        </div>
    )
}
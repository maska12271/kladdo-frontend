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
    manufacturerId: '',
    orderNumber: '',
    status: 'NEW',
    orderDate: '',
    closingDate: '',
    expectedDeliveryDate: '',
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

export default function PurchaseOrdersPage() {
    const formModal = useModal()
    const deleteModal = useModal()
    const bulkDeleteModal = useModal()

    const [rows, setRows] = useState([])
    const [manufacturers, setManufacturers] = useState([])
    const [products, setProducts] = useState([])
    const [form, setForm] = useState(emptyForm)
    const [editingId, setEditingId] = useState(null)
    const [deletingItem, setDeletingItem] = useState(null)
    const [selectedIds, setSelectedIds] = useState([])
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('')
    const [manufacturerFilter, setManufacturerFilter] = useState('')
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        const [ordersRes, manufacturersRes, productsRes] = await Promise.all([
            apiGet('/purchase-orders?page=0&size=500&sortBy=id&sortDir=desc'),
            apiGet('/manufacturers?page=0&size=500&sortBy=id&sortDir=asc'),
            apiGet('/products?page=0&size=500&sortBy=id&sortDir=asc'),
        ])

        setRows(safeArray(ordersRes))
        setManufacturers(safeArray(manufacturersRes))
        setProducts(safeArray(productsRes))
    }

    const filteredRows = useMemo(() => {
        return rows.filter((row) => {
            const q = search.toLowerCase()
            const matchesSearch =
                !search ||
                row.orderNumber?.toLowerCase().includes(q) ||
                row.manufacturer?.name?.toLowerCase().includes(q) ||
                row.status?.toLowerCase().includes(q)

            const matchesStatus = !statusFilter || row.status === statusFilter
            const matchesManufacturer = !manufacturerFilter || String(row.manufacturer?.id) === manufacturerFilter

            return matchesSearch && matchesStatus && matchesManufacturer
        })
    }, [rows, search, statusFilter, manufacturerFilter])

    const openCreate = () => {
        setEditingId(null)
        setForm(emptyForm)
        formModal.open()
    }

    const openEdit = (item) => {
        setEditingId(item.id)
        setForm({
            manufacturerId: item.manufacturer?.id || '',
            orderNumber: item.orderNumber || '',
            status: item.status || 'NEW',
            orderDate: item.orderDate || '',
            closingDate: item.closingDate || '',
            expectedDeliveryDate: item.expectedDeliveryDate || '',
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
            manufacturerId: Number(form.manufacturerId),
            orderNumber: form.orderNumber || null,
            status: form.status,
            orderDate: form.orderDate || null,
            closingDate: form.closingDate || null,
            expectedDeliveryDate: form.expectedDeliveryDate || null,
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
                await apiPut(`/purchase-orders/${editingId}`, payload)
            } else {
                await apiPost('/purchase-orders', payload)
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
            await apiDelete(`/purchase-orders/${deletingItem.id}`)
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
            await Promise.all(selectedIds.map((id) => apiDelete(`/purchase-orders/${id}`)))
            bulkDeleteModal.close()
            setSelectedIds([])
            await loadData()
        } finally {
            setLoading(false)
        }
    }

    const columns = [
        { key: 'orderNumber', label: 'Order no.' },
        { key: 'manufacturer', label: 'Manufacturer', render: (row) => row.manufacturer?.name || '-' },
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
                title="Purchase Orders"
                description="Create and manage purchase orders."
                action={
                    <button onClick={openCreate} className="rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-teal-700">
                        Add purchase order
                    </button>
                }
            />

            <SearchFilters
                search={search}
                onSearchChange={setSearch}
                filters={[
                    {
                        key: 'manufacturer',
                        value: manufacturerFilter,
                        onChange: setManufacturerFilter,
                        options: [{ value: '', label: 'All manufacturers' }, ...manufacturers.map((m) => ({ value: String(m.id), label: m.name }))],
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
                title={editingId ? "Edit purchase order" : "Add purchase order"}
                onClose={formModal.close}
            >
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid gap-4 md:grid-cols-2">
                        <SelectField
                            id="purchase-order-manufacturer"
                            label="Manufacturer"
                            name="manufacturerId"
                            value={form.manufacturerId}
                            onChange={handleChange}
                            required
                        >
                            <option value="">Select manufacturer</option>
                            {manufacturers.map((item) => (
                                <option key={item.id} value={item.id}>
                                    {item.name}
                                </option>
                            ))}
                        </SelectField>

                        <FormField
                            id="purchase-order-number"
                            label="Order number"
                            name="orderNumber"
                            value={form.orderNumber}
                            onChange={handleChange}
                            placeholder="Order number"
                        />

                        <SelectField
                            id="purchase-order-status"
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
                            <option value="CANCELLED">Cancelled</option>
                        </SelectField>

                        <FormField
                            id="purchase-order-date"
                            label="Order date"
                            type="date"
                            name="orderDate"
                            value={form.orderDate}
                            onChange={handleChange}
                        />

                        <FormField
                            id="purchase-order-closing-date"
                            label="Closing date"
                            type="date"
                            name="closingDate"
                            value={form.closingDate}
                            onChange={handleChange}
                        />

                        <FormField
                            id="purchase-order-expected-delivery"
                            label="Expected delivery date"
                            type="date"
                            name="expectedDeliveryDate"
                            value={form.expectedDeliveryDate}
                            onChange={handleChange}
                        />

                        <FormField
                            id="purchase-order-delivery-price"
                            label="Delivery price"
                            type="number"
                            step="0.01"
                            name="deliveryPrice"
                            value={form.deliveryPrice}
                            onChange={handleChange}
                            placeholder="Delivery price"
                        />

                        <FormField
                            id="purchase-order-delivery-address"
                            label="Delivery address"
                            name="deliveryAddress"
                            value={form.deliveryAddress}
                            onChange={handleChange}
                            placeholder="Delivery address"
                        />
                    </div>

                    <TextareaField
                        id="purchase-order-notes"
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
                                    id={`purchase-order-item-product-${index}`}
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
                                    id={`purchase-order-item-quantity-${index}`}
                                    label="Quantity"
                                    type="number"
                                    name={`quantity-${index}`}
                                    value={item.quantity}
                                    onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                                    placeholder="Qty"
                                />

                                <FormField
                                    id={`purchase-order-item-unit-price-${index}`}
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
                            {loading ? "Saving..." : editingId ? "Save changes" : "Create purchase order"}
                        </button>
                    </div>
                </form>
            </Modal>

            <ConfirmModal
                isOpen={deleteModal.isOpen}
                title="Delete purchase order"
                message={`Delete "${deletingItem?.orderNumber || ''}"?`}
                onClose={deleteModal.close}
                onConfirm={handleDelete}
                loading={loading}
            />

            <ConfirmModal
                isOpen={bulkDeleteModal.isOpen}
                title="Delete purchase orders"
                message={`Delete ${selectedIds.length} selected purchase order${selectedIds.length === 1 ? '' : 's'}?`}
                onClose={bulkDeleteModal.close}
                onConfirm={handleBulkDelete}
                loading={loading}
            />
        </div>
    )
}
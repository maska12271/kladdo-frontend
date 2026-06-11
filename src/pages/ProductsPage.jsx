import { useEffect, useMemo, useState } from 'react'
import { apiDelete, apiGet, apiPost, apiPut } from '../api/client'
import PageHeader from '../components/PageHeader'
import SearchFilters from '../components/SearchFilters'
import DataTable from '../components/DataTable'
import ActionMenu from '../components/ActionMenu'
import Modal from '../components/Modal'
import ConfirmModal from '../components/ConfirmModal'
import { useModal } from '../hooks/useModal'
import { formatMoney, safeArray } from '../utils/format'
import {FormField, SelectField, TextareaField} from "../components/FormField.jsx";
import { Pencil, Trash2 } from 'lucide-react'

const emptyForm = {
    name: '',
    sku: '',
    manufacturerId: '',
    categoryId: '',
    size: '',
    unit: '',
    description: '',
    imageUrl: '',
    price: '',
    stockQuantity: 0,
    minimumStock: 0,
    active: true,
}

export default function ProductsPage() {
    const formModal = useModal()
    const deleteModal = useModal()
    const bulkDeleteModal = useModal()

    const [rows, setRows] = useState([])
    const [manufacturers, setManufacturers] = useState([])
    const [categories, setCategories] = useState([])
    const [form, setForm] = useState(emptyForm)
    const [editingId, setEditingId] = useState(null)
    const [deletingItem, setDeletingItem] = useState(null)
    const [selectedIds, setSelectedIds] = useState([])
    const [search, setSearch] = useState('')
    const [manufacturerFilter, setManufacturerFilter] = useState('')
    const [categoryFilter, setCategoryFilter] = useState('')
    const [statusFilter, setStatusFilter] = useState('')
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        const [productsRes, manufacturersRes, categoriesRes] = await Promise.all([
            apiGet('/products?page=0&size=500&sortBy=id&sortDir=desc'),
            apiGet('/manufacturers?page=0&size=500&sortBy=id&sortDir=asc'),
            apiGet('/categories?page=0&size=500&sortBy=id&sortDir=asc'),
        ])
        setRows(safeArray(productsRes))
        setManufacturers(safeArray(manufacturersRes))
        setCategories(safeArray(categoriesRes))
    }

    const filteredRows = useMemo(() => {
        return rows.filter((row) => {
            const matchesSearch =
                !search ||
                row.name?.toLowerCase().includes(search.toLowerCase()) ||
                row.sku?.toLowerCase().includes(search.toLowerCase()) ||
                row.manufacturer?.name?.toLowerCase().includes(search.toLowerCase())

            const matchesManufacturer = !manufacturerFilter || String(row.manufacturer?.id) === manufacturerFilter
            const matchesCategory = !categoryFilter || String(row.category?.id) === categoryFilter
            const matchesStatus =
                !statusFilter ||
                (statusFilter === 'active' && row.active) ||
                (statusFilter === 'inactive' && !row.active)

            return matchesSearch && matchesManufacturer && matchesCategory && matchesStatus
        })
    }, [rows, search, manufacturerFilter, categoryFilter, statusFilter])

    const openCreate = () => {
        setEditingId(null)
        setForm(emptyForm)
        formModal.open()
    }

    const openEdit = (item) => {
        setEditingId(item.id)
        setForm({
            name: item.name || '',
            sku: item.sku || '',
            manufacturerId: item.manufacturer?.id || '',
            categoryId: item.category?.id || '',
            size: item.size || '',
            unit: item.unit || '',
            description: item.description || '',
            imageUrl: item.imageUrl || '',
            price: item.price || '',
            stockQuantity: item.stockQuantity ?? 0,
            minimumStock: item.minimumStock ?? 0,
            active: !!item.active,
        })
        formModal.open()
    }

    const openDelete = (item) => {
        setDeletingItem(item)
        deleteModal.open()
    }

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target
        setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)

        const payload = {
            name: form.name,
            sku: form.sku,
            manufacturer: { id: Number(form.manufacturerId) },
            category: { id: Number(form.categoryId) },
            size: form.size,
            unit: form.unit,
            description: form.description,
            imageUrl: form.imageUrl,
            price: Number(form.price),
            stockQuantity: Number(form.stockQuantity),
            minimumStock: Number(form.minimumStock),
            active: form.active,
        }

        try {
            if (editingId) {
                await apiPut(`/products/${editingId}`, payload)
            } else {
                await apiPost('/products', payload)
            }
            formModal.close()
            setForm(emptyForm)
            setEditingId(null)
            await loadData()
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async () => {
        if (!deletingItem) return
        setLoading(true)
        try {
            await apiDelete(`/products/${deletingItem.id}`)
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
            await Promise.all(selectedIds.map((id) => apiDelete(`/products/${id}`)))
            bulkDeleteModal.close()
            setSelectedIds([])
            await loadData()
        } finally {
            setLoading(false)
        }
    }

    const columns = [
        { key: 'name', label: 'Name' },
        { key: 'sku', label: 'SKU' },
        { key: 'manufacturer', label: 'Manufacturer', render: (row) => row.manufacturer?.name || '-' },
        { key: 'category', label: 'Category', render: (row) => row.category?.name || '-' },
        { key: 'price', label: 'Price', render: (row) => formatMoney(row.price) },
        { key: 'stockQuantity', label: 'Stock' },
        { key: 'minimumStock', label: 'Min stock' },
        {
            key: 'active',
            label: 'Status',
            render: (row) => (
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${row.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'}`}>
          {row.active ? 'Active' : 'Inactive'}
        </span>
            ),
        },
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
                title="Products"
                description="Manage products with manufacturer and category relations."
                action={
                    <button onClick={openCreate} className="rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-teal-700">
                        Add product
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
                        key: 'category',
                        value: categoryFilter,
                        onChange: setCategoryFilter,
                        options: [{ value: '', label: 'All categories' }, ...categories.map((c) => ({ value: String(c.id), label: c.name }))],
                    },
                    {
                        key: 'status',
                        value: statusFilter,
                        onChange: setStatusFilter,
                        options: [
                            { value: '', label: 'All statuses' },
                            { value: 'active', label: 'Active' },
                            { value: 'inactive', label: 'Inactive' },
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

            <Modal isOpen={formModal.isOpen} title={editingId ? "Edit product" : "Add product"} onClose={formModal.close}>
                <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-4">
                    <FormField
                        id="product-name"
                        label="Name"
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        required
                        placeholder="Name"
                        className="md:col-span-2"
                    />

                    <div className="md:col-span-2 grid gap-4 md:grid-cols-2">
                        <FormField
                            id="product-sku"
                            label={
                                <span className="inline-flex items-center gap-2">
                        SKU
                        <span className="group relative inline-flex">
                            <button
                                type="button"
                                tabIndex={0}
                                aria-label="What does SKU mean?"
                                className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-slate-300 text-xs font-bold text-slate-500 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
                            >
                                ?
                            </button>
                            <span
                                role="tooltip"
                                className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 hidden w-56 -translate-x-1/2 rounded-xl bg-slate-900 px-3 py-2 text-xs font-normal text-white shadow-lg group-hover:block group-focus-within:block dark:bg-slate-700"
                            >
                                SKU is the internal product code used to identify the item in stock and orders.
                            </span>
                        </span>
                    </span>
                            }
                            name="sku"
                            value={form.sku}
                            onChange={handleChange}
                            placeholder="SKU"
                        />

                        <FormField
                            id="product-unit"
                            label="Unit"
                            name="unit"
                            value={form.unit}
                            onChange={handleChange}
                            placeholder="pcs, kg, box..."
                        />
                    </div>

                    <SelectField
                        id="product-manufacturer-id"
                        label="Manufacturer"
                        name="manufacturerId"
                        value={form.manufacturerId}
                        onChange={handleChange}
                        required
                        className="md:col-span-2"
                    >
                        <option value="">Select manufacturer</option>
                        {manufacturers.map((item) => (
                            <option key={item.id} value={item.id}>
                                {item.name}
                            </option>
                        ))}
                    </SelectField>

                    <SelectField
                        id="product-category-id"
                        label="Category"
                        name="categoryId"
                        value={form.categoryId}
                        onChange={handleChange}
                        required
                        className="md:col-span-2"
                    >
                        <option value="">Select category</option>
                        {categories.map((item) => (
                            <option key={item.id} value={item.id}>
                                {item.name}
                            </option>
                        ))}
                    </SelectField>

                    <FormField
                        id="product-size"
                        label="Size"
                        name="size"
                        value={form.size}
                        onChange={handleChange}
                        placeholder="Size"
                        className="md:col-span-2"
                    />

                    <FormField
                        id="product-price"
                        label="Price"
                        type="number"
                        step="0.01"
                        name="price"
                        value={form.price}
                        onChange={handleChange}
                        placeholder="Price"
                        className="md:col-span-2"
                    />

                    <FormField
                        id="product-image-url"
                        label="Image URL"
                        name="imageUrl"
                        value={form.imageUrl}
                        onChange={handleChange}
                        placeholder="https://..."
                        className="md:col-span-4"
                    />

                    <FormField
                        id="product-stock-quantity"
                        label="Stock"
                        type="number"
                        name="stockQuantity"
                        value={form.stockQuantity}
                        onChange={handleChange}
                        placeholder="0"
                        className="md:col-span-2"
                    />

                    <FormField
                        id="product-minimum-stock"
                        label={
                            <span className="inline-flex items-center gap-2">
                                Min stock
                            <span className="group relative inline-flex">
                        <button
                            type="button"
                            tabIndex={0}
                            aria-label="What does minimum stock mean?"
                            className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-slate-300 text-xs font-bold text-slate-500 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
                        >
                            ?
                        </button>
                        <span
                            role="tooltip"
                            className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 hidden w-56 -translate-x-1/2 rounded-xl bg-slate-900 px-3 py-2 text-xs font-normal text-white shadow-lg group-hover:block group-focus-within:block dark:bg-slate-700"
                        >
                            Minimum stock is the lowest safe amount you want to keep before restocking.
                        </span>
                    </span>
                </span>
                        }
                        type="number"
                        name="minimumStock"
                        value={form.minimumStock}
                        onChange={handleChange}
                        placeholder="0"
                        className="md:col-span-2"
                    />

                    <TextareaField
                        id="product-description"
                        label="Description"
                        name="description"
                        value={form.description}
                        onChange={handleChange}
                        placeholder="Description"
                        className="md:col-span-4"
                    />

                    <label className="md:col-span-4 inline-flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-sm dark:border-slate-800">
                        <input
                            type="checkbox"
                            name="active"
                            checked={form.active}
                            onChange={handleChange}
                            className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500 dark:border-slate-700"
                        />
                        <span className="font-medium text-slate-700 dark:text-slate-200">Active</span>
                    </label>

                    <div className="md:col-span-4 flex justify-end gap-3">
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
                            {loading ? "Saving..." : editingId ? "Save changes" : "Create product"}
                        </button>
                    </div>
                </form>
            </Modal>

            <ConfirmModal
                isOpen={deleteModal.isOpen}
                title="Delete product"
                message={`Delete "${deletingItem?.name || ''}"?`}
                onClose={deleteModal.close}
                onConfirm={handleDelete}
                loading={loading}
            />

            <ConfirmModal
                isOpen={bulkDeleteModal.isOpen}
                title="Delete products"
                message={`Delete ${selectedIds.length} selected product${selectedIds.length === 1 ? '' : 's'}?`}
                onClose={bulkDeleteModal.close}
                onConfirm={handleBulkDelete}
                loading={loading}
            />
        </div>
    )
}
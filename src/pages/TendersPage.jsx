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
import { Pencil, Trash2, Users } from 'lucide-react'

const emptyTenderForm = {
    title: '',
    tenderNumber: '',
    customerName: '',
    clientId: '',
    status: 'OPEN',
    publishedAt: '',
    deadline: '',
    description: '',
    estimatedValue: '',
}

const emptyParticipantForm = {
    manufacturerName: '',
    offeredPrice: '',
    notes: '',
    winner: false,
}

export default function TendersPage() {
    const formModal = useModal()
    const deleteModal = useModal()
    const bulkDeleteModal = useModal()
    const participantsModal = useModal()
    const participantFormModal = useModal()
    const participantDeleteModal = useModal()
    const participantBulkDeleteModal = useModal()

    const [rows, setRows] = useState([])
    const [clients, setClients] = useState([])
    const [participants, setParticipants] = useState([])
    const [form, setForm] = useState(emptyTenderForm)
    const [participantForm, setParticipantForm] = useState(emptyParticipantForm)
    const [editingId, setEditingId] = useState(null)
    const [selectedTender, setSelectedTender] = useState(null)
    const [editingParticipantId, setEditingParticipantId] = useState(null)
    const [deletingItem, setDeletingItem] = useState(null)
    const [deletingParticipant, setDeletingParticipant] = useState(null)
    const [selectedIds, setSelectedIds] = useState([])
    const [selectedParticipantIds, setSelectedParticipantIds] = useState([])
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('')
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        const [tendersRes, clientsRes] = await Promise.all([
            apiGet('/tenders?page=0&size=500&sortBy=id&sortDir=desc'),
            apiGet('/clients?page=0&size=500&sortBy=id&sortDir=asc'),
        ])
        setRows(safeArray(tendersRes))
        setClients(safeArray(clientsRes))
    }

    const loadParticipants = async (tenderId) => {
        const response = await apiGet(`/tenders/${tenderId}/participants`)
        setParticipants(safeArray(response))
    }

    const filteredRows = useMemo(() => {
        return rows.filter((row) => {
            const q = search.toLowerCase()
            const matchesSearch =
                !search ||
                row.title?.toLowerCase().includes(q) ||
                row.tenderNumber?.toLowerCase().includes(q) ||
                row.customerName?.toLowerCase().includes(q) ||
                row.clientName?.toLowerCase().includes(q)

            const matchesStatus = !statusFilter || row.status === statusFilter

            return matchesSearch && matchesStatus
        })
    }, [rows, search, statusFilter])

    const openCreate = () => {
        setEditingId(null)
        setForm(emptyTenderForm)
        formModal.open()
    }

    const openEdit = (item) => {
        setEditingId(item.id)
        setForm({
            title: item.title || '',
            tenderNumber: item.tenderNumber || '',
            customerName: item.customerName || '',
            clientId: item.clientId || '',
            status: item.status || 'OPEN',
            publishedAt: item.publishedAt || '',
            deadline: item.deadline || '',
            description: item.description || '',
            estimatedValue: item.estimatedValue ?? '',
        })
        formModal.open()
    }

    const openDelete = (item) => {
        setDeletingItem(item)
        deleteModal.open()
    }

    const openParticipants = async (item) => {
        setSelectedTender(item)
        setSelectedParticipantIds([])
        await loadParticipants(item.id)
        participantsModal.open()
    }

    const openParticipantCreate = () => {
        setEditingParticipantId(null)
        setParticipantForm(emptyParticipantForm)
        participantFormModal.open()
    }

    const openParticipantEdit = (item) => {
        setEditingParticipantId(item.id)
        setParticipantForm({
            manufacturerName: item.manufacturerName || '',
            offeredPrice: item.offeredPrice ?? '',
            notes: item.notes || '',
            winner: !!item.winner,
        })
        participantFormModal.open()
    }

    const openParticipantDelete = (item) => {
        setDeletingParticipant(item)
        participantDeleteModal.open()
    }

    const handleChange = (e) => {
        const { name, value } = e.target
        setForm((prev) => ({ ...prev, [name]: value }))
    }

    const handleParticipantChange = (e) => {
        const { name, value, type, checked } = e.target
        setParticipantForm((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)

        const payload = {
            title: form.title,
            tenderNumber: form.tenderNumber,
            customerName: form.customerName,
            clientId: Number(form.clientId),
            status: form.status,
            publishedAt: form.publishedAt || null,
            deadline: form.deadline || null,
            description: form.description,
            estimatedValue: Number(form.estimatedValue || 0),
        }

        try {
            if (editingId) {
                await apiPut(`/tenders/${editingId}`, payload)
            } else {
                await apiPost('/tenders', payload)
            }
            formModal.close()
            setEditingId(null)
            setForm(emptyTenderForm)
            await loadData()
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async () => {
        if (!deletingItem) return
        setLoading(true)
        try {
            await apiDelete(`/tenders/${deletingItem.id}`)
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
            await Promise.all(selectedIds.map((id) => apiDelete(`/tenders/${id}`)))
            bulkDeleteModal.close()
            setSelectedIds([])
            await loadData()
        } finally {
            setLoading(false)
        }
    }

    const handleParticipantSubmit = async (e) => {
        e.preventDefault()
        if (!selectedTender) return
        setLoading(true)

        const payload = {
            manufacturerName: participantForm.manufacturerName,
            offeredPrice: Number(participantForm.offeredPrice || 0),
            notes: participantForm.notes,
            winner: participantForm.winner,
        }

        try {
            if (editingParticipantId) {
                await apiPut(`/tenders/${selectedTender.id}/participants/${editingParticipantId}`, payload)
            } else {
                await apiPost(`/tenders/${selectedTender.id}/participants`, payload)
            }

            participantFormModal.close()
            setEditingParticipantId(null)
            setParticipantForm(emptyParticipantForm)
            await loadParticipants(selectedTender.id)
        } finally {
            setLoading(false)
        }
    }

    const handleParticipantDelete = async () => {
        if (!selectedTender || !deletingParticipant) return
        setLoading(true)
        try {
            await apiDelete(`/tenders/${selectedTender.id}/participants/${deletingParticipant.id}`)
            participantDeleteModal.close()
            setDeletingParticipant(null)
            setSelectedParticipantIds((prev) => prev.filter((id) => id !== deletingParticipant.id))
            await loadParticipants(selectedTender.id)
        } finally {
            setLoading(false)
        }
    }

    const handleParticipantBulkDelete = async () => {
        if (!selectedTender || selectedParticipantIds.length === 0) return
        setLoading(true)
        try {
            await Promise.all(
                selectedParticipantIds.map((id) =>
                    apiDelete(`/tenders/${selectedTender.id}/participants/${id}`)
                )
            )
            participantBulkDeleteModal.close()
            setSelectedParticipantIds([])
            await loadParticipants(selectedTender.id)
        } finally {
            setLoading(false)
        }
    }

    const columns = [
        { key: 'title', label: 'Title' },
        { key: 'tenderNumber', label: 'Tender no.' },
        { key: 'customerName', label: 'Customer' },
        { key: 'clientName', label: 'Client' },
        { key: 'status', label: 'Status' },
        { key: 'deadline', label: 'Deadline', render: (row) => formatDate(row.deadline) },
        { key: 'estimatedValue', label: 'Estimated value', render: (row) => formatMoney(row.estimatedValue) },
        {
            key: 'actions',
            label: '',
            render: (row) => (
                <div className="flex justify-end">
                    <ActionMenu
                        actions={[
                            { key: 'edit', label: 'Edit', icon: Pencil, onClick: () => openEdit(row) },
                            { key: 'participants', label: 'Participants', icon: Users, onClick: () => openParticipants(row) },
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
                title="Tenders"
                description="Manage tenders and final participant offers."
                action={
                    <button onClick={openCreate} className="rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-teal-700">
                        Add tender
                    </button>
                }
            />

            <SearchFilters
                search={search}
                onSearchChange={setSearch}
                filters={[
                    {
                        key: 'status',
                        value: statusFilter,
                        onChange: setStatusFilter,
                        options: [
                            { value: '', label: 'All statuses' },
                            { value: 'OPEN', label: 'Open' },
                            { value: 'PUBLISHED', label: 'Published' },
                            { value: 'IN_PROGRESS', label: 'In progress' },
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

            <Modal isOpen={formModal.isOpen} title={editingId ? 'Edit tender' : 'Add tender'} onClose={formModal.close}>
                <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2 md:col-span-2">
                        <label htmlFor="tenderTitle" className="text-sm font-medium text-slate-700 dark:text-slate-200">
                            Title
                        </label>
                        <input
                            id="tenderTitle"
                            name="title"
                            value={form.title}
                            onChange={handleChange}
                            required
                            placeholder="Tender title"
                            className="w-full rounded-xl border border-slate-300 px-4 py-2.5 dark:border-slate-700 dark:bg-slate-950"
                        />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="tenderNumber" className="text-sm font-medium text-slate-700 dark:text-slate-200">
                            Tender number
                        </label>
                        <input
                            id="tenderNumber"
                            name="tenderNumber"
                            value={form.tenderNumber}
                            onChange={handleChange}
                            placeholder="Tender number"
                            className="w-full rounded-xl border border-slate-300 px-4 py-2.5 dark:border-slate-700 dark:bg-slate-950"
                        />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="customerName" className="text-sm font-medium text-slate-700 dark:text-slate-200">
                            Customer name
                        </label>
                        <input
                            id="customerName"
                            name="customerName"
                            value={form.customerName}
                            onChange={handleChange}
                            placeholder="Customer name"
                            className="w-full rounded-xl border border-slate-300 px-4 py-2.5 dark:border-slate-700 dark:bg-slate-950"
                        />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="clientId" className="text-sm font-medium text-slate-700 dark:text-slate-200">
                            Client
                        </label>
                        <select
                            id="clientId"
                            name="clientId"
                            value={form.clientId}
                            onChange={handleChange}
                            required
                            className="w-full rounded-xl border border-slate-300 px-4 py-2.5 dark:border-slate-700 dark:bg-slate-950"
                        >
                            <option value="">Select client</option>
                            {clients.map((item) => (
                                <option key={item.id} value={item.id}>
                                    {item.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="tenderStatus" className="text-sm font-medium text-slate-700 dark:text-slate-200">
                            Status
                        </label>
                        <select
                            id="tenderStatus"
                            name="status"
                            value={form.status}
                            onChange={handleChange}
                            className="w-full rounded-xl border border-slate-300 px-4 py-2.5 dark:border-slate-700 dark:bg-slate-950"
                        >
                            <option value="OPEN">Open</option>
                            <option value="PUBLISHED">Published</option>
                            <option value="IN_PROGRESS">In progress</option>
                            <option value="CLOSED">Closed</option>
                            <option value="CANCELLED">Cancelled</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="estimatedValue" className="text-sm font-medium text-slate-700 dark:text-slate-200">
                            Estimated value
                        </label>
                        <input
                            id="estimatedValue"
                            type="number"
                            step="0.01"
                            min="0"
                            name="estimatedValue"
                            value={form.estimatedValue}
                            onChange={handleChange}
                            placeholder="Estimated value"
                            className="w-full rounded-xl border border-slate-300 px-4 py-2.5 dark:border-slate-700 dark:bg-slate-950"
                        />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="publishedAt" className="text-sm font-medium text-slate-700 dark:text-slate-200">
                            Published at
                        </label>
                        <input
                            id="publishedAt"
                            type="date"
                            name="publishedAt"
                            value={form.publishedAt}
                            onChange={handleChange}
                            className="w-full rounded-xl border border-slate-300 px-4 py-2.5 dark:border-slate-700 dark:bg-slate-950"
                        />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="deadline" className="text-sm font-medium text-slate-700 dark:text-slate-200">
                            Deadline
                        </label>
                        <input
                            id="deadline"
                            type="date"
                            name="deadline"
                            value={form.deadline}
                            onChange={handleChange}
                            className="w-full rounded-xl border border-slate-300 px-4 py-2.5 dark:border-slate-700 dark:bg-slate-950"
                        />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                        <label htmlFor="tenderDescription" className="text-sm font-medium text-slate-700 dark:text-slate-200">
                            Description
                        </label>
                        <textarea
                            id="tenderDescription"
                            name="description"
                            value={form.description}
                            onChange={handleChange}
                            placeholder="Description"
                            rows="5"
                            className="w-full rounded-xl border border-slate-300 px-4 py-2.5 dark:border-slate-700 dark:bg-slate-950"
                        />
                    </div>

                    <div className="md:col-span-2 flex justify-end gap-3">
                        <button type="button" onClick={formModal.close} className="rounded-xl border border-slate-300 px-4 py-2.5 dark:border-slate-700">
                            Cancel
                        </button>
                        <button type="submit" disabled={loading} className="rounded-xl bg-teal-600 px-4 py-2.5 font-medium text-white hover:bg-teal-700 disabled:opacity-60">
                            {loading ? 'Saving...' : editingId ? 'Save changes' : 'Create tender'}
                        </button>
                    </div>
                </form>
            </Modal>

            <Modal
                isOpen={participantsModal.isOpen}
                title={selectedTender ? `Participants: ${selectedTender.title}` : 'Participants'}
                onClose={participantsModal.close}
                width="max-w-5xl"
            >
                <div className="space-y-5">
                    <div className="flex justify-end">
                        <button onClick={openParticipantCreate} className="rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-teal-700">
                            Add participant
                        </button>
                    </div>

                    <DataTable
                        columns={[
                            { key: 'manufacturerName', label: 'Name' },
                            { key: 'offeredPrice', label: 'Offered price', render: (row) => formatMoney(row.offeredPrice) },
                            { key: 'notes', label: 'Notes' },
                            {
                                key: 'winner',
                                label: 'Winner',
                                render: (row) => (
                                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${row.winner ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'}`}>
                    {row.winner ? 'Winner' : 'No'}
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
                                                { key: 'edit', label: 'Edit', icon: Pencil, onClick: () => openParticipantEdit(row) },
                                                { key: 'delete', label: 'Delete', icon: Trash2, danger: true, onClick: () => openParticipantDelete(row) },
                                            ]}
                                        />
                                    </div>
                                ),
                            },
                        ]}
                        rows={participants}
                        selectable
                        selectedIds={selectedParticipantIds}
                        onSelectionChange={setSelectedParticipantIds}
                        bulkActions={
                            <button
                                onClick={participantBulkDeleteModal.open}
                                className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-rose-700"
                            >
                                <Trash2 className="h-4 w-4" /> Delete selected
                            </button>
                        }
                    />
                </div>
            </Modal>

            <Modal
                isOpen={formModal.isOpen}
                title={editingId ? "Edit tender" : "Add tender"}
                onClose={formModal.close}
            >
                <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
                    <FormField
                        id="tender-title"
                        label="Title"
                        name="title"
                        value={form.title}
                        onChange={handleChange}
                        required
                        placeholder="Tender title"
                        className="md:col-span-2"
                    />

                    <FormField
                        id="tender-number"
                        label="Tender number"
                        name="tenderNumber"
                        value={form.tenderNumber}
                        onChange={handleChange}
                        placeholder="Tender number"
                    />

                    <FormField
                        id="tender-customer-name"
                        label="Customer name"
                        name="customerName"
                        value={form.customerName}
                        onChange={handleChange}
                        placeholder="Customer name"
                    />

                    <SelectField
                        id="tender-client"
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
                        id="tender-status"
                        label="Status"
                        name="status"
                        value={form.status}
                        onChange={handleChange}
                    >
                        <option value="OPEN">Open</option>
                        <option value="PUBLISHED">Published</option>
                        <option value="IN_PROGRESS">In progress</option>
                        <option value="CLOSED">Closed</option>
                        <option value="CANCELLED">Cancelled</option>
                    </SelectField>

                    <FormField
                        id="tender-estimated-value"
                        label="Estimated value"
                        type="number"
                        step="0.01"
                        min="0"
                        name="estimatedValue"
                        value={form.estimatedValue}
                        onChange={handleChange}
                        placeholder="Estimated value"
                    />

                    <FormField
                        id="tender-published-at"
                        label="Published at"
                        type="date"
                        name="publishedAt"
                        value={form.publishedAt}
                        onChange={handleChange}
                    />

                    <FormField
                        id="tender-deadline"
                        label="Deadline"
                        type="date"
                        name="deadline"
                        value={form.deadline}
                        onChange={handleChange}
                    />

                    <TextareaField
                        id="tender-description"
                        label="Description"
                        name="description"
                        value={form.description}
                        onChange={handleChange}
                        placeholder="Description"
                        rows={5}
                        className="md:col-span-2"
                    />

                    <div className="md:col-span-2 flex justify-end gap-3">
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
                            {loading ? "Saving..." : editingId ? "Save changes" : "Create tender"}
                        </button>
                    </div>
                </form>
            </Modal>

            <ConfirmModal
                isOpen={deleteModal.isOpen}
                title="Delete tender"
                message={`Delete "${deletingItem?.title || ''}"?`}
                onClose={deleteModal.close}
                onConfirm={handleDelete}
                loading={loading}
            />

            <ConfirmModal
                isOpen={participantDeleteModal.isOpen}
                title="Delete participant"
                message={`Delete participant "${deletingParticipant?.manufacturerName || ''}"?`}
                onClose={participantDeleteModal.close}
                onConfirm={handleParticipantDelete}
                loading={loading}
            />

            <ConfirmModal
                isOpen={bulkDeleteModal.isOpen}
                title="Delete tenders"
                message={`Delete ${selectedIds.length} selected tender${selectedIds.length === 1 ? '' : 's'}?`}
                onClose={bulkDeleteModal.close}
                onConfirm={handleBulkDelete}
                loading={loading}
            />

            <ConfirmModal
                isOpen={participantBulkDeleteModal.isOpen}
                title="Delete participants"
                message={`Delete ${selectedParticipantIds.length} selected participant${selectedParticipantIds.length === 1 ? '' : 's'}?`}
                onClose={participantBulkDeleteModal.close}
                onConfirm={handleParticipantBulkDelete}
                loading={loading}
            />
        </div>
    )
}
import { useEffect, useMemo, useState } from 'react'
import { apiDelete, apiGet, apiPost, apiPut } from '../api/client'
import { useAuth } from '../context/AuthContext'
import PageHeader from '../components/PageHeader'
import SearchFilters from '../components/SearchFilters'
import DataTable from '../components/DataTable'
import ActionMenu from '../components/ActionMenu'
import Modal from '../components/Modal'
import ConfirmModal from '../components/ConfirmModal'
import { useModal } from '../hooks/useModal'
import { safeArray } from '../utils/format'
import { FormField, SelectField } from '../components/FormField.jsx'
import { Pencil, Trash2, Archive, ArchiveRestore } from 'lucide-react'

const emptyForm = {
    email: '',
    fullName: '',
    role: 'USER',
    password: '',
}

const ROLE_LABELS = {
    OWNER: 'Owner',
    ADMINISTRATOR: 'Administrator',
    USER: 'User',
}

const ROLE_BADGE = {
    OWNER: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    ADMINISTRATOR: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    USER: 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
}

export default function UsersPage() {
    const { user: currentUser } = useAuth()

    const formModal = useModal()
    const deleteModal = useModal()
    const bulkDeleteModal = useModal()

    const [rows, setRows] = useState([])
    const [form, setForm] = useState(emptyForm)
    const [editingId, setEditingId] = useState(null)
    const [deletingItem, setDeletingItem] = useState(null)
    const [selectedIds, setSelectedIds] = useState([])
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('')
    const [roleFilter, setRoleFilter] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        const response = await apiGet('/users')
        setRows(safeArray(response))
    }

    const filteredRows = useMemo(() => {
        return rows.filter((row) => {
            const q = search.toLowerCase()
            const matchesSearch =
                !search ||
                row.fullName?.toLowerCase().includes(q) ||
                row.email?.toLowerCase().includes(q)

            const matchesStatus =
                !statusFilter ||
                (statusFilter === 'active' && !row.archived) ||
                (statusFilter === 'archived' && row.archived)

            const matchesRole = !roleFilter || row.role === roleFilter

            return matchesSearch && matchesStatus && matchesRole
        })
    }, [rows, search, statusFilter, roleFilter])

    const openCreate = () => {
        setError('')
        setEditingId(null)
        setForm(emptyForm)
        formModal.open()
    }

    const openEdit = (item) => {
        setError('')
        setEditingId(item.id)
        setForm({
            email: item.email || '',
            fullName: item.fullName || '',
            role: item.role === 'OWNER' ? 'ADMINISTRATOR' : item.role || 'USER',
            password: '',
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

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)
        try {
            if (editingId) {
                await apiPut(`/users/${editingId}`, {
                    fullName: form.fullName,
                    role: form.role,
                    password: form.password ? form.password : null,
                })
            } else {
                await apiPost('/users', {
                    email: form.email,
                    fullName: form.fullName,
                    role: form.role,
                    password: form.password,
                })
            }
            formModal.close()
            setEditingId(null)
            setForm(emptyForm)
            await loadData()
        } catch (err) {
            setError(err.message || 'Could not save user')
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async () => {
        if (!deletingItem) return
        setLoading(true)
        try {
            await apiDelete(`/users/${deletingItem.id}`)
            deleteModal.close()
            setDeletingItem(null)
            setSelectedIds((prev) => prev.filter((id) => id !== deletingItem.id))
            await loadData()
        } finally {
            setLoading(false)
        }
    }

    const handleArchiveToggle = async (item) => {
        await apiPut(`/users/${item.id}/${item.archived ? 'unarchive' : 'archive'}`, {})
        await loadData()
    }

    const isOwnerRow = (row) => row.role === 'OWNER'
    const isSelfRow = (row) => row.id === currentUser?.id
    const isSelectableRow = (row) => !isOwnerRow(row) && !isSelfRow(row)

    const selectedRows = rows.filter((row) => selectedIds.includes(row.id))

    const handleBulkArchive = async (archived) => {
        const targets = selectedRows.filter((row) => !!row.archived !== archived)
        if (targets.length === 0) return
        setLoading(true)
        try {
            await Promise.all(
                targets.map((row) => apiPut(`/users/${row.id}/${archived ? 'archive' : 'unarchive'}`, {}))
            )
            await loadData()
        } finally {
            setLoading(false)
        }
    }

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return
        setLoading(true)
        try {
            await Promise.all(selectedIds.map((id) => apiDelete(`/users/${id}`)))
            bulkDeleteModal.close()
            setSelectedIds([])
            await loadData()
        } finally {
            setLoading(false)
        }
    }

    const columns = [
        { key: 'fullName', label: 'Name', render: (row) => row.fullName || '-' },
        { key: 'email', label: 'Email' },
        {
            key: 'role',
            label: 'Role',
            render: (row) => (
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${ROLE_BADGE[row.role] || ROLE_BADGE.USER}`}>
                    {ROLE_LABELS[row.role] || row.role}
                </span>
            ),
        },
        {
            key: 'archived',
            label: 'Status',
            render: (row) => (
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${row.archived ? 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300' : 'bg-emerald-100 text-emerald-700'}`}>
                    {row.archived ? 'Archived' : 'Active'}
                </span>
            ),
        },
        {
            key: 'actions',
            label: '',
            render: (row) => (
                <div className="flex justify-end">
                    <ActionMenu
                        emptyLabel={isOwnerRow(row) ? 'Owner account' : isSelfRow(row) ? 'You' : undefined}
                        actions={
                            isOwnerRow(row) || isSelfRow(row)
                                ? []
                                : [
                                    { key: 'edit', label: 'Edit', icon: Pencil, onClick: () => openEdit(row) },
                                    {
                                        key: 'archive',
                                        label: row.archived ? 'Unarchive' : 'Archive',
                                        icon: row.archived ? ArchiveRestore : Archive,
                                        onClick: () => handleArchiveToggle(row),
                                    },
                                    { key: 'delete', label: 'Delete', icon: Trash2, danger: true, onClick: () => openDelete(row) },
                                ]
                        }
                    />
                </div>
            ),
        },
    ]

    return (
        <div className="space-y-6">
            <PageHeader
                title="Users"
                description="Manage the accounts that can sign in to your company."
                action={
                    <button onClick={openCreate} className="rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-teal-700">
                        Add user
                    </button>
                }
            />

            <SearchFilters
                search={search}
                onSearchChange={setSearch}
                filters={[
                    {
                        key: 'role',
                        value: roleFilter,
                        onChange: setRoleFilter,
                        options: [
                            { value: '', label: 'All roles' },
                            { value: 'OWNER', label: 'Owner' },
                            { value: 'ADMINISTRATOR', label: 'Administrator' },
                            { value: 'USER', label: 'User' },
                        ],
                    },
                    {
                        key: 'status',
                        value: statusFilter,
                        onChange: setStatusFilter,
                        options: [
                            { value: '', label: 'All statuses' },
                            { value: 'active', label: 'Active' },
                            { value: 'archived', label: 'Archived' },
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
                isRowSelectable={isSelectableRow}
                bulkActions={
                    <>
                        <button
                            onClick={() => handleBulkArchive(true)}
                            disabled={loading}
                            className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-600 disabled:opacity-60"
                        >
                            <Archive className="h-4 w-4" /> Archive
                        </button>
                        <button
                            onClick={() => handleBulkArchive(false)}
                            disabled={loading}
                            className="inline-flex items-center gap-2 rounded-lg bg-slate-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60"
                        >
                            <ArchiveRestore className="h-4 w-4" /> Unarchive
                        </button>
                        <button
                            onClick={bulkDeleteModal.open}
                            disabled={loading}
                            className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-60"
                        >
                            <Trash2 className="h-4 w-4" /> Delete
                        </button>
                    </>
                }
            />

            <Modal isOpen={formModal.isOpen} title={editingId ? 'Edit user' : 'Add user'} onClose={formModal.close} width="max-w-xl">
                <form onSubmit={handleSubmit} className="grid gap-4">
                    {error && (
                        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
                            {error}
                        </div>
                    )}

                    <FormField
                        id="user-email"
                        label="Email"
                        name="email"
                        type="email"
                        value={form.email}
                        onChange={handleChange}
                        required={!editingId}
                        placeholder="user@company.com"
                        disabled={!!editingId}
                    />

                    <FormField
                        id="user-full-name"
                        label="Full name"
                        name="fullName"
                        value={form.fullName}
                        onChange={handleChange}
                        placeholder="Full name"
                    />

                    <SelectField
                        id="user-role"
                        label="Role"
                        name="role"
                        value={form.role}
                        onChange={handleChange}
                        required
                    >
                        <option value="USER">User</option>
                        <option value="ADMINISTRATOR">Administrator</option>
                    </SelectField>

                    <FormField
                        id="user-password"
                        label={editingId ? 'New password (leave blank to keep current)' : 'Password'}
                        name="password"
                        type="password"
                        value={form.password}
                        onChange={handleChange}
                        required={!editingId}
                        placeholder={editingId ? 'Leave blank to keep current' : 'At least 6 characters'}
                        autoComplete="new-password"
                    />

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
                            {loading ? 'Saving...' : editingId ? 'Save changes' : 'Create user'}
                        </button>
                    </div>
                </form>
            </Modal>

            <ConfirmModal
                isOpen={deleteModal.isOpen}
                title="Delete user"
                message={`Delete "${deletingItem?.email || ''}"? This cannot be undone.`}
                onClose={deleteModal.close}
                onConfirm={handleDelete}
                loading={loading}
            />

            <ConfirmModal
                isOpen={bulkDeleteModal.isOpen}
                title="Delete users"
                message={`Delete ${selectedIds.length} selected user${selectedIds.length === 1 ? '' : 's'}? This cannot be undone.`}
                onClose={bulkDeleteModal.close}
                onConfirm={handleBulkDelete}
                loading={loading}
            />
        </div>
    )
}

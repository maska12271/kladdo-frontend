import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

function SelectAllCheckbox({ checked, indeterminate, disabled, onChange }) {
    const ref = useRef(null)

    useEffect(() => {
        if (ref.current) {
            ref.current.indeterminate = indeterminate
        }
    }, [indeterminate])

    return (
        <input
            ref={ref}
            type="checkbox"
            checked={checked}
            disabled={disabled}
            onChange={onChange}
            aria-label="Select all rows"
            className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500 disabled:opacity-40 dark:border-slate-600 dark:bg-slate-900"
        />
    )
}

export default function DataTable({
    columns,
    rows,
    selectable = false,
    selectedIds = [],
    onSelectionChange,
    getRowId = (row) => row.id,
    isRowSelectable = () => true,
    bulkActions = null,
}) {
    const selectionEnabled = selectable && typeof onSelectionChange === 'function'

    const selectableRowIds = selectionEnabled
        ? rows.filter(isRowSelectable).map(getRowId)
        : []
    const selectedSet = new Set(selectedIds)
    const visibleSelectedCount = selectableRowIds.filter((id) => selectedSet.has(id)).length
    const allSelected = selectableRowIds.length > 0 && visibleSelectedCount === selectableRowIds.length
    const someSelected = visibleSelectedCount > 0 && !allSelected

    const toggleRow = (id) => {
        const next = new Set(selectedIds)
        if (next.has(id)) {
            next.delete(id)
        } else {
            next.add(id)
        }
        onSelectionChange(Array.from(next))
    }

    const toggleAll = () => {
        if (allSelected) {
            const visible = new Set(selectableRowIds)
            onSelectionChange(selectedIds.filter((id) => !visible.has(id)))
        } else {
            const next = new Set(selectedIds)
            selectableRowIds.forEach((id) => next.add(id))
            onSelectionChange(Array.from(next))
        }
    }

    const totalColumns = columns.length + (selectionEnabled ? 1 : 0)
    const showBulkBar = selectionEnabled && selectedIds.length > 0

    return (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            {showBulkBar && (
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-teal-200 bg-teal-50 px-4 py-3 dark:border-teal-900/60 dark:bg-teal-950/30">
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => onSelectionChange([])}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-teal-700 transition hover:bg-teal-100 dark:text-teal-300 dark:hover:bg-teal-900/50"
                            aria-label="Clear selection"
                        >
                            <X className="h-4 w-4" />
                        </button>
                        <span className="text-sm font-semibold text-teal-800 dark:text-teal-200">
                            {selectedIds.length} selected
                        </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">{bulkActions}</div>
                </div>
            )}

            <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-800/70">
                    <tr>
                        {selectionEnabled && (
                            <th className="w-12 px-4 py-3 text-left">
                                <SelectAllCheckbox
                                    checked={allSelected}
                                    indeterminate={someSelected}
                                    disabled={selectableRowIds.length === 0}
                                    onChange={toggleAll}
                                />
                            </th>
                        )}
                        {columns.map((column) => (
                            <th
                                key={column.key}
                                className="whitespace-nowrap px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-300"
                            >
                                {column.label}
                            </th>
                        ))}
                    </tr>
                    </thead>
                    <tbody>
                    {rows.length === 0 ? (
                        <tr>
                            <td colSpan={totalColumns} className="px-4 py-12 text-center text-slate-500 dark:text-slate-400">
                                No data found.
                            </td>
                        </tr>
                    ) : (
                        rows.map((row, index) => {
                            const rowId = getRowId(row)
                            const rowSelectable = selectionEnabled && isRowSelectable(row)
                            const isSelected = rowSelectable && selectedSet.has(rowId)
                            return (
                                <tr
                                    key={rowId ?? index}
                                    className={`border-t border-slate-200 dark:border-slate-800 ${
                                        isSelected ? 'bg-teal-50/60 dark:bg-teal-950/20' : ''
                                    }`}
                                >
                                    {selectionEnabled && (
                                        <td className="w-12 px-4 py-3 align-top">
                                            {rowSelectable && (
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => toggleRow(rowId)}
                                                    aria-label="Select row"
                                                    className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500 dark:border-slate-600 dark:bg-slate-900"
                                                />
                                            )}
                                        </td>
                                    )}
                                    {columns.map((column) => (
                                        <td key={column.key} className="px-4 py-3 align-top text-slate-700 dark:text-slate-200">
                                            {column.render ? column.render(row) : row[column.key]}
                                        </td>
                                    ))}
                                </tr>
                            )
                        })
                    )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

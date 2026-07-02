import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Download, Upload } from 'lucide-react'
import { exportToCsv } from '../utils/csv'
import ImportModal from './ImportModal'

/**
 * Header toolbar with Export (always) and Import (when `importConfig.canImport`).
 * Export writes the rows it is given — pass the page's already-filtered rows so the export
 * mirrors the current search/filter view. For server-paginated pages, also pass `fetchRows`
 * (an async fn returning every matching row) so the export isn't limited to the current page,
 * and `count` (the grand total) for the button's enabled/label state. Import is offered only for
 * entities that map cleanly to a flat CSV; omit `importConfig` to render export only.
 */
export default function DataToolbar({ entityLabel, exportColumns, rows, fetchRows, count, importConfig, onImported }) {
    const { t } = useTranslation()
    const [importOpen, setImportOpen] = useState(false)
    const [exporting, setExporting] = useState(false)
    const canImport = Boolean(importConfig?.canImport)
    const exportCount = count ?? rows.length

    const handleExport = async () => {
        const date = new Date().toISOString().slice(0, 10)
        let data = rows
        if (fetchRows) {
            setExporting(true)
            try {
                data = await fetchRows()
            } catch {
                // The api client surfaces its own error toast; just abort the export.
                setExporting(false)
                return
            }
            setExporting(false)
        }
        exportToCsv(`${entityLabel}-${date}.csv`, exportColumns, data)
    }

    return (
        <>
            <button
                type="button"
                onClick={handleExport}
                disabled={exportCount === 0 || exporting}
                title={exportCount === 0 ? t('toolbar.nothingToExport') : t('toolbar.exportTitle', { count: exportCount })}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
                <Download className="h-4 w-4" /> {t('toolbar.export')}
            </button>

            {canImport && (
                <button
                    type="button"
                    onClick={() => setImportOpen(true)}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                    <Upload className="h-4 w-4" /> {t('toolbar.import')}
                </button>
            )}

            {canImport && importOpen && (
                <ImportModal
                    isOpen
                    onClose={() => setImportOpen(false)}
                    entityLabel={entityLabel}
                    endpoint={importConfig.endpoint}
                    templateColumns={importConfig.templateColumns}
                    parseRow={importConfig.parseRow}
                    onImported={onImported}
                />
            )}
        </>
    )
}

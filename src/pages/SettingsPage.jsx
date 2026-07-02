import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { apiDelete, apiDownloadPost, apiGet, apiPost, apiPut, apiUpload } from '../api/client'
import { useToast } from '../context/ToastContext'
import { useSettings } from '../context/SettingsContext'
import PageHeader from '../components/PageHeader'
import LoadingBlock from '../components/LoadingBlock'
import Modal from '../components/Modal'
import ConfirmModal from '../components/ConfirmModal'
import { useModal } from '../hooks/useModal'
import { FormField, FormSelect } from '../components/FormField.jsx'
import AddressAutocompleteField from '../components/AddressAutocompleteField.jsx'
import { resolveImageUrl } from '../components/ImageUploadField'
import { PERMISSION_MODULES } from '../constants/modules'
import { SlidersHorizontal, Percent, FileText, Users, Plus, Pencil, Trash2, Star, UploadCloud, X } from 'lucide-react'

const TABS = [
    { key: 'general', icon: SlidersHorizontal },
    { key: 'taxes', icon: Percent },
    { key: 'invoicing', icon: FileText },
    { key: 'defaults', icon: Users },
]

const PENALTY_PERIODS = ['ONE_TIME', 'DAILY', 'WEEKLY', 'MONTHLY']

const INVOICE_TEMPLATES = ['CLASSIC', 'MODERN', 'MINIMAL']

// Appearance toggles rendered as a list of on/off rows in the Invoicing tab.
const INVOICE_TOGGLES = [
    'invoiceShowLogo',
    'invoiceShowLineSku',
    'invoiceShowPaymentTerms',
    'invoiceShowBankDetails',
    'invoiceShowNotes',
]

const PERMISSION_ACTIONS = [
    { key: 'canView', labelKey: 'users.perm.view' },
    { key: 'canCreate', labelKey: 'users.perm.create' },
    { key: 'canEdit', labelKey: 'users.perm.edit' },
    { key: 'canDelete', labelKey: 'users.perm.delete' },
]

const emptyTaxForm = { name: '', percentage: '', isDefault: false, active: true }

export default function SettingsPage() {
    const { t } = useTranslation()
    const toast = useToast()
    const { refresh: refreshDisplaySettings } = useSettings()

    const [tab, setTab] = useState('general')
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    const [settings, setSettings] = useState(null)
    const [taxRates, setTaxRates] = useState([])
    const [permRows, setPermRows] = useState([])
    const [warehouses, setWarehouses] = useState([])

    const taxModal = useModal()
    const deleteTaxModal = useModal()
    const [taxForm, setTaxForm] = useState(emptyTaxForm)
    const [editingTaxId, setEditingTaxId] = useState(null)
    const [deletingTax, setDeletingTax] = useState(null)

    useEffect(() => {
        loadAll()
    }, [])

    const loadAll = async () => {
        setLoading(true)
        try {
            const [settingsRes, taxRes, permRes, warehousesRes] = await Promise.all([
                apiGet('/settings'),
                apiGet('/settings/tax-rates'),
                apiGet('/settings/default-permissions'),
                apiGet('/warehouses'),
            ])
            setSettings(settingsRes)
            setTaxRates(Array.isArray(taxRes) ? taxRes : [])
            setPermRows(Array.isArray(permRes) ? permRes : [])
            setWarehouses(Array.isArray(warehousesRes) ? warehousesRes : [])
        } finally {
            setLoading(false)
        }
    }

    // --- General / invoicing -----------------------------------------------------------------------

    const handleSettingsChange = (e) => {
        const { name, value, type, checked } = e.target
        setSettings((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
    }

    const logoInputRef = useRef(null)
    const [logoUploading, setLogoUploading] = useState(false)

    const uploadLogo = async (file) => {
        if (!file) return
        setLogoUploading(true)
        try {
            const formData = new FormData()
            formData.append('file', file)
            const res = await apiUpload('/upload/image', formData)
            setSettings((prev) => ({ ...prev, logoUrl: res.url }))
        } finally {
            setLogoUploading(false)
            if (logoInputRef.current) logoInputRef.current.value = ''
        }
    }

    // The settings payload sent to the API; shared by the save action and the live invoice preview.
    const buildSettingsPayload = () => ({
        currency: (settings.currency || 'EUR').toUpperCase(),
        pricesIncludeTax: !!settings.pricesIncludeTax,
        invoiceNumberPrefix: settings.invoiceNumberPrefix || '',
        invoicePaymentTermDays: Number(settings.invoicePaymentTermDays) || 0,
        latePaymentPenaltyPercent: Number(settings.latePaymentPenaltyPercent) || 0,
        penaltyPeriod: settings.penaltyPeriod || 'DAILY',
        defaultPrepaymentPercent: Number(settings.defaultPrepaymentPercent) || 0,
        companyAddress: settings.companyAddress || null,
        companyEmail: settings.companyEmail || null,
        companyPhone: settings.companyPhone || null,
        vatNumber: settings.vatNumber || null,
        bankName: settings.bankName || null,
        bankIban: settings.bankIban || null,
        logoUrl: settings.logoUrl || null,
        invoiceTemplate: settings.invoiceTemplate || 'CLASSIC',
        invoiceAccentColor: settings.invoiceAccentColor || null,
        invoiceShowLogo: settings.invoiceShowLogo !== false,
        invoiceShowLineSku: settings.invoiceShowLineSku !== false,
        invoiceShowPaymentTerms: settings.invoiceShowPaymentTerms !== false,
        invoiceShowBankDetails: settings.invoiceShowBankDetails !== false,
        invoiceShowNotes: settings.invoiceShowNotes !== false,
        invoiceFooterText: settings.invoiceFooterText || null,
        defaultProductUnit: settings.defaultProductUnit || 'pcs',
        defaultMinimumStock: Number(settings.defaultMinimumStock) || 0,
        defaultWarehouseId: settings.defaultWarehouseId ? Number(settings.defaultWarehouseId) : null,
    })

    const saveSettings = async (e) => {
        e?.preventDefault?.()
        setSaving(true)
        try {
            const saved = await apiPut('/settings', buildSettingsPayload())
            setSettings(saved)
            await refreshDisplaySettings()
            toast.success(t('settings.saved'))
        } finally {
            setSaving(false)
        }
    }

    // --- Live invoice preview ----------------------------------------------------------------------
    // Renders a sample invoice PDF on the server from the current (unsaved) settings, so the layout,
    // accent colour and toggles can be previewed before saving. Debounced and only while the Invoicing
    // tab is open. The blob URL is revoked when it is replaced or the component unmounts.

    const [previewUrl, setPreviewUrl] = useState(null)
    const [previewLoading, setPreviewLoading] = useState(false)

    // Only the fields that actually change the rendered invoice, so unrelated edits don't refetch.
    const previewSignature = settings
        ? JSON.stringify({
              currency: settings.currency,
              invoiceNumberPrefix: settings.invoiceNumberPrefix,
              invoicePaymentTermDays: settings.invoicePaymentTermDays,
              latePaymentPenaltyPercent: settings.latePaymentPenaltyPercent,
              penaltyPeriod: settings.penaltyPeriod,
              companyAddress: settings.companyAddress,
              companyEmail: settings.companyEmail,
              companyPhone: settings.companyPhone,
              vatNumber: settings.vatNumber,
              bankName: settings.bankName,
              bankIban: settings.bankIban,
              logoUrl: settings.logoUrl,
              invoiceTemplate: settings.invoiceTemplate,
              invoiceAccentColor: settings.invoiceAccentColor,
              invoiceShowLogo: settings.invoiceShowLogo,
              invoiceShowLineSku: settings.invoiceShowLineSku,
              invoiceShowPaymentTerms: settings.invoiceShowPaymentTerms,
              invoiceShowBankDetails: settings.invoiceShowBankDetails,
              invoiceShowNotes: settings.invoiceShowNotes,
              invoiceFooterText: settings.invoiceFooterText,
          })
        : ''

    useEffect(() => {
        if (tab !== 'invoicing' || !settings) return
        let cancelled = false
        let objectUrl = null
        setPreviewLoading(true)
        const timer = setTimeout(async () => {
            try {
                const blob = await apiDownloadPost('/settings/invoice-preview', buildSettingsPayload())
                if (cancelled) return
                objectUrl = URL.createObjectURL(blob)
                setPreviewUrl((prev) => {
                    if (prev) URL.revokeObjectURL(prev)
                    return objectUrl
                })
            } catch {
                // The global error toast already surfaced the failure; leave the previous preview in place.
            } finally {
                if (!cancelled) setPreviewLoading(false)
            }
        }, 500)
        return () => {
            cancelled = true
            clearTimeout(timer)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tab, previewSignature])

    // Revoke the last preview URL on unmount.
    useEffect(() => () => {
        if (previewUrl) URL.revokeObjectURL(previewUrl)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // --- Tax rates ---------------------------------------------------------------------------------

    const openCreateTax = () => {
        setEditingTaxId(null)
        setTaxForm({ ...emptyTaxForm, isDefault: taxRates.length === 0 })
        taxModal.open()
    }

    const openEditTax = (rate) => {
        setEditingTaxId(rate.id)
        setTaxForm({
            name: rate.name || '',
            percentage: rate.percentage ?? '',
            isDefault: !!rate.isDefault,
            active: rate.active !== false,
        })
        taxModal.open()
    }

    const handleTaxChange = (e) => {
        const { name, value, type, checked } = e.target
        setTaxForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
    }

    const saveTax = async (e) => {
        e.preventDefault()
        setSaving(true)
        try {
            const payload = {
                name: taxForm.name,
                percentage: Number(taxForm.percentage) || 0,
                isDefault: !!taxForm.isDefault,
                active: !!taxForm.active,
            }
            if (editingTaxId) await apiPut(`/settings/tax-rates/${editingTaxId}`, payload)
            else await apiPost('/settings/tax-rates', payload)
            toast.success(editingTaxId ? t('settings.tax.updated') : t('settings.tax.created'))
            taxModal.close()
            await loadAll()
            await refreshDisplaySettings()
        } finally {
            setSaving(false)
        }
    }

    const confirmDeleteTax = (rate) => {
        setDeletingTax(rate)
        deleteTaxModal.open()
    }

    const handleDeleteTax = async () => {
        if (!deletingTax) return
        setSaving(true)
        try {
            await apiDelete(`/settings/tax-rates/${deletingTax.id}`)
            toast.success(t('settings.tax.deleted'))
            deleteTaxModal.close()
            setDeletingTax(null)
            await loadAll()
            await refreshDisplaySettings()
        } finally {
            setSaving(false)
        }
    }

    // --- Default user permissions ------------------------------------------------------------------

    const togglePerm = (module, action, checked) => {
        setPermRows((prev) =>
            prev.map((row) => {
                if (row.module !== module) return row
                const next = { ...row, [action]: checked }
                if (action === 'canView' && !checked) {
                    next.canCreate = false
                    next.canEdit = false
                    next.canDelete = false
                } else if (action !== 'canView' && checked) {
                    next.canView = true
                }
                return next
            })
        )
    }

    const savePermissions = async () => {
        setSaving(true)
        try {
            const saved = await apiPut('/settings/default-permissions', { permissions: permRows })
            if (Array.isArray(saved)) setPermRows(saved)
            toast.success(t('settings.defaults.permsSaved'))
        } finally {
            setSaving(false)
        }
    }

    if (loading || !settings) {
        return (
            <div className="space-y-6">
                <PageHeader title={t('settings.title')} description={t('settings.description')} />
                <LoadingBlock />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <PageHeader title={t('settings.title')} description={t('settings.description')} />

            {/* Tabs */}
            <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800">
                {TABS.map(({ key, icon: Icon }) => (
                    <button
                        key={key}
                        onClick={() => setTab(key)}
                        className={`-mb-px inline-flex items-center gap-2 rounded-t-xl border-b-2 px-4 py-2.5 text-sm font-medium transition ${
                            tab === key
                                ? 'border-teal-600 text-teal-700 dark:text-teal-400'
                                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                    >
                        <Icon className="h-4 w-4" />
                        {t(`settings.tabs.${key}`)}
                    </button>
                ))}
            </div>

            {/* General */}
            {tab === 'general' && (
                <form onSubmit={saveSettings} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
                    <div className="grid gap-4 md:grid-cols-2">
                        <FormField
                            id="currency"
                            label={t('settings.general.currency')}
                            name="currency"
                            value={settings.currency || ''}
                            onChange={handleSettingsChange}
                            required
                            placeholder="EUR"
                            inputClassName="uppercase"
                            maxLength={3}
                        />
                        <FormField
                            id="invoice-prefix"
                            label={t('settings.general.invoicePrefix')}
                            name="invoiceNumberPrefix"
                            value={settings.invoiceNumberPrefix || ''}
                            onChange={handleSettingsChange}
                            placeholder="INV-"
                        />
                        <div className="space-y-1">
                            <FormSelect
                                id="default-warehouse"
                                label={t('settings.general.defaultWarehouse')}
                                name="defaultWarehouseId"
                                value={settings.defaultWarehouseId ? String(settings.defaultWarehouseId) : ''}
                                onChange={handleSettingsChange}
                                placeholder={t('settings.general.noDefaultWarehouse')}
                                options={[
                                    { value: '', label: t('settings.general.noDefaultWarehouse') },
                                    ...warehouses.map((w) => ({ value: String(w.id), label: w.name })),
                                ]}
                            />
                            <p className="text-xs text-slate-500 dark:text-slate-400">{t('settings.general.defaultWarehouseHint')}</p>
                        </div>
                    </div>

                    <label className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-4 py-3 text-sm dark:border-slate-800">
                        <span>
                            <span className="block font-medium text-slate-700 dark:text-slate-200">{t('settings.general.pricesIncludeTax')}</span>
                            <span className="text-xs text-slate-500 dark:text-slate-400">{t('settings.general.pricesIncludeTaxHint')}</span>
                        </span>
                        <input
                            type="checkbox"
                            name="pricesIncludeTax"
                            checked={!!settings.pricesIncludeTax}
                            onChange={handleSettingsChange}
                            className="h-5 w-5 rounded border-slate-300 text-teal-600 focus:ring-teal-500 dark:border-slate-700"
                        />
                    </label>

                    <SaveBar saving={saving} label={t('settings.save')} />
                </form>
            )}

            {/* Taxes */}
            {tab === 'taxes' && (
                <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-slate-500 dark:text-slate-400">{t('settings.tax.intro')}</p>
                        <button
                            onClick={openCreateTax}
                            className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-teal-700"
                        >
                            <Plus className="h-4 w-4" /> {t('settings.tax.add')}
                        </button>
                    </div>

                    {taxRates.length === 0 ? (
                        <p className="py-8 text-center text-sm text-slate-500">{t('settings.tax.empty')}</p>
                    ) : (
                        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-slate-200 bg-slate-50 text-left dark:border-slate-800 dark:bg-slate-900">
                                        <th className="px-4 py-3 font-semibold">{t('common.name')}</th>
                                        <th className="px-4 py-3 font-semibold">{t('settings.tax.rate')}</th>
                                        <th className="px-4 py-3 font-semibold">{t('common.status')}</th>
                                        <th className="px-4 py-3" />
                                    </tr>
                                </thead>
                                <tbody>
                                    {taxRates.map((rate) => (
                                        <tr key={rate.id} className="border-b border-slate-100 last:border-0 dark:border-slate-800/60">
                                            <td className="px-4 py-3 font-medium">
                                                <span className="inline-flex items-center gap-2">
                                                    {rate.name}
                                                    {rate.isDefault && (
                                                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                                                            <Star className="h-3 w-3" /> {t('settings.tax.default')}
                                                        </span>
                                                    )}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">{Number(rate.percentage)}%</td>
                                            <td className="px-4 py-3">
                                                <span className={rate.active ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}>
                                                    {rate.active ? t('common.active') : t('common.inactive')}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex justify-end gap-1">
                                                    <button
                                                        onClick={() => openEditTax(rate)}
                                                        className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                                                        aria-label={t('common.edit')}
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => confirmDeleteTax(rate)}
                                                        className="rounded-lg p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                                                        aria-label={t('common.delete')}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Invoicing */}
            {tab === 'invoicing' && (
                <form onSubmit={saveSettings} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
                    <div className="grid gap-4 md:grid-cols-2">
                        <FormField
                            id="payment-term"
                            label={t('settings.invoicing.paymentTermDays')}
                            type="number"
                            name="invoicePaymentTermDays"
                            value={settings.invoicePaymentTermDays ?? ''}
                            onChange={handleSettingsChange}
                            min={0}
                        />
                        <FormField
                            id="prepayment"
                            label={t('settings.invoicing.prepaymentPercent')}
                            type="number"
                            step="0.01"
                            name="defaultPrepaymentPercent"
                            value={settings.defaultPrepaymentPercent ?? ''}
                            onChange={handleSettingsChange}
                            min={0}
                        />
                        <FormField
                            id="penalty-percent"
                            label={t('settings.invoicing.penaltyPercent')}
                            type="number"
                            step="0.01"
                            name="latePaymentPenaltyPercent"
                            value={settings.latePaymentPenaltyPercent ?? ''}
                            onChange={handleSettingsChange}
                            min={0}
                        />
                        <FormSelect
                            id="penalty-period"
                            label={t('settings.invoicing.penaltyPeriod')}
                            name="penaltyPeriod"
                            value={settings.penaltyPeriod || 'DAILY'}
                            onChange={handleSettingsChange}
                            options={PENALTY_PERIODS.map((p) => ({ value: p, label: t(`settings.invoicing.period.${p}`) }))}
                        />
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{t('settings.invoicing.hint')}</p>

                    {/* Invoice PDF appearance: layout, accent colour, toggles and footer. */}
                    <div className="border-t border-slate-200 pt-5 dark:border-slate-800">
                        <h3 className="mb-1 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                            {t('settings.invoicing.appearanceHeading')}
                        </h3>
                        <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">{t('settings.invoicing.appearanceHint')}</p>

                        {/* Controls on the left, live preview on the right (side by side on desktop). */}
                        <div className="grid gap-6 lg:grid-cols-2">
                          <div>

                        {/* Layout picker */}
                        <div className="mb-5 grid gap-3 sm:grid-cols-3">
                            {INVOICE_TEMPLATES.map((tpl) => {
                                const selected = (settings.invoiceTemplate || 'CLASSIC') === tpl
                                return (
                                    <button
                                        type="button"
                                        key={tpl}
                                        onClick={() => setSettings((prev) => ({ ...prev, invoiceTemplate: tpl }))}
                                        className={`rounded-xl border p-3 text-left transition ${
                                            selected
                                                ? 'border-teal-600 ring-1 ring-teal-600 dark:border-teal-400 dark:ring-teal-400'
                                                : 'border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700'
                                        }`}
                                        aria-pressed={selected}
                                    >
                                        <InvoiceTemplateThumb template={tpl} accent={settings.invoiceAccentColor || '#0f766e'} />
                                        <span className="mt-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                                            {t(`settings.invoicing.template.${tpl}`)}
                                        </span>
                                        <span className="block text-xs text-slate-500 dark:text-slate-400">
                                            {t(`settings.invoicing.templateHint.${tpl}`)}
                                        </span>
                                    </button>
                                )
                            })}
                        </div>

                        {/* Accent colour */}
                        <div className="mb-5 flex items-center gap-3">
                            <label htmlFor="invoice-accent" className="text-sm font-medium text-slate-700 dark:text-slate-200">
                                {t('settings.invoicing.accentColor')}
                            </label>
                            <input
                                id="invoice-accent"
                                type="color"
                                name="invoiceAccentColor"
                                value={settings.invoiceAccentColor || '#0f766e'}
                                onChange={handleSettingsChange}
                                className="h-9 w-14 cursor-pointer rounded-lg border border-slate-300 bg-white p-1 dark:border-slate-700 dark:bg-slate-950"
                            />
                            <span className="text-xs text-slate-500 dark:text-slate-400">{settings.invoiceAccentColor || '#0f766e'}</span>
                        </div>

                        {/* Show/hide toggles */}
                        <div className="mb-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
                            {INVOICE_TOGGLES.map((key) => (
                                <label
                                    key={key}
                                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-4 py-3 text-sm dark:border-slate-800"
                                >
                                    <span className="font-medium text-slate-700 dark:text-slate-200">{t(`settings.invoicing.toggle.${key}`)}</span>
                                    <input
                                        type="checkbox"
                                        name={key}
                                        checked={settings[key] !== false}
                                        onChange={handleSettingsChange}
                                        className="h-5 w-5 rounded border-slate-300 text-teal-600 focus:ring-teal-500 dark:border-slate-700"
                                    />
                                </label>
                            ))}
                        </div>

                        <FormField
                            id="invoice-footer"
                            label={t('settings.invoicing.footerText')}
                            name="invoiceFooterText"
                            value={settings.invoiceFooterText || ''}
                            onChange={handleSettingsChange}
                            placeholder={t('settings.invoicing.footerPlaceholder')}
                        />
                          </div>

                          {/* Right: live example invoice, rendered server-side from the current selection.
                              Sticky on desktop so it stays in view while the controls are adjusted. */}
                          <div className="lg:sticky lg:top-6 lg:self-start">
                            <div className="mb-2 flex items-center justify-between">
                                <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                    {t('settings.invoicing.previewHeading')}
                                </h4>
                                {previewLoading && (
                                    <span className="text-xs text-slate-400">{t('settings.invoicing.previewLoading')}</span>
                                )}
                            </div>
                            <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-950">
                                {previewUrl ? (
                                    <iframe
                                        title={t('settings.invoicing.previewHeading')}
                                        src={`${previewUrl}#toolbar=0&navpanes=0&view=FitH`}
                                        className="h-[520px] w-full lg:h-[720px]"
                                    />
                                ) : (
                                    <div className="flex h-[520px] items-center justify-center text-sm text-slate-400 lg:h-[720px]">
                                        {t('settings.invoicing.previewLoading')}
                                    </div>
                                )}
                            </div>
                            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{t('settings.invoicing.previewHint')}</p>
                          </div>
                        </div>
                    </div>

                    {/* Seller details printed on the invoice header. */}
                    <div className="border-t border-slate-200 pt-5 dark:border-slate-800">
                        <h3 className="mb-1 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                            {t('settings.invoicing.sellerHeading')}
                        </h3>
                        <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">{t('settings.invoicing.sellerHint')}</p>

                        <div className="mb-4 flex items-center gap-4">
                            <div className="flex h-16 w-32 items-center justify-center overflow-hidden rounded-xl border border-dashed border-slate-300 bg-slate-50 dark:border-slate-700 dark:bg-slate-950">
                                {settings.logoUrl ? (
                                    <img src={resolveImageUrl(settings.logoUrl)} alt={t('settings.invoicing.logo')} className="max-h-full max-w-full object-contain" />
                                ) : (
                                    <span className="text-xs text-slate-400">{t('settings.invoicing.noLogo')}</span>
                                )}
                            </div>
                            <div className="flex flex-col gap-2">
                                <input
                                    ref={logoInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => uploadLogo(e.target.files?.[0])}
                                    className="hidden"
                                />
                                <button
                                    type="button"
                                    onClick={() => logoInputRef.current?.click()}
                                    disabled={logoUploading}
                                    className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-100 disabled:opacity-60 dark:border-slate-700 dark:hover:bg-slate-800"
                                >
                                    <UploadCloud className="h-4 w-4" /> {logoUploading ? t('common.saving') : t('settings.invoicing.uploadLogo')}
                                </button>
                                {settings.logoUrl && (
                                    <button
                                        type="button"
                                        onClick={() => setSettings((prev) => ({ ...prev, logoUrl: '' }))}
                                        className="inline-flex items-center gap-1 text-xs text-rose-500 hover:text-rose-600"
                                    >
                                        <X className="h-3 w-3" /> {t('settings.invoicing.removeLogo')}
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <AddressAutocompleteField id="company-address" label={t('settings.invoicing.companyAddress')} name="companyAddress" value={settings.companyAddress || ''} onChange={handleSettingsChange} />
                            <FormField id="vat-number" label={t('settings.invoicing.vatNumber')} name="vatNumber" value={settings.vatNumber || ''} onChange={handleSettingsChange} />
                            <FormField id="company-email" label={t('settings.invoicing.companyEmail')} type="email" name="companyEmail" value={settings.companyEmail || ''} onChange={handleSettingsChange} />
                            <FormField id="company-phone" label={t('settings.invoicing.companyPhone')} name="companyPhone" value={settings.companyPhone || ''} onChange={handleSettingsChange} />
                            <FormField id="bank-name" label={t('settings.invoicing.bankName')} name="bankName" value={settings.bankName || ''} onChange={handleSettingsChange} />
                            <FormField id="bank-iban" label={t('settings.invoicing.bankIban')} name="bankIban" value={settings.bankIban || ''} onChange={handleSettingsChange} />
                        </div>
                    </div>

                    <SaveBar saving={saving} label={t('settings.save')} savingLabel={t('common.saving')} />
                </form>
            )}

            {/* Defaults */}
            {tab === 'defaults' && (
                <div className="space-y-6">
                    <form onSubmit={saveSettings} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
                        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                            {t('settings.defaults.productHeading')}
                        </h3>
                        <div className="grid gap-4 md:grid-cols-2">
                            <FormField
                                id="default-unit"
                                label={t('settings.defaults.productUnit')}
                                name="defaultProductUnit"
                                value={settings.defaultProductUnit || ''}
                                onChange={handleSettingsChange}
                                placeholder="pcs"
                            />
                            <FormField
                                id="default-min-stock"
                                label={t('settings.defaults.minimumStock')}
                                type="number"
                                name="defaultMinimumStock"
                                value={settings.defaultMinimumStock ?? ''}
                                onChange={handleSettingsChange}
                                min={0}
                            />
                        </div>
                        <SaveBar saving={saving} label={t('settings.save')} savingLabel={t('common.saving')} />
                    </form>

                    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
                        <div>
                            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                {t('settings.defaults.permsHeading')}
                            </h3>
                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t('settings.defaults.permsIntro')}</p>
                        </div>

                        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-slate-200 bg-slate-50 text-left dark:border-slate-800 dark:bg-slate-900">
                                        <th className="px-4 py-3 font-semibold">{t('users.perm.area')}</th>
                                        {PERMISSION_ACTIONS.map((action) => (
                                            <th key={action.key} className="px-4 py-3 text-center font-semibold">{t(action.labelKey)}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {permRows.map((row) => {
                                        const meta = PERMISSION_MODULES.find((m) => m.module === row.module)
                                        return (
                                            <tr key={row.module} className="border-b border-slate-100 last:border-0 dark:border-slate-800/60">
                                                <td className="px-4 py-3 font-medium">{meta ? t(`nav.${meta.navKey}`) : row.module}</td>
                                                {PERMISSION_ACTIONS.map((action) => (
                                                    <td key={action.key} className="px-4 py-3 text-center">
                                                        <input
                                                            type="checkbox"
                                                            checked={!!row[action.key]}
                                                            onChange={(e) => togglePerm(row.module, action.key, e.target.checked)}
                                                            className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500 dark:border-slate-700"
                                                        />
                                                    </td>
                                                ))}
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex justify-end">
                            <button
                                onClick={savePermissions}
                                disabled={saving}
                                className="rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-60"
                            >
                                {saving ? t('common.saving') : t('settings.defaults.savePerms')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Tax rate create/edit modal */}
            <Modal
                isOpen={taxModal.isOpen}
                title={editingTaxId ? t('settings.tax.editTitle') : t('settings.tax.addTitle')}
                onClose={taxModal.close}
                width="max-w-lg"
            >
                <form onSubmit={saveTax} className="grid gap-4">
                    <FormField
                        id="tax-name"
                        label={t('common.name')}
                        name="name"
                        value={taxForm.name}
                        onChange={handleTaxChange}
                        required
                        placeholder={t('settings.tax.namePlaceholder')}
                    />
                    <FormField
                        id="tax-percentage"
                        label={t('settings.tax.rate')}
                        type="number"
                        step="0.001"
                        name="percentage"
                        value={taxForm.percentage}
                        onChange={handleTaxChange}
                        required
                        min={0}
                        max={100}
                        placeholder="20"
                    />
                    <label className="inline-flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-sm dark:border-slate-800">
                        <input
                            type="checkbox"
                            name="isDefault"
                            checked={!!taxForm.isDefault}
                            onChange={handleTaxChange}
                            className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500 dark:border-slate-700"
                        />
                        <span className="font-medium text-slate-700 dark:text-slate-200">{t('settings.tax.makeDefault')}</span>
                    </label>
                    {/* Active is only meaningful once a rate exists — a new tax rate is created active. */}
                    {editingTaxId && (
                        <label className="inline-flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-sm dark:border-slate-800">
                            <input
                                type="checkbox"
                                name="active"
                                checked={!!taxForm.active}
                                onChange={handleTaxChange}
                                className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500 dark:border-slate-700"
                            />
                            <span className="font-medium text-slate-700 dark:text-slate-200">{t('common.active')}</span>
                        </label>
                    )}
                    <div className="flex justify-end gap-3">
                        <button type="button" onClick={taxModal.close} className="rounded-xl border border-slate-300 px-4 py-2.5 dark:border-slate-700">
                            {t('common.cancel')}
                        </button>
                        <button type="submit" disabled={saving} className="rounded-xl bg-teal-600 px-4 py-2.5 font-medium text-white hover:bg-teal-700 disabled:opacity-60">
                            {saving ? t('common.saving') : t('common.save')}
                        </button>
                    </div>
                </form>
            </Modal>

            <ConfirmModal
                isOpen={deleteTaxModal.isOpen}
                title={t('settings.tax.deleteTitle')}
                message={t('settings.tax.deleteConfirm', { name: deletingTax?.name || '' })}
                onClose={deleteTaxModal.close}
                onConfirm={handleDeleteTax}
                loading={saving}
            />
        </div>
    )
}

/** A small SVG thumbnail that sketches each invoice layout, tinted with the chosen accent colour. */
function InvoiceTemplateThumb({ template, accent }) {
    const line = (y, w) => <rect x="8" y={y} width={w} height="3" rx="1.5" fill="#cbd5e1" />
    return (
        <svg viewBox="0 0 100 70" className="h-16 w-full rounded-lg border border-slate-200 bg-white dark:border-slate-700" role="img">
            {template === 'MODERN' && (
                <>
                    <rect x="0" y="0" width="100" height="18" fill={accent} />
                    <rect x="8" y="6" width="22" height="6" rx="1.5" fill="#ffffff" />
                    <rect x="70" y="6" width="22" height="6" rx="1.5" fill="#ffffff" opacity="0.85" />
                    <rect x="8" y="26" width="84" height="6" fill={accent} opacity="0.9" />
                    {line(38, 84)}{line(45, 84)}{line(52, 60)}
                    <rect x="62" y="59" width="30" height="6" fill={accent} />
                </>
            )}
            {template === 'MINIMAL' && (
                <>
                    <rect x="8" y="8" width="30" height="5" rx="1" fill="#475569" />
                    <rect x="8" y="16" width="40" height="2" fill={accent} />
                    {line(30, 84)}{line(37, 84)}{line(44, 84)}{line(51, 60)}
                    <rect x="8" y="60" width="84" height="1.5" fill={accent} />
                </>
            )}
            {template === 'CLASSIC' && (
                <>
                    <rect x="8" y="7" width="24" height="7" rx="1.5" fill="#cbd5e1" />
                    <rect x="66" y="7" width="26" height="7" rx="1.5" fill={accent} />
                    <rect x="8" y="26" width="84" height="6" fill="#e2e8f0" />
                    {line(38, 84)}{line(45, 84)}{line(52, 60)}
                    <rect x="62" y="59" width="30" height="2" fill={accent} />
                </>
            )}
        </svg>
    )
}

function SaveBar({ saving, label, savingLabel }) {
    return (
        <div className="flex justify-end">
            <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-60"
            >
                {saving ? savingLabel : label}
            </button>
        </div>
    )
}

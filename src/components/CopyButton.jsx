import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, Copy } from 'lucide-react'
import { useToast } from '../context/ToastContext'

// Small inline copy-to-clipboard icon button. Renders nothing when there's no real value to copy
// (empty, or the "—" placeholder used across the detail pages).
export default function CopyButton({ value, className = '' }) {
    const { t } = useTranslation()
    const toast = useToast()
    const [copied, setCopied] = useState(false)

    const text = value == null ? '' : String(value).trim()
    if (!text || text === '—') return null

    const handleCopy = async (e) => {
        e.stopPropagation()
        e.preventDefault()
        try {
            await navigator.clipboard.writeText(text)
            setCopied(true)
            toast.success(t('common.copied'))
            setTimeout(() => setCopied(false), 1500)
        } catch {
            // Clipboard API unavailable (e.g. insecure context) — nothing else to do.
        }
    }

    return (
        <button
            type="button"
            onClick={handleCopy}
            aria-label={t('common.copy')}
            title={copied ? t('common.copied') : t('common.copy')}
            className={`inline-flex shrink-0 items-center justify-center rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200 ${className}`}
        >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
    )
}

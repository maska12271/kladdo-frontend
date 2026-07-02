import { useTranslation } from 'react-i18next'
import { Loader2 } from 'lucide-react'

export default function LoadingBlock({ text }) {
    const { t } = useTranslation()
    return (
        <div
            role="status"
            aria-live="polite"
            className="shadow-card flex flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400"
        >
            <Loader2 className="h-6 w-6 animate-spin text-teal-600 dark:text-teal-400" />
            <span>{text ?? t('common.loading')}</span>
        </div>
    )
}

import { Component } from 'react'
import { AlertCircle } from 'lucide-react'
import i18n from '../i18n'

/**
 * Catches render/lifecycle crashes anywhere below it and shows a translated fallback instead of a
 * blank screen. Must be a class component (error boundaries have no hook equivalent), so it reads
 * translations from the i18n instance directly rather than the useTranslation hook.
 */
export default class ErrorBoundary extends Component {
    constructor(props) {
        super(props)
        this.state = { hasError: false }
    }

    static getDerivedStateFromError() {
        return { hasError: true }
    }

    componentDidCatch(error, info) {
        console.error('Unhandled UI error:', error, info)
    }

    render() {
        if (!this.state.hasError) return this.props.children

        return (
            <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-100 p-6 text-center dark:bg-slate-950">
                <AlertCircle className="h-10 w-10 text-rose-500" />
                <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                    {i18n.t('errors.boundaryTitle')}
                </h1>
                <p className="max-w-md text-sm text-slate-600 dark:text-slate-400">
                    {i18n.t('errors.boundaryMessage')}
                </p>
                <button
                    type="button"
                    onClick={() => window.location.reload()}
                    className="rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-teal-700"
                >
                    {i18n.t('errors.reload')}
                </button>
            </div>
        )
    }
}

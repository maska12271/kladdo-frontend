export default function LoadingBlock({ text = 'Loading...' }) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
            {text}
        </div>
    )
}
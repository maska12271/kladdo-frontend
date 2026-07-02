export default function PageHeader({ title, description, action }) {
    return (
        <div className="shadow-card mb-6 flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 md:flex-row md:items-center">
            <div className="min-w-0">
                <h1 className="truncate text-2xl font-bold tracking-tight">{title}</h1>
                {description ? (
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>
                ) : null}
            </div>
            {action ? <div className="flex shrink-0 flex-wrap items-center gap-2">{action}</div> : null}
        </div>
    )
}
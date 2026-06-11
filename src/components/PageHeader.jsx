export default function PageHeader({ title, description, action }) {
    return (
        <div className="mb-6 flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 md:flex-row md:items-center">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>
            </div>
            {action ? <div>{action}</div> : null}
        </div>
    )
}
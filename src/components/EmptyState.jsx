export default function EmptyState({ title, description, icon: Icon, action }) {
    return (
        <div className="shadow-card flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center dark:border-slate-700 dark:bg-slate-900">
            {Icon ? (
                <span className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
                    <Icon className="h-6 w-6" />
                </span>
            ) : null}
            <h3 className="text-lg font-semibold">{title}</h3>
            {description ? (
                <p className="mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">{description}</p>
            ) : null}
            {action ? <div className="mt-5">{action}</div> : null}
        </div>
    )
}
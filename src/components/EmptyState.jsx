export default function EmptyState({ title, description }) {
    return (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center dark:border-slate-700 dark:bg-slate-900">
            <h3 className="text-lg font-semibold">{title}</h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{description}</p>
        </div>
    )
}
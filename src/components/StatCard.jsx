export default function StatCard({ title, value, hint, color = 'teal' }) {
    const map = {
        teal: 'from-teal-500 to-cyan-500',
        blue: 'from-blue-500 to-indigo-500',
        amber: 'from-amber-500 to-orange-500',
        rose: 'from-rose-500 to-pink-500',
    }

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <div className={`mb-4 h-2 w-20 rounded-full bg-gradient-to-r ${map[color]}`} />
            <p className="text-sm text-slate-500 dark:text-slate-400">{title}</p>
            <p className="mt-2 text-3xl font-bold">{value}</p>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{hint}</p>
        </div>
    )
}
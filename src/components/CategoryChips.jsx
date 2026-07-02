/**
 * Renders a list of partner categories as small pills. Falls back to an em dash when empty, so it
 * reads cleanly inside a table cell or a detail fact.
 */
export default function CategoryChips({ categories }) {
    const list = categories || []
    if (list.length === 0) {
        return <span className="text-slate-400 dark:text-slate-500">—</span>
    }
    return (
        <div className="flex flex-wrap gap-1">
            {list.map((c) => (
                <span
                    key={c.id}
                    className="inline-flex items-center rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-medium text-teal-700 dark:bg-teal-900/30 dark:text-teal-300"
                >
                    {c.name}
                </span>
            ))}
        </div>
    )
}

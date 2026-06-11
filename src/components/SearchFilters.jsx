export default function SearchFilters({
                                          search,
                                          onSearchChange,
                                          filters = [],
                                          rightContent,
                                      }) {
    return (
        <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <div className="grid gap-4 lg:grid-cols-[2fr_repeat(3,1fr)]">
                <input
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder="Search..."
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 outline-none focus:border-teal-500 dark:border-slate-700 dark:bg-slate-950"
                />

                {filters.map((filter) => (
                    <select
                        key={filter.key}
                        value={filter.value}
                        onChange={(e) => filter.onChange(e.target.value)}
                        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 outline-none focus:border-teal-500 dark:border-slate-700 dark:bg-slate-950"
                    >
                        {filter.options.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                ))}
            </div>

            {rightContent ? <div className="flex justify-end">{rightContent}</div> : null}
        </div>
    )
}
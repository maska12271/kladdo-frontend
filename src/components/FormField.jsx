export function FormField({
                              id,
                              label,
                              name,
                              value,
                              onChange,
                              type = "text",
                              placeholder = "",
                              required = false,
                              className = "",
                              inputClassName = "",
                              ...props
                          }) {
    return (
        <div className={`space-y-2 ${className}`}>
            <label
                htmlFor={id}
                className="text-sm font-medium text-slate-700 dark:text-slate-200"
            >
                {label}
            </label>
            <input
                id={id}
                name={name}
                type={type}
                value={value}
                onChange={onChange}
                required={required}
                placeholder={placeholder}
                className={`w-full rounded-xl border border-slate-300 px-4 py-2.5 dark:border-slate-700 dark:bg-slate-950 ${inputClassName}`}
                {...props}
            />
        </div>
    );
}

export function TextareaField({
                                  id,
                                  label,
                                  name,
                                  value,
                                  onChange,
                                  placeholder = "",
                                  required = false,
                                  className = "",
                                  rows = 4,
                              }) {
    return (
        <div className={`space-y-2 ${className}`}>
            <label
                htmlFor={id}
                className="text-sm font-medium text-slate-700 dark:text-slate-200"
            >
                {label}
            </label>
            <textarea
                id={id}
                name={name}
                value={value}
                onChange={onChange}
                required={required}
                placeholder={placeholder}
                rows={rows}
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 dark:border-slate-700 dark:bg-slate-950"
            />
        </div>
    );
}

export function SelectField({
                                id,
                                label,
                                name,
                                value,
                                onChange,
                                required = false,
                                className = "",
                                children,
                            }) {
    return (
        <div className={`space-y-2 ${className}`}>
            <label
                htmlFor={id}
                className="text-sm font-medium text-slate-700 dark:text-slate-200"
            >
                {label}
            </label>
            <select
                id={id}
                name={name}
                value={value}
                onChange={onChange}
                required={required}
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 dark:border-slate-700 dark:bg-slate-950"
            >
                {children}
            </select>
        </div>
    );
}
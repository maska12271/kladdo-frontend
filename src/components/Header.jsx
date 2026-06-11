import { useTheme } from '../context/ThemeContext'
import { Moon, Sun } from "lucide-react"

export default function Header() {
    const { theme, toggleTheme } = useTheme()

    return (
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 px-4 py-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90 md:px-6">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                        Procurement panel
                    </p>
                    <h2 className="mt-1 text-lg font-semibold">Tender management system</h2>
                </div>

                <button
                    onClick={toggleTheme}
                    aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                    className="rounded-xl border border-slate-300 p-2.5 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
                >
                    {theme === "dark" ? (
                        <Sun className="h-5 w-5" />
                    ) : (
                        <Moon className="h-5 w-5" />
                    )}
                </button>
            </div>
        </header>
    )
}
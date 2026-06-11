import { NavLink } from "react-router-dom"
import {
    LayoutDashboard,
    Package,
    Factory,
    Tags,
    Users,
    ShoppingCart,
    Truck,
    FileText,
    UserCog,
    LogOut,
} from "lucide-react"
import { useAuth } from "../context/AuthContext"

const baseLinks = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/products", label: "Products", icon: Package },
    { to: "/manufacturers", label: "Manufacturers", icon: Factory },
    { to: "/categories", label: "Categories", icon: Tags },
    { to: "/clients", label: "Clients", icon: Users },
    { to: "/sales-orders", label: "Sales Orders", icon: ShoppingCart },
    { to: "/purchase-orders", label: "Purchase Orders", icon: Truck },
    { to: "/tenders", label: "Tenders", icon: FileText },
]

const ROLE_LABELS = {
    OWNER: "Owner",
    ADMINISTRATOR: "Administrator",
    USER: "User",
}

export default function Sidebar() {
    const { user, isAdmin, logout } = useAuth()

    const links = isAdmin
        ? [...baseLinks, { to: "/users", label: "Users", icon: UserCog }]
        : baseLinks

    return (
        <aside className="hidden w-72 shrink-0 flex-col border-r border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 md:flex">
            <div className="mb-8">
                <h1 className="text-xl font-bold tracking-tight text-teal-700 dark:text-teal-400">
                    TenderSys
                </h1>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Orders, tenders, clients, products
                </p>
            </div>

            <nav className="flex-1 space-y-2 overflow-y-auto">
                {links.map((link) => {
                    const Icon = link.icon

                    return (
                        <NavLink
                            key={link.to}
                            to={link.to}
                            className={({ isActive }) =>
                                `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                                    isActive
                                        ? "bg-teal-600 text-white shadow-sm"
                                        : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                                }`
                            }
                        >
                            <Icon className="h-5 w-5 shrink-0" />
                            <span>{link.label}</span>
                        </NavLink>
                    )
                })}
            </nav>

            <div className="mt-6 border-t border-slate-200 pt-4 dark:border-slate-800">
                <div className="mb-3 px-1">
                    <p className="truncate text-sm font-medium text-slate-700 dark:text-slate-200">
                        {user?.fullName || user?.email}
                    </p>
                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                        {ROLE_LABELS[user?.role] || user?.role}
                        {user?.companyName ? ` · ${user.companyName}` : ""}
                    </p>
                </div>
                <button
                    onClick={logout}
                    className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                    <LogOut className="h-5 w-5 shrink-0" />
                    <span>Sign out</span>
                </button>
            </div>
        </aside>
    )
}

import { useState } from "react"
import { useTranslation } from "react-i18next"
import { NavLink } from "react-router-dom"
import {
    LayoutDashboard,
    Package,
    Factory,
    Users,
    ShoppingCart,
    Truck,
    FileText,
    UserCog,
    Settings,
    LogOut,
    PanelLeftClose,
    PanelLeftOpen,
    Warehouse,
} from "lucide-react"
import { useAuth } from "../context/AuthContext"
import { getCookie, setCookie } from "../utils/cookies"

// `module` is the permission area gating the link; links without one (Dashboard) are always shown.
// `labelKey` indexes the i18n `nav.*` dictionary.
const baseLinks = [
    { to: "/dashboard", labelKey: "dashboard", icon: LayoutDashboard },
    { to: "/products", labelKey: "products", icon: Package, module: "PRODUCTS" },
    { to: "/manufacturers", labelKey: "manufacturers", icon: Factory, module: "MANUFACTURERS" },
    { to: "/clients", labelKey: "clients", icon: Users, module: "CLIENTS" },
    { to: "/sales-orders", labelKey: "salesOrders", icon: ShoppingCart, module: "SALES_ORDERS" },
    { to: "/purchase-orders", labelKey: "purchaseOrders", icon: Truck, module: "PURCHASE_ORDERS" },
    { to: "/tenders", labelKey: "tenders", icon: FileText, module: "TENDERS" },
    { to: "/warehouses", labelKey: "warehouses", icon: Warehouse, module: "WAREHOUSES" },
]

const COLLAPSE_COOKIE = "sidebar_collapsed"

function initials(user) {
    const source = user?.fullName || user?.email || "?"
    return source
        .split(/\s+/)
        .map((part) => part[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
}

// Tooltip shown to the right of an item when the sidebar is collapsed.
function Tooltip({ label }) {
    return (
        <span className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 hidden -translate-y-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-white shadow-lg group-hover:block dark:bg-slate-700">
            {label}
        </span>
    )
}

export default function Sidebar() {
    const { t } = useTranslation()
    const { user, isAdmin, can, logout } = useAuth()
    const [collapsed, setCollapsed] = useState(() => getCookie(COLLAPSE_COOKIE) === "1")

    const toggle = () => {
        setCollapsed((prev) => {
            const next = !prev
            setCookie(COLLAPSE_COOKIE, next ? "1" : "0")
            return next
        })
    }

    const visibleLinks = baseLinks.filter((link) => !link.module || can(link.module, "canView"))
    const links = isAdmin
        ? [
              ...visibleLinks,
              { to: "/users", labelKey: "users", icon: UserCog },
              { to: "/settings", labelKey: "settings", icon: Settings },
          ]
        : visibleLinks

    return (
        <aside
            className={`sticky top-0 z-40 hidden h-screen shrink-0 flex-col self-start border-r border-slate-200 bg-white transition-[width] duration-200 dark:border-slate-800 dark:bg-slate-900 md:flex ${
                collapsed ? "w-20 p-3" : "w-64 p-4"
            }`}
        >
            <div className={`mb-4 flex ${collapsed ? "flex-col items-center gap-3" : "items-center justify-between"}`}>
                {collapsed ? (
                    <img src="/kladdo-logo.svg" alt={t('nav.appName')} className="h-8 w-auto" />
                ) : (
                    <div className="flex items-center gap-2.5">
                        <img src="/kladdo-logo.svg" alt="" aria-hidden="true" className="h-8 w-auto shrink-0" />
                        <h1 className="text-xl font-bold tracking-tight text-teal-700 dark:text-teal-400">
                            {t('nav.appName')}
                        </h1>
                    </div>
                )}
                <button
                    onClick={toggle}
                    aria-label={collapsed ? t('nav.expand') : t('nav.collapse')}
                    className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                >
                    {collapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
                </button>
            </div>

            <nav className={`flex-1 space-y-0.5 ${collapsed ? "overflow-visible" : "overflow-y-auto"}`}>
                {links.map((link) => {
                    const Icon = link.icon

                    return (
                        <NavLink
                            key={link.to}
                            to={link.to}
                            className={({ isActive }) =>
                                `group relative flex items-center rounded-lg text-sm font-medium transition ${
                                    collapsed ? "justify-center px-0 py-2.5" : "gap-3 px-3 py-2"
                                } ${
                                    isActive
                                        ? "bg-teal-600 text-white shadow-sm"
                                        : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                                }`
                            }
                        >
                            <Icon className="h-[18px] w-[18px] shrink-0" />
                            {!collapsed && <span>{t(`nav.${link.labelKey}`)}</span>}
                            {collapsed && <Tooltip label={t(`nav.${link.labelKey}`)} />}
                        </NavLink>
                    )
                })}
            </nav>

            <div className="mt-3 border-t border-slate-200 pt-3 dark:border-slate-800">
                {collapsed ? (
                    <div className="flex flex-col items-center gap-3">
                        <div
                            className="group relative flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200"
                        >
                            {initials(user)}
                            <Tooltip label={user?.fullName || user?.email} />
                        </div>
                        <button
                            onClick={logout}
                            aria-label={t('nav.signOut')}
                            className="group relative flex items-center justify-center rounded-lg p-2.5 text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                        >
                            <LogOut className="h-5 w-5 shrink-0" />
                            <Tooltip label={t('nav.signOut')} />
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="mb-2 px-1">
                            <p className="truncate text-sm font-medium text-slate-700 dark:text-slate-200">
                                {user?.fullName || user?.email}
                            </p>
                            <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                                {user?.role ? t(`roles.${user.role}`) : ""}
                                {user?.companyName ? ` · ${user.companyName}` : ""}
                            </p>
                        </div>
                        <button
                            onClick={logout}
                            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                        >
                            <LogOut className="h-[18px] w-[18px] shrink-0" />
                            <span>{t('nav.signOut')}</span>
                        </button>
                    </>
                )}
            </div>
        </aside>
    )
}

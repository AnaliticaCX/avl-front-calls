"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, LogOut, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { HOME_ITEM, isActive, NAV_SECTIONS, type NavItem } from "../../config/navigation";
import { useAuth } from "../../context/AuthContext";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import Logo, { Isotipo } from "../brand/Logo";

interface SidebarProps {
    /** En movil el sidebar vive dentro de un drawer y nunca se colapsa. */
    mobile?: boolean;
    onNavigate?: () => void;
}

export default function Sidebar({ mobile = false, onNavigate }: SidebarProps) {
    const router = useRouter();
    const { logout } = useAuth();
    const [storedCollapsed, setStoredCollapsed] = useLocalStorage("org.sidebar.collapsed", false);

    // En movil se ignora el estado persistido: siempre expandido dentro del drawer.
    const collapsed = mobile ? false : storedCollapsed;

    const handleLogout = () => {
        logout();
        router.push("/login");
    };

    return (
        <aside
            className={`flex h-full flex-col bg-ink-950 text-ink-200 transition-[width] duration-300 ease-out ${collapsed ? "w-sidebar-collapsed" : "w-sidebar"
                }`}
        >
            {/* Cabecera con la marca */}
            <div
                className={`flex h-topbar shrink-0 items-center border-b border-white/5 ${collapsed ? "justify-center px-2" : "justify-between px-4"
                    }`}
            >
                <Link
                    href="/"
                    onClick={onNavigate}
                    className="flex items-center rounded-lg transition-opacity hover:opacity-80"
                    aria-label="Organizate - Inicio"
                >
                    {collapsed ? (
                        <Isotipo size={30} variant="onDark" />
                    ) : (
                        <Logo size={28} variant="onDark" />
                    )}
                </Link>

                {!mobile && !collapsed && (
                    <button
                        onClick={() => setStoredCollapsed(true)}
                        className="rounded-lg p-1.5 text-ink-400 transition-colors hover:bg-white/5 hover:text-white"
                        aria-label="Colapsar menu"
                    >
                        <PanelLeftClose size={18} />
                    </button>
                )}
            </div>

            {!mobile && collapsed && (
                <button
                    onClick={() => setStoredCollapsed(false)}
                    className="mx-auto mt-3 rounded-lg p-2 text-ink-400 transition-colors hover:bg-white/5 hover:text-white"
                    aria-label="Expandir menu"
                >
                    <PanelLeftOpen size={18} />
                </button>
            )}

            {/* Navegacion */}
            <nav className="scrollbar-none flex-1 overflow-y-auto px-2 py-4">
                <NavLink item={HOME_ITEM} collapsed={collapsed} onNavigate={onNavigate} />

                <div className="mt-5 space-y-5">
                    {NAV_SECTIONS.map((section) => (
                        <div key={section.id}>
                            {collapsed ? (
                                <div className="mx-3 mb-2 h-px bg-white/10" />
                            ) : (
                                <p className="mb-1.5 px-3 text-[0.6875rem] font-semibold uppercase tracking-wider text-ink-500">
                                    {section.label}
                                </p>
                            )}

                            <ul className="space-y-0.5">
                                {section.items.map((item) => (
                                    <li key={item.href}>
                                        <NavLink
                                            item={item}
                                            collapsed={collapsed}
                                            onNavigate={onNavigate}
                                        />
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </nav>

            {/* Pie: salir */}
            <div className="shrink-0 border-t border-white/5 p-2">
                <button
                    onClick={handleLogout}
                    title={collapsed ? "Salir" : undefined}
                    className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-ink-400 transition-colors hover:bg-critical/15 hover:text-critical/70 ${collapsed ? "justify-center px-0" : ""
                        }`}
                >
                    <LogOut size={18} className="shrink-0" />
                    {!collapsed && <span>Salir</span>}
                </button>
            </div>
        </aside>
    );
}

/* -------------------------------------------------------------------------- */

interface NavLinkProps {
    item: NavItem;
    collapsed: boolean;
    onNavigate?: () => void;
}

function NavLink({ item, collapsed, onNavigate }: NavLinkProps) {
    const pathname = usePathname();
    const active = isActive(pathname, item.href);
    const hasChildren = Boolean(item.children?.length);

    // Abre el grupo automaticamente cuando la ruta activa cuelga de el.
    const [open, setOpen] = useState(active);
    useEffect(() => {
        if (active) setOpen(true);
    }, [active]);

    const Icon = item.icon;

    return (
        <>
            <div className="relative flex items-center">
                {active && (
                    <motion.span
                        layoutId="sidebar-active"
                        className="absolute left-0 h-6 w-[3px] rounded-r-full bg-accent-500"
                        transition={{ type: "spring", stiffness: 420, damping: 34 }}
                    />
                )}

                <Link
                    href={item.href}
                    onClick={onNavigate}
                    title={collapsed ? item.label : undefined}
                    className={`group flex min-w-0 flex-1 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${active
                        ? "bg-white/10 text-white"
                        : "text-ink-300 hover:bg-white/5 hover:text-white"
                        } ${collapsed ? "justify-center px-0" : ""}`}
                >
                    <Icon
                        size={18}
                        className={`shrink-0 transition-colors ${active ? "text-accent-400" : "text-ink-400 group-hover:text-accent-400"
                            }`}
                    />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                </Link>

                {hasChildren && !collapsed && (
                    <button
                        onClick={() => setOpen((v) => !v)}
                        className="mr-1 rounded p-1 text-ink-500 transition-colors hover:text-white"
                        aria-label={open ? "Contraer " + item.label : "Expandir " + item.label}
                        aria-expanded={open}
                    >
                        <ChevronDown
                            size={15}
                            className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
                        />
                    </button>
                )}
            </div>

            {/* Sub-rutas */}
            <AnimatePresence initial={false}>
                {hasChildren && open && !collapsed && (
                    <motion.ul
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                        className="overflow-hidden"
                    >
                        <div className="ml-[1.4375rem] mt-0.5 space-y-0.5 border-l border-white/10 pl-3">
                            {item.children?.map((child) => {
                                const childActive = isActive(pathname, child.href);
                                const ChildIcon = child.icon;
                                return (
                                    <li key={child.href}>
                                        <Link
                                            href={child.href}
                                            onClick={onNavigate}
                                            className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[0.8125rem] transition-colors ${childActive
                                                ? "bg-white/10 font-medium text-white"
                                                : "text-ink-400 hover:bg-white/5 hover:text-white"
                                                }`}
                                        >
                                            <ChildIcon
                                                size={15}
                                                className={`shrink-0 ${childActive ? "text-accent-400" : ""
                                                    }`}
                                            />
                                            <span className="truncate">{child.label}</span>
                                        </Link>
                                    </li>
                                );
                            })}
                        </div>
                    </motion.ul>
                )}
            </AnimatePresence>
        </>
    );
}

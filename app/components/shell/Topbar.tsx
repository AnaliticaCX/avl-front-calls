"use client";

import { ChevronRight, Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ALL_NAV_ITEMS, findSection, HOME_ITEM } from "../../config/navigation";
import ApiStatus from "./ApiStatus";

interface Crumb {
    label: string;
    href?: string;
}

/** Construye la ruta de migas a partir de la configuracion de navegacion. */
function buildCrumbs(pathname: string): Crumb[] {
    if (pathname === "/") return [{ label: "Inicio" }];

    const crumbs: Crumb[] = [{ label: "Inicio", href: "/" }];
    const section = findSection(pathname);
    if (section) crumbs.push({ label: section.label });

    // Coincidencias de navegacion ordenadas de mas corta a mas larga (padre antes que hijo).
    const matches = ALL_NAV_ITEMS.filter(
        (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
    ).sort((a, b) => a.href.length - b.href.length);

    matches.forEach((item, i) => {
        const isLast = i === matches.length - 1 && pathname === item.href;
        crumbs.push({ label: item.label, href: isLast ? undefined : item.href });
    });

    // Ruta dinamica no mapeada (p. ej. /chats/<conn_id>): la mostramos como detalle.
    const deepest = matches[matches.length - 1];
    if (deepest && pathname !== deepest.href) {
        const tail = pathname.slice(deepest.href.length + 1);
        if (tail) crumbs.push({ label: `Detalle ${tail}` });
    }

    return crumbs;
}

export default function Topbar({ onOpenMenu }: { onOpenMenu: () => void }) {
    const pathname = usePathname();
    const crumbs = buildCrumbs(pathname);
    const HomeIcon = HOME_ITEM.icon;

    return (
        <header className="sticky top-0 z-30 flex h-topbar shrink-0 items-center justify-between gap-4 border-b border-hairline bg-surface/85 px-4 backdrop-blur-md sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
                <button
                    onClick={onOpenMenu}
                    className="btn btn-ghost -ml-1 shrink-0 p-2 lg:hidden"
                    aria-label="Abrir menu"
                >
                    <Menu size={20} />
                </button>

                <nav aria-label="Ruta de navegacion" className="min-w-0">
                    <ol className="flex items-center gap-1 text-sm">
                        {crumbs.map((crumb, i) => {
                            const last = i === crumbs.length - 1;
                            return (
                                <li key={`${crumb.label}-${i}`} className="flex min-w-0 items-center gap-1">
                                    {i > 0 && (
                                        <ChevronRight
                                            size={14}
                                            className="shrink-0 text-ink-300"
                                            aria-hidden
                                        />
                                    )}
                                    {crumb.href ? (
                                        <Link
                                            href={crumb.href}
                                            className="flex shrink-0 items-center gap-1.5 rounded px-1 py-0.5 text-ink-500 transition-colors hover:text-accent-600"
                                        >
                                            {i === 0 && <HomeIcon size={14} aria-hidden />}
                                            <span className="hidden sm:inline">{crumb.label}</span>
                                        </Link>
                                    ) : (
                                        <span
                                            className={`truncate px-1 ${last ? "font-medium text-ink-900" : "text-ink-500"
                                                }`}
                                            aria-current={last ? "page" : undefined}
                                        >
                                            {crumb.label}
                                        </span>
                                    )}
                                </li>
                            );
                        })}
                    </ol>
                </nav>
            </div>

            <ApiStatus />
        </header>
    );
}

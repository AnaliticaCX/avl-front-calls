"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    perPage?: number;
    onPageChange: (page: number) => void;
    onPerPageChange?: (perPage: number) => void;
}

const PER_PAGE_OPTIONS = [10, 25, 50, 100];

/** Ventana de paginas alrededor de la actual, con elipsis en los extremos. */
function pageWindow(current: number, total: number): (number | "gap")[] {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    if (current <= 4) return [1, 2, 3, 4, 5, "gap", total];
    if (current >= total - 3) return [1, "gap", total - 4, total - 3, total - 2, total - 1, total];
    return [1, "gap", current - 1, current, current + 1, "gap", total];
}

const ARROW_BTN =
    "flex h-9 w-9 items-center justify-center rounded-full border border-hairline bg-surface text-ink-500 transition-all duration-200 hover:border-accent-300 hover:bg-accent-50 hover:text-accent-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-hairline disabled:hover:bg-surface disabled:hover:text-ink-500";

export default function Pagination({
    currentPage,
    totalPages,
    totalItems,
    perPage,
    onPageChange,
    onPerPageChange,
}: PaginationProps) {
    const pages = Math.max(totalPages, 1);

    return (
        <nav
            aria-label="Paginación"
            className="flex flex-col gap-3 border-t border-hairline bg-surface-sunken/60 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
        >
            {/* Recuento y tamaño de página */}
            <div className="flex items-center gap-3 text-sm text-ink-500">
                <span>
                    Página <span className="font-medium text-ink-900">{currentPage}</span> de{" "}
                    <span className="font-medium text-ink-900">{pages}</span>
                    <span className="hidden sm:inline">
                        {" · "}
                        <span className="tabular">{totalItems.toLocaleString("es-CO")}</span>{" "}
                        {totalItems === 1 ? "resultado" : "resultados"}
                    </span>
                </span>

                {onPerPageChange && perPage && (
                    <select
                        value={perPage}
                        onChange={(e) => onPerPageChange(Number(e.target.value))}
                        aria-label="Resultados por página"
                        className="rounded-full border border-hairline bg-surface px-3 py-1.5 text-sm text-ink-700 outline-none transition-colors hover:border-accent-300 focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20"
                    >
                        {PER_PAGE_OPTIONS.map((n) => (
                            <option key={n} value={n}>
                                {n} por pág.
                            </option>
                        ))}
                    </select>
                )}
            </div>

            {/* Controles */}
            <div className="flex items-center gap-1">
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage <= 1}
                    aria-label="Página anterior"
                    className={ARROW_BTN}
                >
                    <ChevronLeft size={16} />
                </button>

                {pageWindow(currentPage, pages).map((page, i) =>
                    page === "gap" ? (
                        <span key={`gap-${i}`} aria-hidden className="px-1 text-sm text-ink-300">
                            …
                        </span>
                    ) : (
                        <button
                            key={page}
                            onClick={() => onPageChange(page)}
                            aria-current={page === currentPage ? "page" : undefined}
                            className={`h-9 min-w-9 rounded-full px-2.5 text-sm font-medium tabular-nums transition-all duration-200 active:scale-95 ${page === currentPage
                                ? "bg-accent-500 text-white shadow-[var(--shadow-accent)]"
                                : "text-ink-500 hover:bg-accent-50 hover:text-accent-700"
                                }`}
                        >
                            {page}
                        </button>
                    )
                )}

                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage >= pages}
                    aria-label="Página siguiente"
                    className={ARROW_BTN}
                >
                    <ChevronRight size={16} />
                </button>
            </div>
        </nav>
    );
}

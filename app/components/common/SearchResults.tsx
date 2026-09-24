"use client";

import { CircleStop, Loader2 } from "lucide-react";
import { ReactNode, useEffect, useMemo, useState } from "react";
import type { Paging } from "../../hooks/usePagedSearch";
import EmptyState from "./EmptyState";
import ErrorMessage from "./ErrorMessage";
import Pagination from "./Pagination";
import Table, { type Column } from "./Table";

interface SearchResultsProps {
    columns: Column[];
    results: { data?: any[]; total?: number } | null;
    loading: boolean;
    error?: string;
    onRetry?: () => void;
    /** Interrumpe la búsqueda en curso desde la pantalla de carga. */
    onCancel?: () => void;
    /** Paginación en servidor. Sin ella, se pagina en el cliente. */
    paging?: Paging;
    itemName: string;
    itemNamePlural?: string;
    /** Botones de la cabecera (descargas...). */
    actions?: ReactNode;
    emptyTitle?: string;
    emptyMessage: string;
    /** Acción en el estado vacío (p. ej. quitar un filtro local). */
    emptyAction?: ReactNode;
    getRowId?: (row: any, index: number) => string;
    onRowClick?: (row: any) => void;
}

const CLIENT_PAGE_SIZE = 25;

export default function SearchResults({
    columns,
    results,
    loading,
    error,
    onRetry,
    onCancel,
    paging,
    itemName,
    itemNamePlural,
    actions,
    emptyTitle = "No se encontraron resultados",
    emptyMessage,
    emptyAction,
    getRowId,
    onRowClick,
}: SearchResultsProps) {
    const data = useMemo(() => results?.data ?? [], [results]);
    const [clientPage, setClientPage] = useState(1);
    const [clientPerPage, setClientPerPage] = useState(CLIENT_PAGE_SIZE);

    // Resultados nuevos (búsqueda, filtro u orden) vuelven a la primera página.
    const [prevData, setPrevData] = useState(data);
    if (prevData !== data) {
        setPrevData(data);
        setClientPage(1);
    }

    const total = paging ? paging.total : data.length;
    const page = paging ? paging.page : clientPage;
    const perPage = paging ? paging.perPage : clientPerPage;
    const totalPages = paging ? paging.totalPages : Math.ceil(data.length / clientPerPage);
    const rows = paging ? data : data.slice((clientPage - 1) * clientPerPage, clientPage * clientPerPage);

    const plural = itemNamePlural ?? `${itemName}s`;
    const from = total === 0 ? 0 : (page - 1) * perPage + 1;
    const to = Math.min(from + rows.length - 1, total);

    if (error) return <ErrorMessage message={error} onRetry={onRetry} />;

    // Cada búsqueda (primera o repetida) vuelve a mostrar la pantalla de carga,
    // en vez de dejar los resultados anteriores mientras llega la respuesta nueva.
    if (loading) return <TableSkeleton columns={Math.min(columns.length, 6)} onCancel={onCancel} />;

    if (!results) return null;

    if (data.length === 0) {
        return <EmptyState title={emptyTitle} message={emptyMessage} action={emptyAction} />;
    }

    const showPagination = totalPages > 1 || total > CLIENT_PAGE_SIZE;

    return (
        <div className="animate-rise">
            <Table
                columns={columns}
                data={rows}
                animationKey={`${page}-${perPage}`}
                getRowId={getRowId}
                onRowClick={onRowClick}
                header={
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                            <h2 className="text-base font-semibold text-ink-900">Resultados</h2>
                            <span className="pill bg-accent-50 text-accent-700">
                                <span className="tabular">{total.toLocaleString("es-CO")}</span>{" "}
                                {total === 1 ? itemName : plural}
                            </span>
                            {total > rows.length && (
                                <span className="text-xs text-ink-400">
                                    Mostrando <span className="tabular">{from.toLocaleString("es-CO")}</span>–
                                    <span className="tabular">{to.toLocaleString("es-CO")}</span>
                                </span>
                            )}
                        </div>
                        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
                    </div>
                }
                footer={
                    showPagination ? (
                        <Pagination
                            currentPage={page}
                            totalPages={totalPages}
                            totalItems={total}
                            perPage={perPage}
                            onPageChange={paging ? paging.onPageChange : setClientPage}
                            onPerPageChange={
                                paging
                                    ? paging.onPerPageChange
                                    : (n) => {
                                          setClientPerPage(n);
                                          setClientPage(1);
                                      }
                            }
                        />
                    ) : undefined
                }
            />
        </div>
    );
}

function useElapsedSeconds() {
    const [seconds, setSeconds] = useState(0);
    useEffect(() => {
        const start = Date.now();
        const id = setInterval(() => setSeconds(Math.floor((Date.now() - start) / 1000)), 1000);
        return () => clearInterval(id);
    }, []);
    return seconds;
}

function TableSkeleton({ columns, onCancel }: { columns: number; onCancel?: () => void }) {
    const widths = ["w-32", "w-24", "w-28", "w-20", "w-16", "w-24"];
    const elapsed = useElapsedSeconds();
    return (
        <div className="card overflow-hidden" aria-busy aria-label="Cargando resultados">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline px-5 py-3">
                <div className="flex items-center gap-2 text-sm text-ink-500" role="status">
                    <Loader2 size={16} className="animate-spin text-accent-500" aria-hidden />
                    <span>
                        Buscando{elapsed >= 2 && <> · <span className="tabular">{elapsed}s</span></>}
                    </span>
                    {elapsed >= 10 && (
                        <span className="hidden text-xs text-ink-400 sm:inline">
                            Las consultas amplias pueden tardar; puedes cancelar y acotar los filtros.
                        </span>
                    )}
                </div>
                {onCancel && (
                    <button type="button" onClick={onCancel} className="btn btn-ghost py-1.5 text-sm text-critical">
                        <CircleStop size={15} aria-hidden />
                        Cancelar
                    </button>
                )}
            </div>
            <div className="h-11 bg-surface-sunken" />
            {Array.from({ length: 6 }).map((_, r) => (
                <div
                    key={r}
                    className="flex items-center gap-8 border-t border-hairline px-5 py-4"
                    style={{ animationDelay: `${r * 80}ms` }}
                >
                    <div className="h-7 w-7 shrink-0 animate-shimmer rounded-full bg-ink-50" />
                    {Array.from({ length: columns }).map((_, c) => (
                        <div key={c} className="space-y-1.5">
                            <div
                                className={`h-3 animate-shimmer rounded bg-ink-100 ${widths[(c + r) % widths.length]}`}
                                style={{ animationDelay: `${(r + c) * 60}ms` }}
                            />
                            {c % 2 === 0 && <div className="h-2.5 w-14 animate-shimmer rounded bg-ink-50" />}
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
}

"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight, Inbox } from "lucide-react";
import { Fragment, ReactNode, useCallback, useEffect, useRef, useState } from "react";

export interface Column {
    key: string;
    label: string;
    render?: (value: any, row: any) => ReactNode;
    /** Alineacion del contenido. Usa "right" para importes y conteos. */
    align?: "left" | "right";
    /** Ancho maximo de la celda antes de recortar con puntos suspensivos. */
    maxWidth?: string;
    /**
     * Oculta la columna de la rejilla y la muestra solo al desplegar la fila.
     * Sirve para no saturar el ancho con campos secundarios.
     */
    secondary?: boolean;
    /** En el detalle desplegado, ocupa todo el ancho en vez de compartir la rejilla. */
    wide?: boolean;
}

interface TableProps {
    columns: Column[];
    data: any[];
    onRowClick?: (row: any) => void;
    /** Identificador estable de fila; por defecto usa conn_id o el indice. */
    getRowId?: (row: any, index: number) => string;
    /** Desactiva el desplegable de detalle. */
    expandable?: boolean;
    emptyTitle?: string;
    emptyHint?: string;
    /** Barra superior dentro de la tarjeta (título, recuento, acciones). */
    header?: ReactNode;
    /** Pie dentro de la tarjeta (paginación). */
    footer?: ReactNode;
    /** Cambia al paginar para volver a animar la entrada de las filas. */
    animationKey?: string | number;
}

const ACTIONS_KEY = "actions";
const EASE = [0.16, 1, 0.3, 1] as const;

function displayValue(value: unknown): string {
    if (value === null || value === undefined || value === "") return "—";
    return String(value);
}

export default function Table({
    columns,
    data,
    onRowClick,
    getRowId,
    expandable = true,
    emptyTitle = "No se encontraron resultados",
    emptyHint = "Ajusta los filtros de búsqueda o prueba con otros términos.",
    header,
    footer,
    animationKey,
}: TableProps) {
    const [expanded, setExpanded] = useState<Set<string>>(new Set());
    const [edges, setEdges] = useState({ left: false, right: false });
    const scrollRef = useRef<HTMLDivElement>(null);

    // Sombras de las columnas fijas solo cuando hay contenido oculto a ese lado.
    const measure = useCallback(() => {
        const el = scrollRef.current;
        if (!el) return;
        setEdges({
            left: el.scrollLeft > 0,
            right: el.scrollLeft + el.clientWidth < el.scrollWidth - 1,
        });
    }, []);

    useEffect(() => {
        measure();
        window.addEventListener("resize", measure);
        return () => window.removeEventListener("resize", measure);
    }, [measure, data, columns]);

    // Al cambiar de página se cierran los desplegables abiertos.
    const [prevAnimationKey, setPrevAnimationKey] = useState(animationKey);
    if (prevAnimationKey !== animationKey) {
        setPrevAnimationKey(animationKey);
        setExpanded(new Set());
    }

    const rowId = useCallback(
        (row: any, i: number) => getRowId?.(row, i) ?? String(row?.conn_id ?? i),
        [getRowId]
    );

    const toggle = (id: string) =>
        setExpanded((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });

    if (!data || data.length === 0) {
        return (
            <div className="card flex flex-col items-center justify-center p-12 text-center">
                <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent-50">
                    <Inbox size={26} className="text-accent-500" aria-hidden />
                </span>
                <h3 className="mb-1 text-base font-semibold text-ink-900">{emptyTitle}</h3>
                <p className="max-w-sm text-sm text-ink-400">{emptyHint}</p>
            </div>
        );
    }

    const actionsColumn = columns.find((c) => c.key === ACTIONS_KEY);
    const gridColumns = columns.filter((c) => !c.secondary && c.key !== ACTIONS_KEY);
    const detailColumns = columns.filter((c) => c.key !== ACTIONS_KEY);
    const firstColumn = gridColumns[0];
    const restColumns = gridColumns.slice(1);
    const totalCols = gridColumns.length + (expandable ? 1 : 0) + (actionsColumn ? 1 : 0);
    const firstStickyOffset = expandable ? "left-12" : "left-0";
    const leftShadow = edges.left ? "shadow-[6px_0_12px_-8px_rgba(9,32,73,0.25)]" : "";
    const rightShadow = edges.right ? "shadow-[-6px_0_12px_-8px_rgba(9,32,73,0.25)]" : "";

    const TH = "whitespace-nowrap px-5 py-3.5 text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-ink-400";

    return (
        <div className="card relative overflow-hidden">
            {header && <div className="border-b border-hairline px-5 py-4">{header}</div>}

            <div ref={scrollRef} onScroll={measure} className="overflow-x-auto overscroll-x-contain">
                <table className="w-full min-w-max border-separate border-spacing-0 text-sm">
                    <thead>
                        <tr className="bg-surface-sunken">
                            {expandable && (
                                <th scope="col" className={`sticky left-0 z-30 w-12 bg-surface-sunken ${leftShadow}`}>
                                    <span className="sr-only">Desplegar detalle</span>
                                </th>
                            )}

                            {firstColumn && (
                                <th
                                    scope="col"
                                    className={`sticky z-30 bg-surface-sunken text-left ${TH} ${firstStickyOffset} ${leftShadow}`}
                                >
                                    {firstColumn.label}
                                </th>
                            )}

                            {restColumns.map((column) => (
                                <th
                                    key={column.key}
                                    scope="col"
                                    className={`${TH} ${column.align === "right" ? "text-right" : "text-left"}`}
                                >
                                    {column.label}
                                </th>
                            ))}

                            {actionsColumn && (
                                <th scope="col" className={`sticky right-0 z-30 bg-surface-sunken ${TH} ${rightShadow}`}>
                                    <span className="sr-only">{actionsColumn.label}</span>
                                </th>
                            )}
                        </tr>
                    </thead>

                    <tbody>
                        {data.map((row, index) => {
                            const id = rowId(row, index);
                            const isOpen = expanded.has(id);
                            // Fondos opacos: las columnas fijas no deben transparentar al desplazar.
                            const rowBg = isOpen ? "bg-accent-50" : "bg-surface group-hover/row:bg-surface-sunken";
                            const cell = `border-t border-hairline transition-colors duration-150 ${rowBg}`;

                            return (
                                <Fragment key={id}>
                                    <motion.tr
                                        key={`${animationKey ?? ""}-${id}`}
                                        initial={{ opacity: 0, y: 6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.35, ease: EASE, delay: Math.min(index, 14) * 0.025 }}
                                        className={`group/row ${onRowClick || expandable ? "cursor-pointer" : ""}`}
                                        onClick={() => (onRowClick ? onRowClick(row) : expandable && toggle(id))}
                                    >
                                        {expandable && (
                                            <td
                                                className={`sticky left-0 z-10 w-12 pl-3 pr-1 ${cell} ${leftShadow} ${isOpen ? "shadow-[inset_3px_0_0_var(--color-accent-500)]" : ""}`}
                                            >
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        toggle(id);
                                                    }}
                                                    aria-expanded={isOpen}
                                                    aria-label={isOpen ? "Ocultar detalle" : "Ver todos los campos"}
                                                    className={`flex h-7 w-7 items-center justify-center rounded-full transition-all duration-200 ${isOpen
                                                        ? "bg-accent-500 text-white shadow-[var(--shadow-accent)]"
                                                        : "text-ink-300 hover:bg-accent-50 hover:text-accent-600 group-hover/row:text-ink-500"
                                                        }`}
                                                >
                                                    <ChevronRight
                                                        size={15}
                                                        className={`transition-transform duration-300 ${isOpen ? "rotate-90" : ""}`}
                                                    />
                                                </button>
                                            </td>
                                        )}

                                        {firstColumn && (
                                            <td
                                                className={`sticky z-10 whitespace-nowrap px-5 py-4 font-medium text-ink-800 ${firstStickyOffset} ${cell} ${leftShadow}`}
                                            >
                                                <CellContent column={firstColumn} row={row} />
                                            </td>
                                        )}

                                        {restColumns.map((column) => (
                                            <td
                                                key={column.key}
                                                className={`px-5 py-4 text-ink-600 ${column.align === "right" ? "text-right" : "text-left"} ${cell}`}
                                            >
                                                <CellContent column={column} row={row} />
                                            </td>
                                        ))}

                                        {actionsColumn && (
                                            <td
                                                className={`sticky right-0 z-10 px-5 py-4 text-right ${cell} ${rightShadow}`}
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <CellContent column={actionsColumn} row={row} />
                                            </td>
                                        )}
                                    </motion.tr>

                                    {expandable && (
                                        <AnimatePresence initial={false}>
                                            {isOpen && (
                                                <tr>
                                                    <td colSpan={totalCols} className="border-t border-hairline bg-accent-50/40 p-0">
                                                        <motion.div
                                                            initial={{ height: 0, opacity: 0 }}
                                                            animate={{ height: "auto", opacity: 1 }}
                                                            exit={{ height: 0, opacity: 0 }}
                                                            transition={{ duration: 0.28, ease: EASE }}
                                                            className="overflow-hidden"
                                                        >
                                                            <div className="px-5 py-4 sm:pl-12">
                                                                <dl className="grid gap-x-8 gap-y-4 rounded-xl border border-accent-100 bg-surface p-5 shadow-[var(--shadow-soft)] sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                                                    {detailColumns.map((column) => (
                                                                        <div
                                                                            key={column.key}
                                                                            className={`min-w-0 ${column.wide ? "col-span-full" : ""}`}
                                                                        >
                                                                            <dt className="mb-1 text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-ink-400">
                                                                                {column.label}
                                                                            </dt>
                                                                            <dd className="break-words text-sm text-ink-700">
                                                                                {column.render
                                                                                    ? column.render(row[column.key], row)
                                                                                    : displayValue(row[column.key])}
                                                                            </dd>
                                                                        </div>
                                                                    ))}
                                                                </dl>
                                                            </div>
                                                        </motion.div>
                                                    </td>
                                                </tr>
                                            )}
                                        </AnimatePresence>
                                    )}
                                </Fragment>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {footer}
        </div>
    );
}

/** Celda de rejilla: recorta lo largo y deja el valor completo en el tooltip. */
function CellContent({ column, row }: { column: Column; row: any }) {
    const raw = row[column.key];

    if (column.render) return <>{column.render(raw, row)}</>;

    const text = displayValue(raw);
    return (
        <span
            className={`block truncate ${text === "—" ? "text-ink-300" : ""}`}
            style={{ maxWidth: column.maxWidth ?? "20rem" }}
            title={text !== "—" ? text : undefined}
        >
            {text}
        </span>
    );
}

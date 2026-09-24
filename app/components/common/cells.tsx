"use client";

import { ArrowDownWideNarrow, ArrowUpNarrowWide, ArrowUpRight, FileSpreadsheet, FileText, Search, X, type LucideIcon } from "lucide-react";
import { ReactNode } from "react";
import { formatDate, formatTime } from "../../utils/formatters";

const EMPTY = "—";

function isBlank(value: unknown) {
    return value === null || value === undefined || value === "";
}

/** Valor principal con una línea secundaria atenuada debajo. */
export function Stack({
    primary,
    secondary,
    strong = false,
    mono = false,
}: {
    primary: ReactNode;
    secondary?: ReactNode;
    strong?: boolean;
    mono?: boolean;
}) {
    return (
        <div className="min-w-0 leading-snug">
            <div
                className={`truncate ${strong ? "font-medium text-ink-800" : "text-ink-700"} ${mono ? "font-mono text-[0.8125rem]" : ""}`}
            >
                {isBlank(primary) ? EMPTY : primary}
            </div>
            {secondary !== undefined && (
                <div className="mt-0.5 truncate text-xs text-ink-400">{secondary}</div>
            )}
        </div>
    );
}

export function DateTimeCell({ value }: { value: unknown }) {
    if (isBlank(value)) return <span className="text-ink-300">{EMPTY}</span>;
    const v = value as string;
    return <Stack primary={formatDate(v)} secondary={formatTime(v)} />;
}

/** Segundos → m:ss (o h:mm:ss), con el valor original en el tooltip. */
export function DurationCell({ seconds, suffix }: { seconds: unknown; suffix?: ReactNode }) {
    const n = Number(seconds);
    if (isBlank(seconds) || Number.isNaN(n)) return <span className="text-ink-300">{EMPTY}</span>;
    const h = Math.floor(n / 3600);
    const m = Math.floor((n % 3600) / 60);
    const s = Math.floor(n % 60);
    const pad = (x: number) => String(x).padStart(2, "0");
    const text = h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
    return (
        <div className="leading-snug" title={`${n} segundos`}>
            <span className="tabular font-medium text-ink-700">{text}</span>
            <span className="ml-1 text-xs text-ink-400">min</span>
            {suffix && <div className="mt-0.5 text-xs text-ink-400">{suffix}</div>}
        </div>
    );
}

export type Tone = "positive" | "critical" | "caution" | "info" | "neutral";

const TONE_CLASSES: Record<Tone, string> = {
    positive: "bg-positive-soft text-positive",
    critical: "bg-critical-soft text-critical",
    caution: "bg-caution-soft text-caution",
    info: "bg-info-soft text-info",
    neutral: "bg-ink-50 text-ink-600",
};

const TONE_DOT: Record<Tone, string> = {
    positive: "bg-positive",
    critical: "bg-critical",
    caution: "bg-caution",
    info: "bg-info",
    neutral: "bg-ink-300",
};

const TONE_RULES: [Tone, RegExp][] = [
    ["critical", /hung|hang|fail|fallid|error|rechaz|reject|abandon|cancel|mora|vencid|bounce|rebot|drop|perdid/i],
    ["caution", /busy|ocupad|no.?answer|sin.?resp|pend|timeout|proceso|parcial|transfer|espera/i],
    ["positive", /^ok$|answer|contestad|conectad|connect|success|exito|entregad|deliver|activ|al.?d[ií]a|pagad|cumplid|complet|sent|enviad|paz.?y.?salvo/i],
];

export function toneFor(value: string): Tone {
    for (const [tone, re] of TONE_RULES) if (re.test(value)) return tone;
    return "neutral";
}

// loan.status de Athena solo trae "Activa" o "Cancelada": ahí "Cancelada" significa
// saldada, lo opuesto de lo que el matcher genérico de arriba asume con "cancel".
// Se usa en cualquier columna/píldora que muestre el estado de una obligación
// (contactos, paz y salvo, estado de cuenta), para que el color sea consistente.
export function loanStatusTone(estado: string): Tone {
    if (/cancelad/i.test(estado)) return "positive";
    if (/activ/i.test(estado)) return "caution";
    return "neutral";
}

/** Estado como píldora de color según su significado (OK, HUNGUP, mora...). */
export function StatusPill({ value, tone }: { value: unknown; tone?: Tone }) {
    if (isBlank(value)) return <span className="text-ink-300">{EMPTY}</span>;
    const text = String(value);
    const t = tone ?? toneFor(text);
    return (
        <span className={`pill ${TONE_CLASSES[t]}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${TONE_DOT[t]}`} aria-hidden />
            {text}
        </span>
    );
}

/** Etiqueta discreta para códigos y categorías (canal, opción de menú...). */
export function Tag({ value }: { value: unknown }) {
    if (isBlank(value)) return <span className="text-ink-300">{EMPTY}</span>;
    return (
        <span className="inline-flex rounded-md border border-hairline bg-surface-sunken px-2 py-0.5 font-mono text-xs text-ink-600">
            {String(value)}
        </span>
    );
}

/** Filtro rápido sobre los resultados ya cargados. */
export function QuickFilter({
    value,
    onChange,
    placeholder = "Filtrar resultados…",
}: {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}) {
    return (
        <div className="relative">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" aria-hidden />
            <input
                type="search"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                aria-label={placeholder}
                className="h-9 w-60 rounded-full border border-hairline bg-surface pl-8 pr-8 text-[0.8125rem] text-ink-700 outline-none transition-all placeholder:text-ink-300 hover:border-accent-200 focus:w-72 focus:border-accent-500 focus:ring-2 focus:ring-accent-500/15 [&::-webkit-search-cancel-button]:hidden"
            />
            {value && (
                <button
                    type="button"
                    onClick={() => onChange("")}
                    aria-label="Quitar filtro"
                    className="absolute right-2 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full text-ink-400 hover:bg-ink-50 hover:text-ink-700"
                >
                    <X size={12} aria-hidden />
                </button>
            )}
        </div>
    );
}

/** Alterna el orden por fecha. */
export function SortToggle({ order, onChange }: { order: "desc" | "asc"; onChange: (order: "desc" | "asc") => void }) {
    const Icon = order === "desc" ? ArrowDownWideNarrow : ArrowUpNarrowWide;
    return (
        <button
            type="button"
            onClick={() => onChange(order === "desc" ? "asc" : "desc")}
            className="btn btn-secondary py-2 text-[0.8125rem]"
            title="Cambiar orden por fecha"
        >
            <Icon size={15} className="text-accent-600" aria-hidden />
            {order === "desc" ? "Más recientes" : "Más antiguos"}
        </button>
    );
}

/** Botón de descarga para la cabecera de resultados. */
export function ExportButton({ onClick, format = "excel" }: { onClick: () => void; format?: "excel" | "pdf" }) {
    const Icon = format === "pdf" ? FileText : FileSpreadsheet;
    return (
        <button type="button" onClick={onClick} className="btn btn-secondary py-2 text-[0.8125rem]">
            <Icon size={15} className={format === "pdf" ? "text-critical" : "text-positive"} aria-hidden />
            {format === "pdf" ? "PDF" : "Excel"}
        </button>
    );
}

/** Acción compacta de fila. */
export function RowAction({
    onClick,
    label = "Ver detalle",
    icon: Icon = ArrowUpRight,
}: {
    onClick: () => void;
    label?: string;
    icon?: LucideIcon;
}) {
    return (
        <button
            type="button"
            onClick={(e) => {
                e.stopPropagation();
                onClick();
            }}
            className="group/action inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-accent-200 bg-accent-50 px-3 py-1.5 text-xs font-medium text-accent-700 transition-all duration-200 hover:border-accent-400 hover:bg-accent-500 hover:text-white hover:shadow-[var(--shadow-accent)] active:scale-[0.97]"
        >
            {label}
            <Icon
                size={13}
                className="transition-transform duration-200 group-hover/action:-translate-y-0.5 group-hover/action:translate-x-0.5"
                aria-hidden
            />
        </button>
    );
}

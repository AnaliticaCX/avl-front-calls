"use client";

import { Download, MessagesSquare, Repeat } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { DateTimeCell, ExportButton, QuickFilter, RowAction, SortToggle, Stack, StatusPill, Tag } from "../components/common/cells";
import Filters, { AGENT_EXTENSION_FIELD } from "../components/common/Filters";
import InfoCallout from "../components/common/InfoCallout";
import InlineAlert from "../components/common/InlineAlert";
import PageHeader from "../components/common/PageHeader";
import SearchResults from "../components/common/SearchResults";
import { useAbortable } from "../hooks/useAbortable";
import { useFilters } from "../hooks/useFilters";
import { apiClient, isAbortError } from "../utils/api";
import { downloadXLSX } from "../utils/download";
import { formatDate, getTodayString } from "../utils/formatters";
import { validateDateRange as validateDateRangeUtil, validateEmail as validateEmailUtil } from "../utils/validators";

interface ChatFilters {
    conn_id: string;
    customer_id: string;
    customer_email: string;
    customer_phone: string;
    agent_id: string;
    start_date: string;
    end_date: string;
    keyword: string;
}

interface ChatRow {
    conn_id: string;
    channel?: string;
    date: string;
    customer_name?: string;
    customer_email?: string;
    customer_phone?: string;
    customer_id?: string;
    agent_name?: string;
    agent_id?: string;
    chat_duration?: string;
    feeling?: string;
    is_transferred?: boolean;
    all_agents?: string[];
}

const EMPTY_FILTERS: ChatFilters = {
    conn_id: "",
    customer_id: "",
    customer_email: "",
    customer_phone: "",
    agent_id: "",
    start_date: "",
    end_date: "",
    keyword: "",
};

const STATE_KEY = "chatSearchState";

const FEELING: Record<string, { label: string; tone: "positive" | "critical" | "neutral" }> = {
    positive: { label: "Positivo", tone: "positive" },
    negative: { label: "Negativo", tone: "critical" },
    neutral: { label: "Neutral", tone: "neutral" },
};

function toExcelRow(chat: ChatRow) {
    return {
        "ID Conversación": chat.conn_id || "",
        Cliente: chat.customer_name || "",
        "Customer ID": chat.customer_id || "",
        Email: chat.customer_email || "",
        Teléfono: chat.customer_phone || "",
        Agente: chat.agent_name || "",
        Fecha: chat.date ? formatDate(chat.date) : "",
        Canal: chat.channel || "",
        Sentimiento: chat.feeling || "",
        Transferida: chat.is_transferred ? "Sí" : "No",
        "Agentes (si transferida)": chat.all_agents ? chat.all_agents.join(" → ") : "",
    };
}

export default function ChatsPage() {
    const router = useRouter();
    const { filters, updateFilter, updateFilters, clearFilters } = useFilters<ChatFilters>(EMPTY_FILTERS);
    const [rows, setRows] = useState<ChatRow[] | null>(null);
    const [loading, setLoading] = useState(false);
    const { begin, abort } = useAbortable();
    const cancelar = () => {
        abort();
        setLoading(false);
    };
    const [error, setError] = useState("");
    const [emailError, setEmailError] = useState(false);
    const [dateRangeError, setDateRangeError] = useState("");
    const [localFilter, setLocalFilter] = useState("");
    const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

    const filterFields = [
        { name: "conn_id", label: "Conn ID", placeholder: "Ej: 1234567890" },
        { name: "customer_id", label: "Customer ID", placeholder: "ID del cliente" },
        { name: "customer_email", label: "Email del cliente", type: "email", placeholder: "cliente@example.com" },
        { name: "customer_phone", label: "Teléfono del cliente", placeholder: "+57 300 123 4567" },
        AGENT_EXTENSION_FIELD,
        { name: "start_date", label: "Fecha Inicio", type: "date", max: getTodayString() },
        { name: "end_date", label: "Fecha Fin", type: "date", max: getTodayString() },
        {
            name: "keyword",
            label: "Palabra clave",
            placeholder: "Contenido del chat, nombre, email…",
            hint: "Si la usas, se ignoran los demás filtros",
        },
    ];

    const runSearch = useCallback(async (f: ChatFilters) => {
        const signal = begin();
        setLoading(true);
        setError("");
        try {
            // La palabra clave usa su propio endpoint y tiene prioridad sobre el resto de filtros.
            const data: any = f.keyword
                ? await apiClient.get("/api/v1/chats/search/keyword", { keyword: f.keyword, page: 1, per_page: 500 }, signal)
                : await apiClient.get("/api/v1/chats/search", {
                    page: 1,
                    per_page: 1000,
                    order_by: "desc",
                    conn_id: f.conn_id,
                    customer_id: f.customer_id,
                    customer_email: f.customer_email,
                    customer_phone: f.customer_phone,
                    agent_id: f.agent_id,
                    start_date: f.start_date ? new Date(f.start_date).toISOString() : "",
                    end_date: f.end_date ? new Date(f.end_date).toISOString() : "",
                }, signal);
            setRows(data.data ?? []);
            setLocalFilter("");
        } catch (err) {
            if (isAbortError(err)) return;
            setError(err instanceof Error ? err.message : "Error al buscar conversaciones");
            setRows(null);
        } finally {
            if (!signal.aborted) setLoading(false);
        }
    }, [begin]);

    // Al volver del detalle se restauran los filtros y se repite la búsqueda.
    useEffect(() => {
        const saved = sessionStorage.getItem(STATE_KEY);
        if (!saved) return;
        sessionStorage.removeItem(STATE_KEY);
        try {
            const state = JSON.parse(saved);
            const restored: ChatFilters = { ...EMPTY_FILTERS, ...state.filters };
            updateFilters(restored);
            setSortOrder(state.sortOrder === "asc" ? "asc" : "desc");
            if (Object.values(restored).some(Boolean)) runSearch(restored);
        } catch {
            // estado corrupto: se ignora
        }
    }, [updateFilters, runSearch]);

    const buscarChats = (e: React.FormEvent) => {
        e.preventDefault();

        if (!Object.values(filters).some(Boolean)) {
            setError("Debes ingresar al menos un criterio de búsqueda (ID, email, teléfono, fechas o palabra clave)");
            return;
        }

        const emailOk = validateEmailUtil(filters.customer_email);
        setEmailError(!emailOk && filters.customer_email !== "");
        const dates = validateDateRangeUtil(filters.start_date, filters.end_date);
        setDateRangeError(dates.error || "");
        if (!emailOk || !dates.isValid) {
            setError("Por favor corrige los errores en el formulario antes de buscar");
            return;
        }

        runSearch(filters);
    };

    const limpiarFiltros = () => {
        clearFilters();
        setRows(null);
        setError("");
        setEmailError(false);
        setDateRangeError("");
        setLocalFilter("");
    };

    const verDetalle = (connId: string) => {
        try {
            sessionStorage.setItem(STATE_KEY, JSON.stringify({ filters, sortOrder }));
        } catch {
            // sin sessionStorage solo se pierde la restauración al volver
        }
        router.push(`/chats/${connId}`);
    };

    const visibleRows = useMemo(() => {
        if (!rows) return null;
        const q = localFilter.trim().toLowerCase();
        const filtered = q
            ? rows.filter((chat) =>
                [chat.conn_id, chat.customer_name, chat.customer_id, chat.customer_phone, chat.customer_email, chat.agent_name]
                    .some((v) => v?.toLowerCase().includes(q)))
            : rows;
        return [...filtered].sort((a, b) => {
            const diff = new Date(a.date).getTime() - new Date(b.date).getTime();
            return sortOrder === "desc" ? -diff : diff;
        });
    }, [rows, localFilter, sortOrder]);

    const descargarConversacion = async (connId: string) => {
        try {
            const data: any = await apiClient.get(`/api/v1/chats/${connId}`);
            downloadXLSX([toExcelRow({ ...data.summary, conn_id: connId })], `conversacion_${connId}.xlsx`, "Conversación");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error al descargar la conversación");
        }
    };

    const descargarTodas = () => {
        if (!visibleRows || visibleRows.length === 0) return;
        downloadXLSX(visibleRows.map(toExcelRow), `conversaciones_${getTodayString()}.xlsx`, "Conversaciones");
    };

    const columns = [
        {
            key: "customer_name",
            label: "Cliente",
            maxWidth: "16rem",
            render: (_: any, row: ChatRow) => (
                <Stack strong primary={row.customer_name || "Cliente desconocido"} secondary={row.customer_email} />
            ),
        },
        { key: "date", label: "Fecha", render: (value: any) => <DateTimeCell value={value} /> },
        {
            key: "customer_phone",
            label: "Teléfono",
            render: (_: any, row: ChatRow) => (
                <Stack primary={row.customer_phone} secondary={`Cliente ${row.customer_id || "—"}`} />
            ),
        },
        {
            key: "agent_name",
            label: "Agente",
            render: (_: any, row: ChatRow) => (
                <div className="flex items-center gap-2">
                    <Stack primary={row.agent_name} secondary={row.agent_id ? `Ext. ${row.agent_id}` : undefined} />
                    {row.is_transferred && (row.all_agents?.length ?? 0) > 1 && (
                        <span
                            className="pill bg-caution-soft text-caution"
                            title={row.all_agents!.join(" → ")}
                        >
                            <Repeat size={11} aria-hidden />
                            {row.all_agents!.length}
                        </span>
                    )}
                </div>
            ),
        },
        { key: "channel", label: "Canal", render: (value: any) => <Tag value={value} /> },
        {
            key: "feeling",
            label: "Sentimiento",
            render: (value: any) => {
                const f = FEELING[String(value ?? "").toLowerCase()];
                return <StatusPill value={f?.label ?? value} tone={f?.tone} />;
            },
        },
        { key: "conn_id", label: "ID conversación", secondary: true },
        { key: "chat_duration", label: "Duración", secondary: true },
        {
            key: "all_agents",
            label: "Recorrido de agentes",
            secondary: true,
            render: (value: any) => (Array.isArray(value) && value.length ? value.join(" → ") : "—"),
        },
        {
            key: "actions",
            label: "Acciones",
            render: (_: any, row: ChatRow) => (
                <div className="flex items-center justify-end gap-1.5">
                    <button
                        type="button"
                        onClick={() => descargarConversacion(row.conn_id)}
                        className="flex h-8 w-8 items-center justify-center rounded-full text-ink-400 transition-colors hover:bg-accent-50 hover:text-accent-600"
                        title="Descargar conversación"
                        aria-label="Descargar conversación"
                    >
                        <Download size={15} aria-hidden />
                    </button>
                    <RowAction label="Ver conversación" onClick={() => verDetalle(row.conn_id)} />
                </div>
            ),
        },
    ];

    return (
        <div className="mx-auto w-full max-w-[1800px] px-4 py-6 sm:px-6 lg:px-8">
            <PageHeader
                icon={MessagesSquare}
                title="Chats"
                description="Filtra conversaciones por ID, cliente, teléfono, email y rango de fechas."
            />

            <InfoCallout id="chats" title="¿Cómo buscar?">
                <ul className="space-y-1 list-disc list-inside">
                    <li>Puedes combinar <strong>todos los criterios</strong> (IDs, email, teléfono, fechas)</li>
                    <li>Todos los campos son <strong>opcionales</strong>, pero al menos uno debe tener valor</li>
                    <li><strong>Palabra clave:</strong> busca en el contenido del chat y datos del cliente (tiene prioridad sobre otros filtros)</li>
                    <li>Las fechas no pueden ser <strong>futuras</strong></li>
                    <li>Las conversaciones <strong>transferidas</strong> muestran cuántos agentes participaron</li>
                </ul>
            </InfoCallout>

            <Filters
                fields={filterFields}
                values={filters}
                onChange={(name, value) => {
                    updateFilter(name, value);
                    if (name === "customer_email") {
                        setEmailError(value !== "" && !validateEmailUtil(value));
                    }
                    if (name === "start_date" || name === "end_date") {
                        const start = name === "start_date" ? value : filters.start_date;
                        const end = name === "end_date" ? value : filters.end_date;
                        setDateRangeError(validateDateRangeUtil(start, end).error || "");
                    }
                }}
                onSubmit={buscarChats}
                onClear={limpiarFiltros}
                loading={loading}
                onCancel={cancelar}
            />

            {(emailError || dateRangeError) && (
                <InlineAlert>
                    {emailError && (
                        <span className="mb-1 block">
                            El formato del email no es válido. Verifica que no tenga espacios y siga el formato ejemplo@dominio.com
                        </span>
                    )}
                    {dateRangeError && <span className="block">{dateRangeError}</span>}
                </InlineAlert>
            )}

            <SearchResults
                columns={columns}
                results={visibleRows ? { data: visibleRows, total: visibleRows.length } : null}
                loading={loading}
                onCancel={cancelar}
                error={error}
                itemName="conversación"
                itemNamePlural="conversaciones"
                getRowId={(row) => row.conn_id}
                actions={
                    <>
                        <QuickFilter value={localFilter} onChange={setLocalFilter} placeholder="Filtrar por cliente, agente, email…" />
                        <SortToggle order={sortOrder} onChange={setSortOrder} />
                        <ExportButton onClick={descargarTodas} />
                    </>
                }
                emptyMessage={
                    localFilter
                        ? `Ninguna conversación coincide con "${localFilter}".`
                        : "No hay conversaciones que coincidan con los filtros de búsqueda."
                }
                emptyAction={
                    localFilter ? (
                        <button type="button" onClick={() => setLocalFilter("")} className="btn btn-secondary">
                            Quitar filtro rápido
                        </button>
                    ) : undefined
                }
            />
        </div>
    );
}

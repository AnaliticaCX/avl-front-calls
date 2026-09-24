"use client";

import { MessageSquareText } from "lucide-react";
import { useMemo, useState } from "react";
import { DateTimeCell, ExportButton, QuickFilter, SortToggle, Stack, Tag } from "../components/common/cells";
import Filters, { AGENT_EXTENSION_FIELD } from "../components/common/Filters";
import InfoCallout from "../components/common/InfoCallout";
import InlineAlert from "../components/common/InlineAlert";
import PageHeader from "../components/common/PageHeader";
import SearchResults from "../components/common/SearchResults";
import { useAbortable } from "../hooks/useAbortable";
import { useFilters } from "../hooks/useFilters";
import { SMSMessage, SmsSearchResponse } from "../types/sms";
import { apiClient, isAbortError } from "../utils/api";
import { downloadXLSX } from "../utils/download";
import { formatDate, formatTime, getTodayString } from "../utils/formatters";
import { validateDateRange as validateDateRangeUtil } from "../utils/validators";

interface SmsFilters {
    telefono: string;
    texto: string;
    customer_id: string;
    conn_id: string;
    agent_id: string;
    desde: string;
    hasta: string;
}

const EMPTY_FILTERS: SmsFilters = {
    telefono: "",
    texto: "",
    customer_id: "",
    conn_id: "",
    agent_id: "",
    desde: "",
    hasta: "",
};

export default function SmsPage() {
    const { filters, updateFilter, clearFilters } = useFilters<SmsFilters>(EMPTY_FILTERS);
    const [rows, setRows] = useState<SMSMessage[] | null>(null);
    const [loading, setLoading] = useState(false);
    const { begin, abort } = useAbortable();
    const cancelar = () => {
        abort();
        setLoading(false);
    };
    const [error, setError] = useState("");
    const [dateRangeError, setDateRangeError] = useState("");
    const [localFilter, setLocalFilter] = useState("");
    const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

    const filterFields = [
        { name: "telefono", label: "Teléfono", placeholder: "+57 300 123 4567" },
        { name: "texto", label: "Palabra clave en mensaje", placeholder: "Buscar en el contenido del mensaje" },
        { name: "customer_id", label: "Customer ID", placeholder: "ID del cliente" },
        { name: "conn_id", label: "Conn ID", placeholder: "Ej: 1234567890" },
        AGENT_EXTENSION_FIELD,
        { name: "desde", label: "Fecha Inicio", type: "date", max: getTodayString() },
        { name: "hasta", label: "Fecha Fin", type: "date", max: getTodayString() },
    ];

    const validateDateRange = (inicio?: string, fin?: string) => {
        const result = validateDateRangeUtil(inicio ?? filters.desde, fin ?? filters.hasta);
        setDateRangeError(result.error || "");
        return result.isValid;
    };

    const buscarSms = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!Object.values(filters).some(Boolean)) {
            setError("Debes ingresar al menos un criterio de búsqueda (teléfono, texto, ID o fechas)");
            return;
        }
        if (!validateDateRange()) {
            setError("Por favor corrige los errores en el formulario antes de buscar");
            return;
        }

        const signal = begin();
        setLoading(true);
        setError("");
        try {
            const data: SmsSearchResponse = await apiClient.get("/api/sms/search", {
                ...filters,
                order_by: sortOrder,
            }, signal);
            if (data.status === "error") {
                setError(data.detalle || "Error desconocido");
                setRows(null);
            } else {
                setRows(data.data ?? []);
                setLocalFilter("");
            }
        } catch (err) {
            if (isAbortError(err)) return;
            setError(err instanceof Error ? err.message : "Error al buscar SMS");
            setRows(null);
        } finally {
            if (!signal.aborted) setLoading(false);
        }
    };

    const limpiarFiltros = () => {
        clearFilters();
        setRows(null);
        setError("");
        setDateRangeError("");
        setLocalFilter("");
    };

    // Orden y filtro rápido se aplican sobre lo ya cargado, sin volver a consultar.
    const visibleRows = useMemo(() => {
        if (!rows) return null;
        const q = localFilter.trim().toLowerCase();
        const filtered = q
            ? rows.filter((sms) =>
                [sms.conn_id, sms.agent_name, sms.customer_id, sms.telephone, sms.message]
                    .some((v) => v?.toLowerCase().includes(q)))
            : rows;
        return [...filtered].sort((a, b) => {
            const diff = new Date(a.date).getTime() - new Date(b.date).getTime();
            return sortOrder === "desc" ? -diff : diff;
        });
    }, [rows, localFilter, sortOrder]);

    const descargarResultados = () => {
        if (!visibleRows || visibleRows.length === 0) return;
        const excelData = visibleRows.map((sms) => ({
            "Conn ID": sms.conn_id || "",
            Agente: sms.agent_name || "",
            "ID Agente": sms.agent_id || "",
            Fecha: sms.date ? formatDate(sms.date) : "",
            Hora: sms.date ? formatTime(sms.date) : "",
            Teléfono: sms.telephone || "",
            "Customer ID": sms.customer_id || "",
            Mensaje: sms.message || "",
            Canal: sms.channel || "",
        }));
        downloadXLSX(excelData, `sms_${getTodayString()}.xlsx`, "SMS");
    };

    const columns = [
        {
            key: "telephone",
            label: "Teléfono",
            render: (_: any, row: SMSMessage) => (
                <Stack strong primary={row.telephone} secondary={`Cliente ${row.customer_id || "—"}`} />
            ),
        },
        { key: "date", label: "Fecha", render: (value: any) => <DateTimeCell value={value} /> },
        {
            key: "message",
            label: "Mensaje",
            render: (value: any) =>
                value ? (
                    <p className="line-clamp-2 min-w-[18rem] max-w-md whitespace-normal leading-snug text-ink-600" title={value}>
                        {value}
                    </p>
                ) : (
                    <span className="text-ink-300">—</span>
                ),
        },
        {
            key: "agent_name",
            label: "Agente",
            render: (_: any, row: SMSMessage) => (
                <Stack primary={row.agent_name} secondary={row.agent_id ? `Ext. ${row.agent_id}` : undefined} />
            ),
        },
        { key: "channel", label: "Canal", render: (value: any) => <Tag value={value} /> },
        { key: "conn_id", label: "Conn ID", secondary: true },
        { key: "destiny", label: "Destino", secondary: true },
    ];

    return (
        <div className="mx-auto w-full max-w-[1800px] px-4 py-6 sm:px-6 lg:px-8">
            <PageHeader
                icon={MessageSquareText}
                title="SMS"
                description="Busca mensajes por teléfono, palabra clave o rango de fechas. Debes indicar al menos un criterio."
            />

            <InfoCallout id="sms" title="¿Cómo buscar?">
                <ul className="space-y-1 list-disc list-inside">
                    <li>Puedes combinar todos los criterios (teléfono, texto, IDs, fechas)</li>
                    <li>Debes proporcionar <strong>al menos un criterio</strong> para buscar</li>
                    <li>Las búsquedas son <strong>parciales</strong> (ejemplo: &quot;573&quot; encontrará &quot;573235256739&quot;)</li>
                    <li><strong>Fecha inicio:</strong> busca desde esa fecha hasta hoy</li>
                    <li><strong>Fecha fin:</strong> busca todo lo registrado hasta esa fecha</li>
                    <li>Las fechas no pueden ser <strong>futuras</strong></li>
                    <li>Con resultados, usa el <strong>filtro rápido</strong> para afinar sin volver a consultar</li>
                </ul>
            </InfoCallout>

            <Filters
                fields={filterFields}
                values={filters}
                onChange={(name, value) => {
                    updateFilter(name, value);
                    if (name === "desde" || name === "hasta") {
                        validateDateRange(name === "desde" ? value : undefined, name === "hasta" ? value : undefined);
                    }
                }}
                onSubmit={buscarSms}
                onClear={limpiarFiltros}
                loading={loading}
                onCancel={cancelar}
            />

            {dateRangeError && <InlineAlert>{dateRangeError}</InlineAlert>}

            <SearchResults
                columns={columns}
                results={visibleRows ? { data: visibleRows, total: visibleRows.length } : null}
                loading={loading}
                onCancel={cancelar}
                error={error}
                itemName="mensaje"
                getRowId={(row, i) => `${row.conn_id}-${i}`}
                actions={
                    <>
                        <QuickFilter value={localFilter} onChange={setLocalFilter} placeholder="Filtrar por teléfono, agente, texto…" />
                        <SortToggle order={sortOrder} onChange={setSortOrder} />
                        <ExportButton onClick={descargarResultados} />
                    </>
                }
                emptyMessage={
                    localFilter
                        ? `Ningún mensaje coincide con "${localFilter}".`
                        : "No hay mensajes SMS que coincidan con los criterios de búsqueda."
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

"use client";

import { Gauge } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import BackToCallsPanel from "../../components/calls/BackToCallsPanel";
import { DateTimeCell, DurationCell, ExportButton, RowAction, Stack, StatusPill, Tag } from "../../components/common/cells";
import Filters, { AGENT_EXTENSION_FIELD } from "../../components/common/Filters";
import InfoCallout from "../../components/common/InfoCallout";
import InlineAlert from "../../components/common/InlineAlert";
import PageHeader from "../../components/common/PageHeader";
import SearchResults from "../../components/common/SearchResults";
import { useFilters } from "../../hooks/useFilters";
import { usePagedSearch } from "../../hooks/usePagedSearch";
import { downloadXLSX } from "../../utils/download";
import { getTodayString } from "../../utils/formatters";
import { validateDateRange as validateDateRangeUtil } from "../../utils/validators";

interface CallFilters {
    conn_id: string;
    customer_id: string;
    telephone: string;
    type_call: string;
    agent_id: string;
    start_date: string;
    end_date: string;
    order_by: string;
}

export default function GeneralCallsPage() {
    const router = useRouter();
    const { results, loading, error, setError, cancel, run, reset, paging } = usePagedSearch('/api/calls/reporte_cdr/search');
    const { filters, updateFilter, clearFilters } = useFilters<CallFilters>({
        conn_id: '',
        customer_id: '',
        telephone: '',
        type_call: '',
        agent_id: '',
        start_date: '',
        end_date: '',
        order_by: 'desc'
    });
    const [dateRangeError, setDateRangeError] = useState("");

    const filterFields = [
        { name: 'conn_id', label: 'ID Conexión', placeholder: 'Ej: 1234567890' },
        { name: 'customer_id', label: 'ID Cliente', placeholder: 'ID del cliente' },
        { name: 'telephone', label: 'Teléfono', placeholder: '+57 300 123 4567' },
        { name: 'type_call', label: 'Tipo de Llamada', placeholder: 'Ej: ENTRANTE' },
        AGENT_EXTENSION_FIELD,
        { name: 'start_date', label: 'Fecha Inicio', type: 'date', max: getTodayString() },
        { name: 'end_date', label: 'Fecha Fin', type: 'date', max: getTodayString() }
    ];

    const validateDateRange = (inicio?: string, fin?: string) => {
        const result = validateDateRangeUtil(inicio ?? filters.start_date, fin ?? filters.end_date);
        setDateRangeError(result.error || "");
        return result.isValid;
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        const hasAnyField = filters.start_date || filters.end_date || filters.conn_id || filters.customer_id || filters.telephone || filters.type_call || filters.agent_id;
        if (!hasAnyField) {
            setError("Debes ingresar al menos un criterio de búsqueda.");
            return;
        }

        if (!validateDateRange()) {
            setError("Por favor corrige los errores en el formulario antes de buscar");
            return;
        }

        run({ ...filters });
    };

    const handleClear = () => {
        clearFilters();
        reset();
        setDateRangeError("");
    };

    const handleExportXLSX = () => {
        const rows = results?.data ?? [];
        if (rows.length === 0) return;
        downloadXLSX(rows, `reporte_cdr_${getTodayString()}.xlsx`, 'CDR');
    };

    const columns = [
        { key: 'date', label: 'Fecha', render: (value: any) => <DateTimeCell value={value} /> },
        {
            key: 'telephone',
            label: 'Teléfono',
            render: (_: any, row: any) => (
                <Stack strong primary={row.telephone} secondary={`Cliente ${row.customer_id || '—'}`} />
            )
        },
        {
            key: 'agent_name',
            label: 'Agente',
            render: (_: any, row: any) => (
                <Stack primary={row.agent_name} secondary={`Ext. ${row.agent_id || '—'}`} />
            )
        },
        { key: 'state', label: 'Tipo', render: (value: any) => <Tag value={value} /> },
        {
            key: 'description_cod_act',
            label: 'Tipificación',
            maxWidth: '16rem',
            render: (value: any, row: any) => (
                <Stack primary={value} secondary={row.cod_act ? `Código ${row.cod_act}` : undefined} />
            )
        },
        {
            key: 'duration_sec',
            label: 'Duración',
            render: (value: any, row: any) => (
                <DurationCell
                    seconds={value}
                    suffix={row.waiting_sec != null ? `Espera ${row.waiting_sec}s` : undefined}
                />
            )
        },
        { key: 'hang_up', label: 'Corte', render: (value: any) => <StatusPill value={value} /> },
        { key: 'conn_id', label: 'ID Conexión', secondary: true },
        { key: 'skill_id', label: 'Skill', secondary: true },
        { key: 'agent_dni', label: 'Cédula agente', secondary: true },
        { key: 'description_cod_act_2', label: 'Tipificación 2', secondary: true },
        { key: 'telephone_destination', label: 'Teléfono destino', secondary: true },
        { key: 'abandon', label: 'Abandono', secondary: true },
        { key: 'operation', label: 'Operación', secondary: true },
        {
            key: 'actions',
            label: 'Acciones',
            render: (_: any, row: any) => <RowAction onClick={() => router.push(`/calls/${row.conn_id}`)} />
        }
    ];

    return (
        <div className="mx-auto w-full max-w-[1800px] px-4 py-6 sm:px-6 lg:px-8">
            <div className="mb-6">
                <BackToCallsPanel />
            </div>

            <PageHeader
                icon={Gauge}
                title="Reporte CDR de Llamadas"
                description="Consulta el reporte general de llamadas."
            />

            <InfoCallout id="calls-general" title="¿Cómo buscar?">
                <ul className="space-y-1 list-disc list-inside">
                    <li>Puedes combinar <strong>todos los criterios</strong> (IDs, teléfono, fechas, etc.)</li>
                    <li>Todos los campos son <strong>opcionales</strong>, pero al menos uno debe tener valor</li>
                    <li><strong>Fecha inicio:</strong> busca desde esa fecha hasta hoy</li>
                    <li><strong>Fecha fin:</strong> busca todo lo registrado hasta esa fecha</li>
                    <li>Puedes usar ambas fechas para definir un rango específico</li>
                    <li>Las fechas no pueden ser <strong>futuras</strong></li>
                    <li>Los resultados incluyen llamadas <strong>transferidas</strong> agrupadas</li>
                </ul>
            </InfoCallout>

            <Filters
                fields={filterFields}
                values={filters}
                onChange={(name, value) => {
                    updateFilter(name, value);
                    if (name === 'start_date' || name === 'end_date') {
                        validateDateRange(
                            name === 'start_date' ? value : undefined,
                            name === 'end_date' ? value : undefined
                        );
                    }
                }}
                onSubmit={handleSearch}
                onClear={handleClear}
                loading={loading}
                onCancel={cancel}
            />

            {dateRangeError && <InlineAlert>{dateRangeError}</InlineAlert>}

            <SearchResults
                columns={columns}
                results={results}
                loading={loading}
                onCancel={cancel}
                error={error}
                paging={paging}
                itemName="llamada"
                actions={<ExportButton onClick={handleExportXLSX} />}
                emptyMessage="No hay llamadas que coincidan con los criterios de búsqueda."
            />
        </div>
    );
}

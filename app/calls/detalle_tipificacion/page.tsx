"use client";

import { Tags } from "lucide-react";
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

interface DetalleTipificacionFilters {
    conn_id: string;
    customer_id: string;
    telephone: string;
    agent_id: string;
    start_date: string;
    end_date: string;
    order_by: string;
}

export default function Page() {
    const router = useRouter();
    const { results, loading, error, setError, cancel, run, reset, paging } = usePagedSearch('/api/calls/detalle_tipificacion/search');
    const { filters, updateFilter, clearFilters } = useFilters<DetalleTipificacionFilters>({
        conn_id: '',
        customer_id: '',
        telephone: '',
        agent_id: '',
        start_date: '',
        end_date: '',
        order_by: 'desc'
    });
    const [dateRangeError, setDateRangeError] = useState("");

    const filterFields = [
        { name: 'conn_id', label: 'ID Conexión', placeholder: 'Ej: 1234567890' },
        { name: 'customer_id', label: 'ID Cliente', placeholder: 'ID Cliente' },
        { name: 'telephone', label: 'Teléfono', placeholder: '+57 300 123 4567' },
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
        setError('');

        const hasAnyField = filters.conn_id || filters.customer_id || filters.telephone || filters.agent_id || filters.start_date || filters.end_date;
        if (!hasAnyField) {
            setError('Debes ingresar al menos un criterio de búsqueda.');
            return;
        }

        if (!validateDateRange()) {
            setError('Por favor corrige los errores en el formulario antes de buscar');
            return;
        }

        run({ ...filters });
    };

    const handleClear = () => {
        clearFilters();
        reset();
        setDateRangeError('');
    };

    const handleExportXLSX = () => {
        const rows = results?.data ?? [];
        if (rows.length === 0) return;
        downloadXLSX(rows, `tipificacion_${getTodayString()}.xlsx`, 'Tipificación');
    };

    const columns = [
        {
            key: 'description_cod_act',
            label: 'Tipificación',
            maxWidth: '18rem',
            render: (value: any, row: any) => (
                <Stack strong primary={value} secondary={row.cod_act ? `Código ${row.cod_act}` : undefined} />
            )
        },
        { key: 'date', label: 'Fecha', render: (value: any) => <DateTimeCell value={value} /> },
        {
            key: 'telephone',
            label: 'Teléfono',
            render: (_: any, row: any) => (
                <Stack primary={row.telephone} secondary={`Cliente ${row.customer_id || '—'}`} />
            )
        },
        {
            key: 'agent_dni',
            label: 'Agente',
            render: (value: any, row: any) => (
                <Stack
                    primary={row.agent_id ? `Ext. ${row.agent_id}` : value}
                    secondary={[row.agent_id && value ? `CC ${value}` : null, row.skill_id ? `Skill ${row.skill_id}` : null]
                        .filter(Boolean)
                        .join(' · ') || undefined}
                />
            )
        },
        { key: 'type_interaction', label: 'Interacción', render: (value: any) => <Tag value={value} /> },
        { key: 'time', label: 'Duración', render: (value: any) => <DurationCell seconds={value} /> },
        { key: 'hang_up', label: 'Corte', render: (value: any) => <StatusPill value={value} /> },
        { key: 'conn_id', label: 'ID Conexión', secondary: true },
        {
            key: 'description_cod_act_2',
            label: 'Tipificación 2',
            secondary: true,
            render: (value: any, row: any) =>
                value ? `${value}${row.cod_act_2 ? ` (${row.cod_act_2})` : ''}` : '—'
        },
        { key: 'comments', label: 'Comentarios', secondary: true },
        { key: 'destiny', label: 'Destino', secondary: true },
        { key: 'campaign_id', label: 'Campaña', secondary: true },
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
                icon={Tags}
                title="Detalle Tipificación"
                description="Consulta el detalle de la tipificación de llamadas."
            />

            <InfoCallout id="calls-detalle_tipificacion" title="¿Cómo buscar?">
                <ul className="space-y-1 list-disc list-inside">
                    <li>Puedes combinar <strong>todos los criterios</strong> (IDs, agente, cliente, fechas, etc.)</li>
                    <li>Todos los campos son <strong>opcionales</strong>, pero al menos uno debe tener valor</li>
                    <li><strong>Fecha:</strong> busca por fecha de tipificación</li>
                    <li>Despliega una fila para ver comentarios, campaña y la segunda tipificación</li>
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
                itemName="tipificación"
                itemNamePlural="tipificaciones"
                actions={<ExportButton onClick={handleExportXLSX} />}
                emptyMessage="No hay tipificaciones que coincidan con los criterios de búsqueda."
            />
        </div>
    );
}

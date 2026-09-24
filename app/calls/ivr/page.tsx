"use client";

import { Headphones } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import BackToCallsPanel from "../../components/calls/BackToCallsPanel";
import { DateTimeCell, DurationCell, ExportButton, RowAction, Stack, StatusPill, Tag } from "../../components/common/cells";
import Filters from "../../components/common/Filters";
import InfoCallout from "../../components/common/InfoCallout";
import InlineAlert from "../../components/common/InlineAlert";
import PageHeader from "../../components/common/PageHeader";
import SearchResults from "../../components/common/SearchResults";
import { useFilters } from "../../hooks/useFilters";
import { usePagedSearch } from "../../hooks/usePagedSearch";
import { downloadXLSX } from "../../utils/download";
import { getTodayString } from "../../utils/formatters";
import { validateDateRange } from "../../utils/validators";

interface IVRCallFilters {
    conn_id: string;
    customer_id: string;
    ani: string;
    start_date: string;
    end_date: string;
    order_by: string;
}

export default function IVRCallsPage() {
    const [dateRangeError, setDateRangeError] = useState("");
    const router = useRouter();
    const { results, loading, error, setError, cancel, run, reset, paging } = usePagedSearch('/api/calls/detalle_llamadas_ivr/search');
    const { filters, updateFilter, clearFilters } = useFilters<IVRCallFilters>({
        conn_id: '',
        customer_id: '',
        ani: '',
        start_date: '',
        end_date: '',
        order_by: 'desc'
    });

    const filterFields = [
        { name: 'conn_id', label: 'Conn ID', placeholder: 'Ej: 1234567890' },
        { name: 'customer_id', label: 'Customer ID', placeholder: 'ID del cliente' },
        { name: 'ani', label: 'ANI', placeholder: 'Número ANI' },
        { name: 'start_date', label: 'Fecha Inicio', type: 'date', max: getTodayString() },
        { name: 'end_date', label: 'Fecha Fin', type: 'date', max: getTodayString() }
    ];

    const handleDateChange = (name: string, value: string) => {
        updateFilter(name, value);
        const start = name === 'start_date' ? value : filters.start_date;
        const end = name === 'end_date' ? value : filters.end_date;
        setDateRangeError(validateDateRange(start, end).error || "");
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        const dateValidation = validateDateRange(filters.start_date, filters.end_date);
        if (!dateValidation.isValid) {
            setDateRangeError(dateValidation.error || "");
            setError("Por favor corrige los errores en el formulario antes de buscar");
            return;
        }

        if (!filters.start_date && !filters.end_date && !filters.conn_id && !filters.customer_id && !filters.ani) {
            setError('Debes ingresar al menos un criterio de búsqueda.');
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
        downloadXLSX(rows, `ivr_${getTodayString()}.xlsx`, 'IVR');
    };

    const columns = [
        { key: 'date', label: 'Fecha', render: (value: any) => <DateTimeCell value={value} /> },
        {
            key: 'ani',
            label: 'ANI',
            render: (_: any, row: any) => (
                <Stack strong primary={row.ani} secondary={`Cliente ${row.customer_id || '—'}`} />
            )
        },
        {
            key: 'rp_name',
            label: 'Punto IVR',
            render: (value: any, row: any) => (
                <Stack primary={value} secondary={`ID ${row.rp_id ?? '—'}`} />
            )
        },
        { key: 'cod_opc_menu', label: 'Opción menú', render: (value: any) => <Tag value={value} /> },
        { key: 'result', label: 'Resultado', render: (value: any) => <StatusPill value={value} /> },
        { key: 'time', label: 'Duración', render: (value: any) => <DurationCell seconds={value} /> },
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
                icon={Headphones}
                title="Detalle de Llamadas IVR"
                description="Consulta las interacciones con el sistema IVR."
            />

            <InfoCallout id="calls-ivr" title="¿Cómo buscar?">
                <ul className="space-y-1 list-disc list-inside">
                    <li>Puedes combinar <strong>todos los criterios</strong> (IDs, ANI, fechas, etc.)</li>
                    <li>Todos los campos son <strong>opcionales</strong>, pero al menos uno debe tener valor</li>
                    <li><strong>Fecha inicio:</strong> busca desde esa fecha hasta hoy</li>
                    <li><strong>Fecha fin:</strong> busca todo lo registrado hasta esa fecha</li>
                    <li>Puedes usar ambas fechas para definir un rango específico</li>
                    <li>Las fechas no pueden ser <strong>futuras</strong></li>
                    <li>Los resultados incluyen interacciones <strong>transferidas</strong> agrupadas</li>
                </ul>
            </InfoCallout>

            <Filters
                fields={filterFields}
                values={filters}
                onChange={(name, value) => {
                    if (name === 'start_date' || name === 'end_date') handleDateChange(name, value);
                    else updateFilter(name, value);
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
                itemName="interacción"
                itemNamePlural="interacciones"
                actions={<ExportButton onClick={handleExportXLSX} />}
                emptyMessage="No hay interacciones IVR que coincidan con los criterios de búsqueda."
            />
        </div>
    );
}

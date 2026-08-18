"use client";

import Button from "../../components/Button";
import Breadcrumbs from "../../components/common/Breadcrumbs";
import EmptyState from "../../components/common/EmptyState";
import ErrorMessage from "../../components/common/ErrorMessage";
import Filters from "../../components/common/Filters";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import PageHeader from "../../components/common/PageHeader";
import Table from "../../components/common/Table";
import { useFilters } from "../../hooks/useFilters";
import { useSearch } from "../../hooks/useSearch";
import { LevantamientoRecord } from "../../types/quemadores";
import { downloadXLSX } from "../../utils/download";
import { formatDate, getTodayString } from "../../utils/formatters";

interface LevantamientoFilters {
    loan_numbers: string;
}

const ESTADO_STYLES: Record<string, string> = {
    'CON LEVANTAMIENTO': 'bg-green-100 text-green-700',
    'SIN LEVANTAMIENTO': 'bg-amber-100 text-amber-700',
    'NO INICIO PROCESO': 'bg-gray-100 text-gray-600',
    'VALIDAR CON JACOME': 'bg-blue-100 text-blue-700',
    'REVISAR': 'bg-red-100 text-red-700',
};

export default function LevantamientoDosrPage() {
    const { results, loading, error, search, setError } = useSearch('/api/quemadores/levantamiento_dosr/search');
    const { filters, updateFilter, clearFilters } = useFilters<LevantamientoFilters>({
        loan_numbers: '',
    });

    const filterFields = [
        { name: 'loan_numbers', label: 'Obligaciones', placeholder: 'Ej: 12345, 67890 (separadas por coma)' },
    ];

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!filters.loan_numbers.trim()) {
            setError('Debes ingresar al menos una obligación.');
            return;
        }

        search({ loan_numbers: filters.loan_numbers });
    };

    const handleClear = () => {
        clearFilters();
        setError('');
    };

    const handleExportXLSX = () => {
        const rows = (results?.data ?? []) as LevantamientoRecord[];
        if (rows.length === 0) return;
        downloadXLSX(rows, `levantamiento_dosr_${getTodayString()}.xlsx`, 'Levantamiento');
    };

    const columns = [
        { key: 'OBLIGACION', label: 'Obligación' },
        { key: 'ABOGADO', label: 'Abogado' },
        {
            key: 'FECHA_RADICACION',
            label: 'Fecha Radicación',
            render: (value: any) => (
                <div className="text-sm text-gray-900">{value ? formatDate(value) : '-'}</div>
            )
        },
        {
            key: 'FECHA_ORDEN',
            label: 'Fecha Orden',
            render: (value: any) => (
                <div className="text-sm text-gray-900">{value ? formatDate(value) : '-'}</div>
            )
        },
        {
            key: 'FECHA_LEVANTAMIENTO',
            label: 'Fecha Levantamiento',
            render: (value: any) => (
                <div className="text-sm text-gray-900">{value ? formatDate(value) : '-'}</div>
            )
        },
        {
            key: 'ESTADO',
            label: 'Estado',
            render: (value: any) => (
                <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${ESTADO_STYLES[value] || 'bg-gray-100 text-gray-600'}`}>
                    {value || '-'}
                </span>
            )
        },
    ];

    return (
        <div className="max-w-7xl mx-auto">
            <Breadcrumbs items={[
                { label: 'Quemadores', href: '/quemadores' },
                { label: 'Levantamiento DOSR', href: '/quemadores/levantamiento_dosr' }
            ]} />

            <PageHeader
                title="Levantamiento DOSR"
                description="Consulta el estado del proceso jurídico (radicación, orden y levantamiento de medidas) por número de obligación."
            />

            <Filters
                fields={filterFields}
                values={filters}
                onChange={(name, value) => updateFilter(name, value)}
                onSubmit={handleSearch}
                onClear={handleClear}
                loading={loading}
            />

            {loading && <LoadingSpinner text="Consultando levantamiento DOSR..." />}
            {error && <ErrorMessage message={error} />}

            {!loading && results && results.data && results.data.length > 0 && (
                <div>
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
                        <div className="text-sm text-gray-900 font-medium">
                            Registros recuperados: <span className="font-bold">{results.total}</span>
                        </div>
                        <Button text="Descargar Excel" onClick={handleExportXLSX} variant="secondary" />
                    </div>

                    <Table columns={columns} data={results.data} />
                </div>
            )}

            {!loading && results && results.data && results.data.length === 0 && (
                <EmptyState
                    title="No se encontraron resultados"
                    message="No hay registros de levantamiento DOSR para las obligaciones ingresadas."
                />
            )}
        </div>
    );
}

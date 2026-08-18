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
import { PazSalvoRecord } from "../../types/quemadores";
import { downloadXLSX } from "../../utils/download";
import { formatCurrency, formatDate, formatDateTime, getTodayString } from "../../utils/formatters";

interface PazSalvoFilters {
    loan_numbers: string;
}

export default function PazSalvoPage() {
    const { results, loading, error, search, setError } = useSearch('/api/quemadores/paz_salvo/search');
    const { filters, updateFilter, clearFilters } = useFilters<PazSalvoFilters>({
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
        const rows = (results?.data ?? []) as PazSalvoRecord[];
        if (rows.length === 0) return;
        downloadXLSX(rows, `paz_salvo_${getTodayString()}.xlsx`, 'PazSalvo');
    };

    const columns = [
        { key: 'obligacion', label: 'Obligación' },
        { key: 'tipo_documento', label: 'Tipo Doc.' },
        { key: 'documento', label: 'Documento' },
        { key: 'nombre_cliente', label: 'Cliente' },
        { key: 'email', label: 'Email' },
        { key: 'linea', label: 'Línea' },
        { key: 'placa', label: 'Placa' },
        { key: 'estado_obligacion', label: 'Estado Obligación' },
        { key: 'resultado_gestion', label: 'Resultado Gestión' },
        {
            key: 'fecha_gestion',
            label: 'Fecha Gestión',
            render: (value: any) => (
                <div className="text-sm text-gray-900">{value ? formatDateTime(value) : '-'}</div>
            )
        },
        {
            key: 'fecha_vencimiento',
            label: 'Fecha Vencimiento',
            render: (value: any) => (
                <div className="text-sm text-gray-900">{value ? formatDate(value) : '-'}</div>
            )
        },
        {
            key: 'valor_acuerdo',
            label: 'Valor Acuerdo',
            render: (value: any) => (
                <div className="text-sm text-gray-900">{formatCurrency(value)}</div>
            )
        },
        {
            key: 'valor_pagado_acuerdo',
            label: 'Valor Pagado Acuerdo',
            render: (value: any) => (
                <div className="text-sm text-gray-900">{formatCurrency(value)}</div>
            )
        },
        {
            key: 'diferencia',
            label: 'Diferencia',
            render: (value: any) => (
                <div className="text-sm text-gray-900">{formatCurrency(value)}</div>
            )
        },
    ];

    return (
        <div className="max-w-7xl mx-auto">
            <Breadcrumbs items={[
                { label: 'Quemadores', href: '/quemadores' },
                { label: 'Paz y Salvo', href: '/quemadores/paz_salvo' }
            ]} />

            <PageHeader
                title="Paz y Salvo"
                description="Consulta las gestiones, acuerdos de pago y valores pagados por número de obligación."
            />

            <Filters
                fields={filterFields}
                values={filters}
                onChange={(name, value) => updateFilter(name, value)}
                onSubmit={handleSearch}
                onClear={handleClear}
                loading={loading}
            />

            {loading && <LoadingSpinner text="Consultando paz y salvo..." />}
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
                    message="No hay registros de paz y salvo para las obligaciones ingresadas."
                />
            )}
        </div>
    );
}

"use client";

import { BadgeCheck } from "lucide-react";
import { ExportButton, loanStatusTone, Stack, StatusPill } from "../../components/common/cells";
import GestionObservation from "../../components/common/GestionObservation";
import Filters from "../../components/common/Filters";
import PageHeader from "../../components/common/PageHeader";
import SearchResults from "../../components/common/SearchResults";
import { useFilters } from "../../hooks/useFilters";
import { useSearch } from "../../hooks/useSearch";
import { PazSalvoRecord } from "../../types/quemadores";
import { downloadXLSX } from "../../utils/download";
import { formatCurrency, formatDate, formatDateTime, getTodayString } from "../../utils/formatters";

interface PazSalvoFilters {
    loan_numbers: string;
}

function Money({ value, tone }: { value: unknown; tone?: "positive" | "critical" }) {
    const color = tone === "positive" ? "text-positive" : tone === "critical" ? "text-critical" : "text-ink-700";
    return <span className={`tabular font-medium ${color}`}>{formatCurrency(value as number)}</span>;
}

export default function PazSalvoPage() {
    const { results, loading, error, search, setError, cancel, clear } = useSearch('/api/quemadores/paz_salvo/search');
    const { filters, updateFilter, clearFilters } = useFilters<PazSalvoFilters>({
        loan_numbers: '',
    });

    const filterFields = [
        { name: 'loan_numbers', label: 'Obligaciones', placeholder: 'Ej: 12345, 67890 (separadas por coma)' },
    ];

    const handleSearch = (e: React.FormEvent) => {
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
        clear();
    };

    const handleExportXLSX = () => {
        const rows = (results?.data ?? []) as PazSalvoRecord[];
        if (rows.length === 0) return;
        downloadXLSX(rows, `paz_salvo_${getTodayString()}.xlsx`, 'PazSalvo');
    };

    const columns = [
        {
            key: 'obligacion',
            label: 'Obligación',
            render: (value: any, row: any) => <Stack strong mono primary={value} secondary={row.linea} />
        },
        {
            key: 'nombre_cliente',
            label: 'Cliente',
            maxWidth: '16rem',
            render: (value: any, row: any) => (
                <Stack primary={value} secondary={`${row.tipo_documento ?? ''} ${row.documento ?? ''}`.trim() || undefined} />
            )
        },
        { key: 'estado_obligacion', label: 'Estado', render: (value: any) => <StatusPill value={value} tone={loanStatusTone(String(value))} /> },
        { key: 'resultado_gestion', label: 'Resultado gestión', render: (value: any) => <StatusPill value={value} /> },
        {
            key: 'fecha_gestion',
            label: 'Gestión',
            render: (value: any) => (value ? formatDateTime(value) : '—')
        },
        { key: 'valor_acuerdo', label: 'Acuerdo', align: 'right' as const, render: (value: any) => <Money value={value} /> },
        {
            key: 'valor_pagado_acuerdo',
            label: 'Pagado',
            align: 'right' as const,
            render: (value: any) => <Money value={value} tone="positive" />
        },
        {
            key: 'diferencia',
            label: 'Diferencia',
            align: 'right' as const,
            render: (value: any) => <Money value={value} tone={Number(value) > 0 ? "critical" : undefined} />
        },
        {
            key: 'cumple_condiciones',
            label: 'Cumple condiciones',
            render: (value: any) => (
                <StatusPill
                    value={value === 'Si' ? 'Sí' : value}
                    tone={value === 'Si' ? 'positive' : value === 'No' ? 'critical' : undefined}
                />
            )
        },
        { key: 'email', label: 'Email', secondary: true },
        { key: 'placa', label: 'Placa', secondary: true },
        { key: 'chasis', label: 'Chasis', secondary: true },
        { key: 'modelo', label: 'Modelo', secondary: true },
        { key: 'color', label: 'Color', secondary: true },
        { key: 'motor', label: 'Motor', secondary: true },
        {
            key: 'fecha_vencimiento',
            label: 'Vencimiento',
            secondary: true,
            render: (value: any) => (value ? formatDate(value) : '—')
        },
        {
            key: 'observacion_gestion',
            label: 'Observación gestión',
            secondary: true,
            wide: true,
            render: (value: any) => <GestionObservation text={value} />
        },
    ];

    return (
        <div className="mx-auto w-full max-w-[1800px] px-4 py-6 sm:px-6 lg:px-8">
            <PageHeader
                icon={BadgeCheck}
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
                onCancel={cancel}
            />

            <SearchResults
                columns={columns}
                results={results}
                loading={loading}
                onCancel={cancel}
                error={error}
                itemName="registro"
                getRowId={(row, i) => `${row.obligacion ?? ''}-${i}`}
                actions={<ExportButton onClick={handleExportXLSX} />}
                emptyMessage="No hay registros de paz y salvo para las obligaciones ingresadas."
            />
        </div>
    );
}

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
import { ContactoRecord } from "../../types/quemadores";
import { downloadXLSX } from "../../utils/download";
import { getTodayString } from "../../utils/formatters";

interface ContactosFilters {
    loan_numbers: string;
}

export default function ContactosPage() {
    const { results, loading, error, search, setError } = useSearch('/api/quemadores/contactos/search');
    const { filters, updateFilter, clearFilters } = useFilters<ContactosFilters>({
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
        const rows = (results?.data ?? []) as ContactoRecord[];
        if (rows.length === 0) return;
        downloadXLSX(rows, `contactos_${getTodayString()}.xlsx`, 'Contactos');
    };

    const columns = [
        { key: 'obligacion_id', label: 'Obligación' },
        { key: 'client_name', label: 'Cliente' },
        { key: 'client_type_contact', label: 'Relación' },
        { key: 'client_name_contact', label: 'Nombre Contacto' },
        { key: 'contact_type', label: 'Tipo Contacto' },
        { key: 'contact_information', label: 'Contacto' },
        { key: 'obligacion_status', label: 'Estado Obligación' },
        { key: 'ingest_date', label: 'Fecha Ingreso' },
    ];

    return (
        <div className="max-w-7xl mx-auto">
            <Breadcrumbs items={[
                { label: 'Quemadores', href: '/quemadores' },
                { label: 'Contactos', href: '/quemadores/contactos' }
            ]} />

            <PageHeader
                title="Contactos"
                description="Consulta los teléfonos y correos asociados a una obligación."
            />

            <Filters
                fields={filterFields}
                values={filters}
                onChange={(name, value) => updateFilter(name, value)}
                onSubmit={handleSearch}
                onClear={handleClear}
                loading={loading}
            />

            {loading && <LoadingSpinner text="Consultando contactos..." />}
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
                    message="No hay contactos registrados para las obligaciones ingresadas."
                />
            )}
        </div>
    );
}

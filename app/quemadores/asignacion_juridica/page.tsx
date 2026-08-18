"use client";

import Button from "../../components/Button";
import Breadcrumbs from "../../components/common/Breadcrumbs";
import EmptyState from "../../components/common/EmptyState";
import ErrorMessage from "../../components/common/ErrorMessage";
import Filters from "../../components/common/Filters";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import PageHeader from "../../components/common/PageHeader";
import Pagination from "../../components/common/Pagination";
import Table from "../../components/common/Table";
import { useFilters } from "../../hooks/useFilters";
import { usePagination } from "../../hooks/usePagination";
import { useSearch } from "../../hooks/useSearch";
import { AsignacionJuridicaRecord } from "../../types/quemadores";
import { downloadXLSX } from "../../utils/download";
import { formatCurrency, formatDateTime, getTodayString } from "../../utils/formatters";

interface AsignacionJuridicaFilters {
    loan_numbers: string;
    page: number;
    per_page: number;
}

export default function AsignacionJuridicaPage() {
    const { results, loading, error, search, setError } = useSearch('/api/quemadores/asignacion_juridica/search');
    const { filters, updateFilter, clearFilters } = useFilters<AsignacionJuridicaFilters>({
        loan_numbers: '',
        page: 1,
        per_page: 50,
    });
    const { currentPage, itemsPerPage, totalPages, handlePageChange, handlePerPageChange } = usePagination(
        results?.total,
        filters.per_page
    );

    const filterFields = [
        { name: 'loan_numbers', label: 'Obligaciones (vacío = todas)', placeholder: 'Ej: 12345, 67890 (separadas por coma)' },
    ];

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        search({
            loan_numbers: filters.loan_numbers,
            page: currentPage,
            per_page: itemsPerPage,
        });
    };

    const handleClear = () => {
        clearFilters();
        setError('');
    };

    const handlePageChangeWrapper = async (page: number) => {
        handlePageChange(page);
        search({
            loan_numbers: filters.loan_numbers,
            page,
            per_page: itemsPerPage,
        });
    };

    const handleExportXLSX = () => {
        const rows = (results?.data ?? []) as AsignacionJuridicaRecord[];
        if (rows.length === 0) return;
        downloadXLSX(rows, `asignacion_juridica_${getTodayString()}.xlsx`, 'AsignacionJuridica');
    };

    const columns = [
        { key: 'obligacion', label: 'Obligación' },
        { key: 'cedula', label: 'Cédula' },
        { key: 'nombre_cliente', label: 'Cliente' },
        { key: 'acreedor', label: 'Acreedor' },
        { key: 'ciudad_correspondida', label: 'Ciudad' },
        { key: 'departamento', label: 'Departamento' },
        { key: 'otro_si', label: 'Otro Sí' },
        {
            key: 'fecha_ejecucion_aval',
            label: 'Fecha Ejecución Aval',
            render: (value: any) => (
                <div className="text-sm text-gray-900">{value ? formatDateTime(value) : '-'}</div>
            )
        },
        { key: 'placa', label: 'Placa' },
        { key: 'direccion', label: 'Dirección' },
        {
            key: 'valor_desembolso',
            label: 'Valor Desembolso',
            render: (value: any) => (
                <div className="text-sm text-gray-900">{formatCurrency(value)}</div>
            )
        },
        {
            key: 'valor_ejecutado_aval',
            label: 'Valor Ejecutado Aval',
            render: (value: any) => (
                <div className="text-sm text-gray-900">{formatCurrency(value)}</div>
            )
        },
        { key: 'correo', label: 'Correo' },
        { key: 'marca', label: 'Marca' },
        { key: 'referencia', label: 'Referencia' },
        { key: 'dni_codeudor', label: 'DNI Codeudor' },
        { key: 'nombre_codeudor', label: 'Nombre Codeudor' },
        { key: 'producto', label: 'Producto' },
    ];

    return (
        <div className="max-w-7xl mx-auto">
            <Breadcrumbs items={[
                { label: 'Quemadores', href: '/quemadores' },
                { label: 'Asignación Jurídica', href: '/quemadores/asignacion_juridica' }
            ]} />

            <PageHeader
                title="Asignación Jurídica"
                description="Consulta la cartera ejecutada asignada a jurídico. Deja el campo de obligaciones vacío para traer todas."
            />

            <Filters
                fields={filterFields}
                values={filters}
                onChange={(name, value) => updateFilter(name, value)}
                onSubmit={handleSearch}
                onClear={handleClear}
                loading={loading}
            />

            {loading && <LoadingSpinner text="Consultando asignación jurídica..." />}
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

                    <div className="mt-6 flex flex-col items-center gap-2">
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            totalItems={results.total}
                            perPage={itemsPerPage}
                            onPageChange={handlePageChangeWrapper}
                            onPerPageChange={handlePerPageChange}
                        />
                        <div className="text-sm text-gray-700 mt-2">
                            Página {currentPage} de {totalPages}
                        </div>
                        <div className="text-sm text-gray-500">
                            Mostrando {results.data.length} de {results.total} registros
                        </div>
                    </div>
                </div>
            )}

            {!loading && results && results.data && results.data.length === 0 && (
                <EmptyState
                    title="No se encontraron resultados"
                    message="No hay registros de asignación jurídica para los criterios ingresados."
                />
            )}
        </div>
    );
}

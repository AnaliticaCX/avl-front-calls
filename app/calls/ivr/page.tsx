"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Button from "../../components/Button";
import BackToCallsPanel from "../../components/calls/BackToCallsPanel";
import Breadcrumbs from "../../components/common/Breadcrumbs";
import EmptyState from "../../components/common/EmptyState";
import ErrorMessage from "../../components/common/ErrorMessage";
import Filters from "../../components/common/Filters";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import PageHeader from "../../components/common/PageHeader";
import Pagination from "../../components/common/Pagination";
import Table from "../../components/common/Table";
import { useFilters } from "../../hooks/useFilters";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import { usePagination } from "../../hooks/usePagination";
import { useSearch } from "../../hooks/useSearch";
import { formatDate, formatTime, getTodayString } from "../../utils/formatters";
import { validateDateRange } from "../../utils/validators";

interface IVRCallFilters {
    conn_id: string;
    customer_id: string;
    ani: string;
    start_date: string;
    end_date: string;
    page: number;
    per_page: number;
    order_by: string;
}

export default function IVRCallsPage() {
    const [showNote, setShowNote] = useLocalStorage('calls-ivr-hide-note', false);
    const [dateRangeError, setDateRangeError] = useState("");
    const router = useRouter();
    const { results, loading, error, search, setError } = useSearch('/api/calls/detalle_llamadas_ivr/search');
    const { filters, updateFilter, clearFilters } = useFilters<IVRCallFilters>({
        conn_id: '',
        customer_id: '',
        ani: '',
        start_date: '',
        end_date: '',
        page: 1,
        per_page: 50,
        order_by: 'desc'
    });
    const { currentPage, itemsPerPage, totalPages, handlePageChange, handlePerPageChange } = usePagination(
        results?.total,
        filters.per_page
    );

    const filterFields = [
        { name: 'conn_id', label: 'Conn ID', placeholder: 'Ej: 1234567890' },
        { name: 'customer_id', label: 'Customer ID', placeholder: 'ID del cliente' },
        { name: 'ani', label: 'ANI', placeholder: 'Número ANI' },
        { name: 'start_date', label: 'Fecha Inicio', type: 'date', max: getTodayString(), error: !!dateRangeError && !!filters.start_date },
        { name: 'end_date', label: 'Fecha Fin', type: 'date', max: getTodayString(), error: !!dateRangeError && !!filters.end_date }
    ];

    // Validación en tiempo real de fechas
    const handleDateChange = (name: string, value: string) => {
        updateFilter(name, value);
        let start = name === 'start_date' ? value : filters.start_date;
        let end = name === 'end_date' ? value : filters.end_date;
        const result = validateDateRange(start, end);
        setDateRangeError(result.error || "");
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        // Validar fechas antes de buscar
        const dateValidation = validateDateRange(filters.start_date, filters.end_date);
        if (!dateValidation.isValid) {
            setDateRangeError(dateValidation.error || "");
            setError("Por favor corrige los errores en el formulario antes de buscar");
            return;
        }

        // Leer valores directamente del formulario
        let formValues: Record<string, any> = { ...filters };
        if (e && e.target && (e.target as HTMLFormElement).elements) {
            const elements = (e.target as HTMLFormElement).elements;
            filterFields.forEach(field => {
                const input = elements.namedItem(field.name) as HTMLInputElement;
                if (input) formValues[field.name] = input.value;
            });
        }
        if (!formValues.start_date && !formValues.end_date && !formValues.conn_id && !formValues.customer_id && !formValues.ani) {
            setError('Debes ingresar al menos un criterio de búsqueda.');
            return;
        }

        search({
            ...formValues,
            page: currentPage,
            per_page: itemsPerPage
        });
    };

    const handleClear = () => {
        clearFilters();
        setError('');
        setDateRangeError('');
    };

    const handlePageChangeWrapper = async (page: number) => {
        handlePageChange(page);
        search({
            ...filters,
            page,
            per_page: itemsPerPage
        });
    };

    const columns = [
        {
            key: 'rp_name',
            label: 'RP Name',
            render: (value: any, row: any) => (
                <div>
                    <div className="text-sm font-medium text-gray-900">{value || '-'}</div>
                    <div className="text-xs text-gray-500">ID: {row.rp_id || '-'}</div>
                </div>
            )
        },
        {
            key: 'date',
            label: 'Fecha',
            render: (value: any) => (
                <div>
                    <div className="text-sm text-gray-900">{value ? formatDate(value) : '-'}</div>
                    <div className="text-xs text-gray-500">{value ? formatTime(value) : ''}</div>
                </div>
            )
        },
        {
            key: 'ani',
            label: 'ANI',
            render: (_: any, row: any) => (
                <div>
                    <div className="text-sm text-gray-900">{row.ani || '-'}</div>
                    <div className="text-xs text-gray-500">Cliente: {row.customer_id || '-'}</div>
                </div>
            )
        },
        {
            key: 'cod_opc_menu',
            label: 'Opción Menú',
            render: (value: any) => (
                <div className="text-sm text-gray-900">{value || '-'}</div>
            )
        },
        {
            key: 'result',
            label: 'Resultado',
            render: (value: any) => (
                <div className="text-sm text-gray-900">{value || '-'}</div>
            )
        },
        {
            key: 'time',
            label: 'Tiempo',
            render: (value: any) => (
                <div className="text-sm text-gray-900">{value || '-'}</div>
            )
        },
        {
            key: 'actions',
            label: 'Acciones',
            render: (_: any, row: any) => (
                <Button
                    text="Ver Detalle"
                    onClick={() => router.push(`/calls/${row.conn_id}`)}
                    variant="secondary"
                />
            )
        }
    ];

    return (
        <div className="max-w-7xl mx-auto">
            <div className="mb-6">
                <BackToCallsPanel />
            </div>

            <Breadcrumbs items={[
                { label: 'Llamadas', href: '/calls' },
                { label: 'IVR', href: '/calls/ivr' }
            ]} />

            <PageHeader
                title="Detalle de Llamadas IVR"
                description="Consulta las interacciones con el sistema IVR."
            />

            {!showNote && (
                <div className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-400 rounded-r-lg relative">
                    <button
                        onClick={() => setShowNote(true)}
                        className="absolute top-3 right-3 text-blue-600 hover:text-blue-800 transition-colors"
                        title="Cerrar nota"
                        type="button"
                    >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </button>
                    <div className="flex items-start">
                        <svg className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 1 1 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        <div className="text-sm text-blue-900 pr-6">
                            <p className="font-semibold mb-2">¿Cómo buscar?</p>
                            <ul className="space-y-1 list-disc list-inside">
                                <li>Puedes combinar <strong>todos los criterios</strong> (IDs, ANI, fechas, etc.)</li>
                                <li>Todos los campos son <strong>opcionales</strong>, pero al menos uno debe tener valor</li>
                                <li><strong>Fecha inicio:</strong> busca desde esa fecha hasta hoy</li>
                                <li><strong>Fecha fin:</strong> busca todo lo registrado hasta esa fecha</li>
                                <li>Puedes usar ambas fechas para definir un rango específico</li>
                                <li>Las fechas no pueden ser <strong>futuras</strong></li>
                                <li>Los resultados incluyen interacciones <strong>transferidas</strong> agrupadas</li>
                            </ul>
                        </div>
                    </div>
                </div>
            )}

            <Filters
                fields={filterFields}
                values={filters}
                onChange={(name, value) => {
                    if (name === 'start_date' || name === 'end_date') {
                        handleDateChange(name, value);
                    } else {
                        updateFilter(name, value);
                    }
                }}
                onSubmit={handleSearch}
                onClear={handleClear}
                loading={loading}
            />

            {dateRangeError && (
                <div className="mb-6 p-3 bg-red-50 border-l-4 border-red-500 rounded-r-lg">
                    <div className="flex items-start">
                        <svg className="w-5 h-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        <div className="text-sm text-red-800">
                            <p className="font-medium">{dateRangeError}</p>
                        </div>
                    </div>
                </div>
            )}

            {loading && <LoadingSpinner text="Cargando resultados..." />}
            {error && <ErrorMessage message={error} />}

            {!loading && results && results.data && results.data.length > 0 && (
                <div>
                    <div className="mb-4 text-sm text-gray-900 font-medium">
                        Registros recuperados: <span className="font-bold">{results.total}</span>
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
                            Mostrando {results.data.length} de {results.total} interacciones IVR
                        </div>
                    </div>
                </div>
            )}

            {!loading && results && results.data && results.data.length === 0 && (
                <EmptyState
                    title="No se encontraron resultados"
                    message="No hay interacciones IVR que coincidan con los criterios de búsqueda."
                />
            )}
        </div>
    );
}

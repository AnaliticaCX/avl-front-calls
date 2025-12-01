
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
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
import { formatDate, getTodayString } from "../../utils/formatters";
import { validateDateRange as validateDateRangeUtil } from "../../utils/validators";

interface DetalleTipificacionFilters {
    conn_id: string;
    customer_id: string;
    telephone: string;
    start_date: string;
    end_date: string;
    page: number;
    per_page: number;
    order_by: string;
}

export default function Page() {
    const router = useRouter();
    const { results, loading, error, search, setError } = useSearch('/api/calls/detalle_tipificacion/search');
    const { filters, updateFilter, clearFilters } = useFilters<DetalleTipificacionFilters>({
        conn_id: '',
        customer_id: '',
        telephone: '',
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
    const [showNote, setShowNote] = useLocalStorage('calls-detalle-tipificacion-hide-note', false);
    const [dateRangeError, setDateRangeError] = useState("");

    const filterFields = [
        { name: 'conn_id', label: 'ID Conexión', placeholder: 'Ej: 1234567890' },
        { name: 'customer_id', label: 'ID Cliente', placeholder: 'ID Cliente' },
        { name: 'telephone', label: 'Teléfono', placeholder: '+57 300 123 4567' },
        { name: 'start_date', label: 'Fecha Inicio', type: 'date', max: getTodayString() },
        { name: 'end_date', label: 'Fecha Fin', type: 'date', max: getTodayString() }
    ];

    const validateDateRange = (inicio?: string, fin?: string) => {
        const startDate = inicio !== undefined ? inicio : filters.start_date;
        const endDate = fin !== undefined ? fin : filters.end_date;

        const result = validateDateRangeUtil(startDate, endDate);
        setDateRangeError(result.error || "");
        return result.isValid;
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validar que al menos un campo tenga valor
        const hasAnyField = filters.conn_id || filters.customer_id || filters.telephone || filters.start_date || filters.end_date;
        if (!hasAnyField) {
            setError('Debes ingresar al menos un criterio de búsqueda.');
            return;
        }

        if (!validateDateRange()) {
            setError('Por favor corrige los errores en el formulario antes de buscar');
            return;
        }

        search({
            ...filters,
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
        { key: 'conn_id', label: 'ID Conexión' },
        { key: 'agent_dni', label: 'Cédula Agente' },
        { key: 'skill_id', label: 'Skill' },
        { key: 'date', label: 'Fecha', render: (value: any) => value ? formatDate(value) : '-' },
        { key: 'cod_act', label: 'Código Act.' },
        { key: 'description_cod_act', label: 'Descripción Act.' },
        { key: 'cod_act_2', label: 'Código Act. 2' },
        { key: 'description_cod_act_2', label: 'Descripción Act. 2' },
        { key: 'comments', label: 'Comentarios' },
        { key: 'type_interaction', label: 'Tipo Interacción' },
        { key: 'telephone', label: 'Teléfono' },
        { key: 'destiny', label: 'Destino' },
        { key: 'time', label: 'Duración' },
        { key: 'hang_up', label: 'Corte' },
        { key: 'customer_id', label: 'ID Cliente' },
        { key: 'campaign_id', label: 'Campaña' },
        { key: 'ingest_date', label: 'Fecha Ingesta', render: (value: any) => value ? formatDate(value) : '-' }
    ];

    return (
        <div className="max-w-7xl mx-auto">
            <div className="mb-6">
                <BackToCallsPanel />
            </div>

            <Breadcrumbs items={[
                { label: 'Llamadas', href: '/calls' },
                { label: 'Detalle Tipificación', href: '/calls/detalle_tipificacion' }
            ]} />

            <PageHeader
                title="Detalle Tipificación"
                description="Consulta el detalle de la tipificación de llamadas."
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
                                <li>Puedes combinar <strong>todos los criterios</strong> (IDs, agente, cliente, fechas, etc.)</li>
                                <li>Todos los campos son <strong>opcionales</strong>, pero al menos uno debe tener valor</li>
                                <li><strong>Fecha:</strong> busca por fecha de tipificación</li>
                                <li>Los resultados incluyen todas las tipificaciones registradas</li>
                            </ul>
                        </div>
                    </div>
                </div>
            )}

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
            />

            {dateRangeError && (
                <div className="mb-6 p-3 bg-red-50 border-l-4 border-red-500 rounded-r-lg">
                    <div className="flex items-start">
                        <svg className="w-5 h-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        <p className="text-sm text-red-800 font-medium">
                            {dateRangeError}
                        </p>
                    </div>
                </div>
            )}

            {loading && <LoadingSpinner text="Cargando resultados..." />}
            {error && <ErrorMessage message={error} />}

            {!loading && results && results.data && results.data.length > 0 && (
                <div>
                    <div className="mb-4 text-sm text-gray-900 font-medium">
                        Records found: <span className="font-bold">{results.total}</span>
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
                            Page {currentPage} of {totalPages}
                        </div>
                        <div className="text-sm text-gray-500">
                            Mostrando {results.data.length} de {results.total} tipificaciones
                        </div>
                    </div>
                </div>
            )}

            {!loading && results && results.data && results.data.length === 0 && (
                <EmptyState
                    title="No results found"
                    message="No hay tipificaciones que coincidan con los criterios de búsqueda."
                />
            )}
        </div>
    );
}


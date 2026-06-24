"use client";

import { useState } from "react";
import Button from "../components/Button";
import Breadcrumbs from "../components/common/Breadcrumbs";
import EmptyState from "../components/common/EmptyState";
import ErrorMessage from "../components/common/ErrorMessage";
import Filters from "../components/common/Filters";
import LoadingSpinner from "../components/common/LoadingSpinner";
import PageHeader from "../components/common/PageHeader";
import Pagination from "../components/common/Pagination";
import Table from "../components/common/Table";
import { useFilters } from "../hooks/useFilters";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { usePagination } from "../hooks/usePagination";
import { useSearch } from "../hooks/useSearch";
import { Cdr9Record } from "../types/cdr";
import { downloadEmailPDF, downloadPDF, downloadXLSX, PdfColumn } from "../utils/download";
import { formatDate, formatDateTime, getTodayString } from "../utils/formatters";
import { validateDateRange as validateDateRangeUtil } from "../utils/validators";

interface EmailFilters {
    sent_from: string;
    sent_to: string;
    subject: string;
    channel: string;
    start_date: string;
    end_date: string;
    page: number;
    per_page: number;
    order_by: string;
}

const EXPORT_COLUMNS: PdfColumn[] = [
    { key: "date", label: "Fecha" },
    { key: "sent_from", label: "Remitente" },
    { key: "sent_to", label: "Destinatario" },
    { key: "subject", label: "Asunto" },
    { key: "channel", label: "Canal" },
    { key: "body", label: "Cuerpo" },
];

export default function EmailReportPage() {
    const [showNote, setShowNote] = useLocalStorage('emails-hide-note', false);
    const [dateRangeError, setDateRangeError] = useState("");
    const [selectedEmail, setSelectedEmail] = useState<Cdr9Record | null>(null);
    const { results, loading, error, search, setError } = useSearch('/api/mails/detalle_correos/search');
    const { filters, updateFilter, clearFilters } = useFilters<EmailFilters>({
        sent_from: '',
        sent_to: '',
        subject: '',
        channel: '',
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
        { name: 'sent_from', label: 'Remitente (De)', placeholder: 'correo@dominio.com' },
        { name: 'sent_to', label: 'Destinatario (Para)', placeholder: 'correo@dominio.com' },
        { name: 'subject', label: 'Asunto', placeholder: 'Texto del asunto' },
        { name: 'channel', label: 'Canal', placeholder: 'Ej: email-route-61321' },
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

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const hasAnyField = filters.sent_from || filters.sent_to || filters.subject ||
            filters.channel || filters.start_date || filters.end_date;
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

    const handleExportXLSX = () => {
        const rows = (results?.data ?? []) as Cdr9Record[];
        if (rows.length === 0) return;
        downloadXLSX(rows, `correos_${getTodayString()}.xlsx`, 'Correos');
    };

    const handleExportPDF = () => {
        const rows = (results?.data ?? []) as Cdr9Record[];
        if (rows.length === 0) return;
        downloadPDF(rows as Record<string, any>[], EXPORT_COLUMNS, {
            title: 'Detalle de Correos',
            subtitle: 'Reporte del visor histórico de comunicaciones',
            filename: `correos_${getTodayString()}`
        });
    };

    const truncate = (value: string | null, max = 60) => {
        if (!value) return '-';
        return value.length > max ? `${value.slice(0, max)}…` : value;
    };

    const columns = [
        {
            key: 'date',
            label: 'Fecha',
            render: (value: any) => (
                <div className="text-sm text-gray-900">{value ? formatDate(value) : '-'}</div>
            )
        },
        {
            key: 'sent_from',
            label: 'Remitente',
            render: (value: any) => (
                <div className="text-sm text-gray-900">{value || '-'}</div>
            )
        },
        {
            key: 'sent_to',
            label: 'Destinatario',
            render: (value: any) => (
                <div className="text-sm text-gray-900">{value || '-'}</div>
            )
        },
        {
            key: 'subject',
            label: 'Asunto',
            render: (value: any) => (
                <div className="text-sm text-gray-900">{truncate(value)}</div>
            )
        },
        {
            key: 'channel',
            label: 'Canal',
            render: (value: any) => (
                <div className="text-xs text-gray-500">{value || '-'}</div>
            )
        },
        {
            key: 'actions',
            label: 'Acciones',
            render: (_: any, row: any) => (
                <Button
                    text="Ver Detalle"
                    onClick={() => setSelectedEmail(row as Cdr9Record)}
                    variant="secondary"
                />
            )
        }
    ];

    return (
        <div className="max-w-7xl mx-auto">
            <Breadcrumbs items={[
                { label: 'Correos', href: '/emails' }
            ]} />

            <PageHeader
                title="Detalle de Correos"
                description="Consulta los correos del canal por remitente, destinatario, asunto, canal o rango de fechas."
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
                                <li>Puedes combinar <strong>todos los criterios</strong> (remitente, destinatario, asunto, canal, fechas)</li>
                                <li>Todos los campos son <strong>opcionales</strong>, pero al menos uno debe tener valor</li>
                                <li><strong>Remitente / Destinatario:</strong> admiten coincidencias parciales del correo</li>
                                <li><strong>Fecha inicio:</strong> busca desde esa fecha hasta hoy</li>
                                <li><strong>Fecha fin:</strong> busca todo lo registrado hasta esa fecha</li>
                                <li>Las fechas no pueden ser <strong>futuras</strong></li>
                                <li>Puedes descargar los resultados en <strong>Excel</strong> o <strong>PDF</strong></li>
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
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
                        <div className="text-sm text-gray-900 font-medium">
                            Registros recuperados: <span className="font-bold">{results.total}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button text="Descargar Excel" onClick={handleExportXLSX} variant="secondary" />
                            <Button text="Descargar PDF" onClick={handleExportPDF} variant="primary" />
                        </div>
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
                            Mostrando {results.data.length} de {results.total} correos
                        </div>
                    </div>
                </div>
            )}

            {!loading && results && results.data && results.data.length === 0 && (
                <EmptyState
                    title="No se encontraron resultados"
                    message="No hay correos que coincidan con los criterios de búsqueda."
                />
            )}

            {selectedEmail && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
                    onClick={() => setSelectedEmail(null)}
                >
                    <div
                        className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-start justify-between gap-4 p-6 border-b border-gray-200">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">
                                    {selectedEmail.subject || '(Sin asunto)'}
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">
                                    {selectedEmail.date ? formatDate(selectedEmail.date) : '-'}
                                    {selectedEmail.channel ? ` · ${selectedEmail.channel}` : ''}
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedEmail(null)}
                                className="text-gray-400 hover:text-gray-700 transition-colors flex-shrink-0"
                                title="Cerrar"
                                type="button"
                            >
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto">
                            <div className="grid sm:grid-cols-2 gap-4 mb-4 text-sm">
                                <div>
                                    <span className="block text-xs font-semibold text-gray-500 uppercase">De</span>
                                    <span className="text-gray-900">{selectedEmail.sent_from || '-'}</span>
                                </div>
                                <div>
                                    <span className="block text-xs font-semibold text-gray-500 uppercase">Para</span>
                                    <span className="text-gray-900">{selectedEmail.sent_to || '-'}</span>
                                </div>
                                <div>
                                    <span className="block text-xs font-semibold text-gray-500 uppercase">Ingestado</span>
                                    <span className="text-gray-900">
                                        {selectedEmail.ingested_at ? formatDateTime(selectedEmail.ingested_at) : '-'}
                                    </span>
                                </div>
                            </div>
                            <div>
                                <span className="block text-xs font-semibold text-gray-500 uppercase mb-2">Cuerpo</span>
                                <pre className="text-sm text-gray-800 whitespace-pre-wrap break-words font-sans bg-gray-50 p-4 rounded-lg border border-gray-200">
                                    {selectedEmail.body || '(Sin contenido)'}
                                </pre>
                            </div>
                        </div>
                        <div className="p-4 border-t border-gray-200 flex justify-end gap-3">
                            <Button text="Cerrar" onClick={() => setSelectedEmail(null)} variant="secondary" />
                            <Button
                                text="Descargar PDF"
                                onClick={() => downloadEmailPDF(selectedEmail, `correo_${selectedEmail.date ?? Date.now()}`)}
                                variant="primary"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

"use client";

import { useEffect, useState } from "react";
import Button from "../components/Button";
import EmptyState from "../components/common/EmptyState";
import ErrorMessage from "../components/common/ErrorMessage";
import LoadingSpinner from "../components/common/LoadingSpinner";
import Pagination from "../components/common/Pagination";
import Input from "../components/Input";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { apiClient } from "../utils/api";
import { downloadXLSX } from "../utils/download";
import { formatDate, formatTime, getTodayString } from "../utils/formatters";
import { validateDateRange as validateDateRangeUtil } from "../utils/validators";

import { SMSMessage, SmsSearchResponse } from "../types/sms";

export default function SmsPage() {
    const [telefono, setTelefono] = useState("");
    const [texto, setTexto] = useState("");
    const [customerId, setCustomerId] = useState("");
    const [connId, setConnId] = useState("");
    const [fechaInicio, setFechaInicio] = useState("");
    const [fechaFin, setFechaFin] = useState("");
    const [perPage, setPerPage] = useState(50); // Ensure default is 50
    const [currentPage, setCurrentPage] = useState(1);
    // const [currentPage, setCurrentPage] = useState(1); // Removed
    const [displayedResults, setDisplayedResults] = useState<SMSMessage[]>([]);
    const [nextCursor, setNextCursor] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    const [results, setResults] = useState<SmsSearchResponse | null>(null);
    const [allResults, setAllResults] = useState<SmsSearchResponse | null>(null);
    const [allLoadedResults, setAllLoadedResults] = useState<SMSMessage[]>([]);
    const [localFilter, setLocalFilter] = useState("");
    const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [showNote, setShowNote] = useLocalStorage('sms-hide-note', false);
    const [dateRangeError, setDateRangeError] = useState("");

    // Restaurar estado al cargar
    useEffect(() => {
        const savedState = sessionStorage.getItem('smsSearchState');
        if (savedState) {
            try {
                const state = JSON.parse(savedState);
                setTelefono(state.telefono || "");
                setTexto(state.texto || "");
                setCustomerId(state.customerId || "");
                setConnId(state.connId || "");
                setFechaInicio(state.fechaInicio || "");
                setFechaFin(state.fechaFin || "");
                setSortOrder(state.sortOrder || 'desc');
                setPerPage(state.perPage || 25);
                setCurrentPage(state.currentPage || 1);
                // setCurrentPage(state.currentPage || 1); // Removed

                // Ejecutar búsqueda automáticamente si hay filtros
                if (state.shouldSearch) {
                    sessionStorage.removeItem('smsSearchState');
                    setTimeout(() => {
                        document.querySelector('form')?.requestSubmit();
                    }, 100);
                }
            } catch (e) {
                console.error('Error al restaurar estado:', e);
                sessionStorage.removeItem('smsSearchState');
            }
        }
    }, []);

    const validateDateRange = (inicio?: string, fin?: string) => {
        const startDate = inicio !== undefined ? inicio : fechaInicio;
        const endDate = fin !== undefined ? fin : fechaFin;

        const result = validateDateRangeUtil(startDate, endDate);
        setDateRangeError(result.error || "");
        return result.isValid;
    };

    async function buscarSms(e: React.FormEvent) {
        e.preventDefault();

        // Validar que al menos un campo tenga valor
        const hasAnyField = telefono || texto || customerId || connId || fechaInicio || fechaFin;
        if (!hasAnyField) {
            setError("Debes ingresar al menos un criterio de búsqueda (teléfono, texto, ID o fechas)");
            return;
        }

        if (!validateDateRange()) {
            setError("Por favor corrige los errores en el formulario antes de buscar");
            return;
        }

        setLoading(true);
        setError("");
        setResults(null);

        try {
            const params: Record<string, any> = {
                order_by: sortOrder
            };

            if (telefono) params.telefono = telefono;
            if (texto) params.texto = texto;
            if (customerId) params.customer_id = customerId;
            if (connId) params.conn_id = connId;
            if (fechaInicio) params.desde = fechaInicio;
            if (fechaFin) params.hasta = fechaFin;

            const data: SmsSearchResponse = await apiClient.get('/api/sms/search', params);

            // Si hay error en la respuesta controlada, mostrarlo
            if (data.status === "error") {
                setError(data.detalle || "Error desconocido");
            } else {
                setResults(data);
                setAllResults(data);
                setAllLoadedResults(data.data || []);
                setDisplayedResults((data.data || []).slice(0, perPage));
                setNextCursor(data.next_cursor || null);
                setHasMore(!!data.has_more);
                setLocalFilter("");
            }
        } catch (err: any) {
            setError(err.message || "Error al buscar SMS");
        } finally {
            setLoading(false);
        }
    }

    const limpiarFiltros = () => {
        setTelefono("");
        setTexto("");
        setCustomerId("");
        setConnId("");
        setFechaInicio("");
        setFechaFin("");
        setResults(null);
        setAllResults(null);
        setSortOrder('desc');
        setError("");
    };

    const aplicarOrdenamiento = (orden: 'desc' | 'asc') => {
        setSortOrder(orden);
        if (!allLoadedResults || allLoadedResults.length === 0) {
            return;
        }
        const datosOrdenados = [...allLoadedResults].sort((a, b) => {
            const dateA = new Date(a.date).getTime();
            const dateB = new Date(b.date).getTime();
            return orden === 'desc' ? dateB - dateA : dateA - dateB;
        });
        setAllLoadedResults(datosOrdenados);
        setCurrentPage(1);
    };

    const aplicarFiltroLocal = (filtro: string) => {
        setLocalFilter(filtro);

        if (!allLoadedResults || !filtro.trim()) {
            setDisplayedResults(allLoadedResults || []);
            return;
        }

        const filtroLower = filtro.toLowerCase();
        const datosFiltrados = allLoadedResults.filter((sms: SMSMessage) =>
            sms.conn_id?.toLowerCase().includes(filtroLower) ||
            sms.agent_name?.toLowerCase().includes(filtroLower) ||
            sms.customer_id?.toLowerCase().includes(filtroLower) ||
            sms.telephone?.toLowerCase().includes(filtroLower) ||
            sms.message?.toLowerCase().includes(filtroLower)
        );

        setDisplayedResults(datosFiltrados);
    };


    const loadMoreSms = async () => {
        if (!nextCursor || isLoadingMore) return;

        setIsLoadingMore(true);
        try {
            const params: Record<string, any> = {
                order_by: sortOrder,
                cursor: nextCursor,
                per_page: perPage
            };

            if (telefono) params.telefono = telefono;
            if (texto) params.texto = texto;
            if (customerId) params.customer_id = customerId;
            if (connId) params.conn_id = connId;
            if (fechaInicio) params.desde = fechaInicio;
            if (fechaFin) params.hasta = fechaFin;

            const data: SmsSearchResponse = await apiClient.get('/api/sms/search', params);

            if (data.status === "ok" && data.data) {
                setDisplayedResults(prev => [...prev, ...data.data!]);
                setNextCursor(data.next_cursor || null);
                setHasMore(!!data.has_more);

                if (results) {
                    setResults({
                        ...results,
                        total: results.total
                    });
                }
            }
        } catch (err: any) {
            console.error("Error loading more sms", err);
            setError(err.message || "Error al cargar más mensajes");
        } finally {
            setIsLoadingMore(false);
        }
    };

    const descargarResultados = () => {
        if (!allResults?.data || allResults.data.length === 0) return;

        // Preparar todos los datos para Excel
        const excelData = allResults.data.map((sms) => ({
            'Conn ID': sms.conn_id || '',
            'Agente': sms.agent_name || '',
            'ID Agente': sms.agent_id || '',
            'Fecha': sms.date ? formatDate(sms.date) : '',
            'Hora': sms.date ? formatTime(sms.date) : '',
            'Teléfono': sms.telephone || '',
            'Customer ID': sms.customer_id || '',
            'Mensaje': sms.message || '',
            'Canal': sms.channel || ''
        }));

        downloadXLSX(excelData, `sms_${new Date().toISOString().split('T')[0]}.xlsx`, 'SMS');
    };

    // Manejo de paginación visual
    const totalPages = allLoadedResults ? Math.ceil(allLoadedResults.length / perPage) : 1;
    useEffect(() => {
        if (allLoadedResults) {
            const startIdx = (currentPage - 1) * perPage;
            const endIdx = startIdx + perPage;
            setDisplayedResults(allLoadedResults.slice(startIdx, endIdx));
        }
    }, [allLoadedResults, perPage, currentPage]);

    return (
        <div className="max-w-7xl mx-auto">
            <div className="mb-6">
                <h1 className="text-4xl font-bold text-gray-900 mb-2">
                    SMS
                </h1>
                <p className="text-gray-600">
                    Busca mensajes SMS por teléfono, palabra clave o rango de fechas.
                    Debes proporcionar al menos un criterio de búsqueda.
                </p>
            </div>

            {/* Formulario de Búsqueda */}
            <div className="card p-6 mb-6">
                <form onSubmit={buscarSms}>
                    <div className="grid md:grid-cols-2 gap-6 mb-6">
                        <Input
                            label="Teléfono"
                            value={telefono}
                            onChange={setTelefono}
                            placeholder="+57 300 123 4567"
                        />
                        <Input
                            label="Palabra Clave en Mensaje"
                            value={texto}
                            onChange={setTexto}
                            placeholder="Buscar en el contenido del mensaje"
                        />
                    </div>

                    <div className="grid md:grid-cols-2 gap-6 mb-6">
                        <Input
                            label="Customer ID"
                            value={customerId}
                            onChange={setCustomerId}
                            placeholder="ID del cliente"
                        />
                        <Input
                            label="Conn ID"
                            value={connId}
                            onChange={setConnId}
                            placeholder="Ej: 1234567890"
                        />
                    </div>

                    <div className="grid md:grid-cols-2 gap-6 mb-6">
                        <Input
                            label="Fecha Inicio (opcional)"
                            value={fechaInicio}
                            onChange={(val) => {
                                setFechaInicio(val);
                                validateDateRange(val, fechaFin);
                            }}
                            type="date"
                            max={getTodayString()}
                            error={!!dateRangeError && !!fechaInicio}
                        />
                        <Input
                            label="Fecha Fin (opcional)"
                            value={fechaFin}
                            onChange={(val) => {
                                setFechaFin(val);
                                validateDateRange(fechaInicio, val);
                            }}
                            type="date"
                            max={getTodayString()}
                            error={!!dateRangeError && !!fechaFin}
                        />
                    </div>

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
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                                <div className="text-sm text-blue-900 pr-6">
                                    <p className="font-semibold mb-2">¿Cómo buscar?</p>
                                    <ul className="space-y-1 list-disc list-inside">
                                        <li>Puedes combinar todos los criterios (teléfono, texto, IDs, fechas)</li>
                                        <li>Debes proporcionar <strong>al menos un criterio</strong> para buscar</li>
                                        <li>Las búsquedas son <strong>parciales</strong> (ejemplo: "573" encontrará "573235256739")</li>
                                        <li><strong>Fecha inicio:</strong> busca desde esa fecha hasta hoy</li>
                                        <li><strong>Fecha fin:</strong> busca todo lo registrado hasta esa fecha</li>
                                        <li>Puedes usar ambas fechas para definir un rango específico</li>
                                        <li>Las fechas no pueden ser <strong>futuras</strong></li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
                        <Button text="Buscar" submit variant="primary" />
                        <Button
                            text="Limpiar Filtros"
                            onClick={limpiarFiltros}
                            variant="secondary"
                        />
                    </div>
                </form>
            </div>

            {/* Loading */}
            {loading && <LoadingSpinner text="Cargando resultados..." />}

            {/* Error */}
            {error && <ErrorMessage message={error} />}

            {/* Resultados */}
            {!loading && results && results.status === "ok" && results.data && results.data.length > 0 && (
                <div>
                    <div className="card p-4 mb-4">
                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <label className="block mb-2 font-semibold text-gray-900 text-sm">
                                    Ordenar resultados por fecha
                                </label>
                                <select
                                    value={sortOrder}
                                    onChange={(e) => aplicarOrdenamiento(e.target.value as 'desc' | 'asc')}
                                    className="input"
                                >
                                    <option value="desc">Más reciente primero</option>
                                    <option value="asc">Más antigua primero</option>
                                </select>
                            </div>
                            <div>
                                <label className="block mb-2 font-semibold text-gray-900 text-sm">
                                    Resultados por página
                                </label>
                                <select
                                    value={perPage}
                                    onChange={(e) => setPerPage(Number(e.target.value))}
                                    className="input-avalogic"
                                >
                                    <option value="10">10</option>
                                    <option value="25">25</option>
                                    <option value="50">50</option>
                                    <option value="100">100</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="mb-4 flex justify-between items-center">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-1">
                                Resultados
                            </h2>
                            <p className="text-sm text-gray-600">
                                Mostrando {displayedResults.length} de {results.total} mensaje{results.total !== 1 ? "s" : ""} encontrado{results.total !== 1 ? "s" : ""}
                            </p>
                        </div>
                        <Button
                            text="Descargar Resultados"
                            onClick={descargarResultados}
                            variant="secondary"
                        />
                    </div>

                    <div className="card p-4 mb-6">
                        <Input
                            label="Filtrar en resultados actuales"
                            value={localFilter}
                            onChange={aplicarFiltroLocal}
                            placeholder="Buscar por conn ID, agente, teléfono, mensaje..."
                        />
                    </div>

                    {/* Tabla de Resultados */}
                    <div className="card overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                            Conn ID
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                            Agente
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                            Fecha
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                            Teléfono
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                            Mensaje
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                            Canal
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {displayedResults.map((sms, index) => (
                                        <tr key={sms.conn_id || index} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-mono text-gray-900 break-all max-w-xs">
                                                    {sms.conn_id || "-"}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {sms.agent_name || "-"}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    ID: {sms.agent_id || "-"}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">
                                                    {sms.date ? formatDate(sms.date) : "-"}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {sms.date ? formatTime(sms.date) : ""}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">
                                                    {sms.telephone || "-"}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    Cliente: {sms.customer_id || "-"}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 max-w-md">
                                                <div className="text-sm text-gray-900 break-words">
                                                    {sms.message || "-"}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                                    {sms.channel || "-"}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Paginación visual estándar y leyendas */}
                    <div className="mt-6 flex flex-col items-center gap-2">
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            totalItems={results?.total ?? 0}
                            perPage={perPage}
                            onPageChange={setCurrentPage}
                            onPerPageChange={(pp) => {
                                setPerPage(pp);
                                setCurrentPage(1);
                            }}
                        />
                        <div className="text-sm text-gray-700 mt-2">
                            Página {currentPage} de {totalPages}
                        </div>
                        <div className="text-sm text-gray-500">
                            Mostrando {displayedResults.length} de {results?.total ?? 0} mensajes
                        </div>
                    </div>
                </div>
            )
            }

            {/* Sin Resultados */}
            {
                !loading && results && results.status === "ok" && results.data && results.data.length === 0 && (
                    <EmptyState
                        icon={
                            <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                            </svg>
                        }
                        title="No se encontraron resultados"
                        message="No hay mensajes SMS que coincidan con los criterios de búsqueda."
                    />
                )
            }
        </div >
    );
}

"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Button from "../components/Button";
import EmptyState from "../components/common/EmptyState";
import ErrorMessage from "../components/common/ErrorMessage";
import LoadingSpinner from "../components/common/LoadingSpinner";
import Pagination from "../components/common/Pagination";
import Input from "../components/Input";
import ResultsHeader from "../components/ResultsHeader";
import SearchControls from "../components/SearchControls";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { apiClient } from "../utils/api";
import { downloadJSON } from "../utils/download";
import { formatDate, getTodayString } from "../utils/formatters";
import { validateDateRange as validateDateRangeUtil, validateEmail as validateEmailUtil } from "../utils/validators";

export default function ChatsPage() {
    const router = useRouter();
    const [connId, setConnId] = useState("");
    const [customerId, setCustomerId] = useState("");
    const [customerEmail, setCustomerEmail] = useState("");
    const [customerPhone, setCustomerPhone] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [keyword, setKeyword] = useState("");

    const [perPage, setPerPage] = useState(50); // Ensure default is 50
    const [currentPage, setCurrentPage] = useState(1);
    const [searchMode, setSearchMode] = useState<'normal' | 'keyword'>('normal');

    const [results, setResults] = useState<any>(null);
    const [allLoadedResults, setAllLoadedResults] = useState<any[]>([]);
    const [displayedResults, setDisplayedResults] = useState<any[]>([]);
    const [nextCursor, setNextCursor] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [localFilter, setLocalFilter] = useState("");
    const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [showNote, setShowNote] = useLocalStorage('chats-hide-note', false);
    const [emailError, setEmailError] = useState(false);
    const [dateRangeError, setDateRangeError] = useState("");

    useEffect(() => {
        const savedState = sessionStorage.getItem('chatSearchState');
        if (savedState) {
            try {
                const state = JSON.parse(savedState);
                setConnId(state.connId || "");
                setCustomerId(state.customerId || "");
                setCustomerEmail(state.customerEmail || "");
                setCustomerPhone(state.customerPhone || "");
                setStartDate(state.startDate || "");
                setEndDate(state.endDate || "");
                setSortOrder(state.sortOrder || 'desc');
                setPerPage(state.perPage || 25);
                setCurrentPage(state.currentPage || 1);
                // setCurrentPage(state.currentPage || 1); // Removed

                // Ejecutar búsqueda automáticamente si hay filtros
                if (state.shouldSearch) {
                    sessionStorage.removeItem('chatSearchState');
                    setTimeout(() => {
                        document.querySelector('form')?.requestSubmit();
                    }, 100);
                }
            } catch (e) {
                console.error('Error al restaurar estado:', e);
                sessionStorage.removeItem('chatSearchState');
            }
        }
    }, []);

    const guardarEstado = () => {
        const state = {
            connId,
            customerId,
            customerEmail,
            customerPhone,
            startDate,
            endDate,
            sortOrder,
            perPage,
            shouldSearch: true
        };
        try {
            sessionStorage.setItem('chatSearchState', JSON.stringify(state));
        } catch (e) {
            console.error('Error al guardar estado:', e);
        }
    };

    const validateEmail = (email: string) => {
        const isValid = validateEmailUtil(email);
        setEmailError(!isValid && email !== "");
        return isValid;
    };

    const validateDateRange = (inicio?: string, fin?: string) => {
        const startDateVal = inicio !== undefined ? inicio : startDate;
        const endDateVal = fin !== undefined ? fin : endDate;

        const result = validateDateRangeUtil(startDateVal, endDateVal);
        setDateRangeError(result.error || "");
        return result.isValid;
    };

    async function buscarChats(e?: any) {
        if (e) e.preventDefault();

        const hasAnyField = connId || customerId || customerEmail || customerPhone || startDate || endDate;
        if (!hasAnyField) {
            setError("Debes ingresar al menos un criterio de búsqueda (ID, email, teléfono o fechas)");
            return;
        }

        if (emailError || !validateEmail(customerEmail) || !validateDateRange()) {
            setError("Por favor corrige los errores en el formulario antes de buscar");
            return;
        }

        setLoading(true);
        setError("");
        setResults(null);

        try {
            const params: Record<string, any> = {
                page: 1,
                per_page: 1000,
                order_by: sortOrder,
            };

            if (connId) params.conn_id = connId;
            if (customerId) params.customer_id = customerId;
            if (customerEmail) params.customer_email = customerEmail;
            if (customerPhone) params.customer_phone = customerPhone;
            if (startDate) params.start_date = new Date(startDate).toISOString();
            if (endDate) params.end_date = new Date(endDate).toISOString();

            const data: any = await apiClient.get('/api/v1/chats/search', params);

            console.log('API Response:', data); // Debug log

            setResults(data);
            const resultData = data.data || [];
            setAllLoadedResults(resultData);
            setDisplayedResults(resultData.slice(0, perPage));
            setNextCursor(data.next_cursor || null);
            setHasMore(!!data.has_more || (data.total && resultData.length < data.total));
            setLocalFilter("");
        } catch (err: any) {
            setError(err.message || "Error al buscar conversaciones");
            setResults(null);
        } finally {
            setLoading(false);
        }
    }

    const loadMoreChats = async () => {
        if (!nextCursor || isLoadingMore) return;

        setIsLoadingMore(true);
        try {
            const params: Record<string, any> = {
                page: 1,
                per_page: perPage,
                order_by: sortOrder,
                cursor: nextCursor
            };

            if (connId) params.conn_id = connId;
            if (customerId) params.customer_id = customerId;
            if (customerEmail) params.customer_email = customerEmail;
            if (customerPhone) params.customer_phone = customerPhone;
            if (startDate) params.start_date = new Date(startDate).toISOString();
            if (endDate) params.end_date = new Date(endDate).toISOString();

            const data: any = await apiClient.get('/api/v1/chats/search', params);

            if (data.status === "ok" && data.data) {
                const newResults = [...allLoadedResults, ...data.data];
                setAllLoadedResults(newResults);

                if (localFilter) {
                    const filtroLower = localFilter.toLowerCase();
                    const datosFiltrados = newResults.filter((chat: any) =>
                        chat.conn_id?.toLowerCase().includes(filtroLower) ||
                        chat.customer_name?.toLowerCase().includes(filtroLower) ||
                        chat.customer_id?.toLowerCase().includes(filtroLower) ||
                        chat.customer_phone?.toLowerCase().includes(filtroLower) ||
                        chat.customer_email?.toLowerCase().includes(filtroLower) ||
                        chat.agent_name?.toLowerCase().includes(filtroLower)
                    );
                    setDisplayedResults(datosFiltrados);
                } else {
                    setDisplayedResults(newResults);
                }

                setNextCursor(data.next_cursor || null);
                setHasMore(!!data.has_more);
            }
        } catch (err: any) {
            console.error("Error loading more chats", err);
            setError(err.message || "Error al cargar más conversaciones");
        } finally {
            setIsLoadingMore(false);
        }
    };

    const verDetalle = (connId: string) => {
        guardarEstado();
        router.push(`/chats/${connId}`);
    };

    const aplicarFiltroLocal = (filtro: string) => {
        setLocalFilter(filtro);

        if (!allLoadedResults || !filtro.trim()) {
            setDisplayedResults(allLoadedResults || []);
            return;
        }

        const filtroLower = filtro.toLowerCase();
        const datosFiltrados = allLoadedResults.filter((chat: any) =>
            chat.conn_id?.toLowerCase().includes(filtroLower) ||
            chat.customer_name?.toLowerCase().includes(filtroLower) ||
            chat.customer_id?.toLowerCase().includes(filtroLower) ||
            chat.customer_phone?.toLowerCase().includes(filtroLower) ||
            chat.customer_email?.toLowerCase().includes(filtroLower) ||
            chat.agent_name?.toLowerCase().includes(filtroLower)
        );

        setDisplayedResults(datosFiltrados);
    };

    const aplicarOrdenamiento = (orden: 'desc' | 'asc') => {
        setSortOrder(orden);
        if (!allLoadedResults || allLoadedResults.length === 0) {
            return;
        }
        const datosOrdenados = [...allLoadedResults].sort((a: any, b: any) => {
            const dateA = new Date(a.date).getTime();
            const dateB = new Date(b.date).getTime();
            return orden === 'desc' ? dateB - dateA : dateA - dateB;
        });
        setAllLoadedResults(datosOrdenados);
        setCurrentPage(1);
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


    const descargarConversacion = async (connId: string) => {
        try {
            const data: any = await apiClient.get(`/api/v1/chats/${connId}`);
            // Preparar datos para Excel
            const excelData = [{
                'ID Conversación': data.conn_id || '',
                'Cliente': data.customer_name || '',
                'Customer ID': data.customer_id || '',
                'Email': data.customer_email || '',
                'Teléfono': data.customer_phone || '',
                'Agente': data.agent_name || '',
                'Fecha': data.date ? formatDate(data.date) : '',
                'Canal': data.channel || '',
                'Sentimiento': data.feeling || '',
                'Transferida': data.is_transferred ? 'Sí' : 'No'
            }];
            downloadJSON(excelData, `conversacion_${connId}.json`);
        } catch (err) {
            alert('Error al descargar la conversación');
        }
    };

    const descargarTodas = () => {
        if (!allLoadedResults || allLoadedResults.length === 0) return;

        // Preparar todos los datos para Excel
        const excelData = allLoadedResults.map((chat: any) => ({
            'ID Conversación': chat.conn_id || '',
            'Cliente': chat.customer_name || '',
            'Customer ID': chat.customer_id || '',
            'Email': chat.customer_email || '',
            'Teléfono': chat.customer_phone || '',
            'Agente': chat.agent_name || '',
            'Fecha': chat.date ? formatDate(chat.date) : '',
            'Canal': chat.channel || '',
            'Sentimiento': chat.feeling || '',
            'Transferida': chat.is_transferred ? 'Sí' : 'No',
            'Agentes (si transferida)': chat.all_agents ? chat.all_agents.join(' → ') : ''
        }));

        downloadJSON(excelData, `conversaciones_${new Date().toISOString().split('T')[0]}.json`);
    };

    const limpiarFiltros = () => {
        setConnId("");
        setCustomerId("");
        setCustomerEmail("");
        setCustomerPhone("");
        setStartDate("");
        setEndDate("");
        setKeyword("");
        setResults(null);
        setAllLoadedResults([]);
        setDisplayedResults([]);
        setLocalFilter("");
        setError("");
    };

    return (
        <div className="max-w-7xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
                    Conversaciones
                </h1>
                <p className="text-lg text-gray-500 max-w-3xl">
                    Filtra conversaciones por ID, cliente, teléfono, email y rango de fechas
                </p>
            </div>

            <div className="card p-6 mb-8">
                <form onSubmit={buscarChats}>
                    <div className="grid md:grid-cols-2 gap-6 mb-6">
                        <Input
                            label="Conn ID"
                            value={connId}
                            onChange={setConnId}
                            placeholder="Ej: 1234567890"
                        />
                        <Input
                            label="Customer ID"
                            value={customerId}
                            onChange={setCustomerId}
                            placeholder="ID del cliente"
                        />
                    </div>

                    <div className="grid md:grid-cols-2 gap-6 mb-6">
                        <Input
                            label="Email del Cliente"
                            value={customerEmail}
                            onChange={(val) => {
                                setCustomerEmail(val);
                                validateEmail(val);
                            }}
                            type="email"
                            placeholder="cliente@example.com"
                            error={emailError}
                        />
                        <Input
                            label="Teléfono del Cliente"
                            value={customerPhone}
                            onChange={setCustomerPhone}
                            placeholder="+57 300 123 4567"
                        />
                    </div>

                    <div className="grid md:grid-cols-2 gap-6 mb-6">
                        <Input
                            label="Fecha Inicio"
                            value={startDate}
                            onChange={(val) => {
                                setStartDate(val);
                                validateDateRange(val, endDate);
                            }}
                            type="date"
                            max={getTodayString()}
                            error={!!dateRangeError && !!startDate}
                        />
                        <Input
                            label="Fecha Fin"
                            value={endDate}
                            onChange={(val) => {
                                setEndDate(val);
                                validateDateRange(startDate, val);
                            }}
                            type="date"
                            max={getTodayString()}
                            error={!!dateRangeError && !!endDate}
                        />
                    </div>

                    {(emailError || dateRangeError) && (
                        <div className="mb-6 p-3 bg-red-50 border-l-4 border-red-500 rounded-r-lg">
                            <div className="flex items-start">
                                <svg className="w-5 h-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                                <div className="text-sm text-red-800">
                                    {emailError && <p className="font-medium mb-1">El formato del email no es válido. Verifica que no tenga espacios y tenga el formato correcto (ejemplo@dominio.com)</p>}
                                    {dateRangeError && <p className="font-medium">{dateRangeError}</p>}
                                </div>
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
                                        <li>Puedes combinar <strong>todos los criterios</strong> (IDs, email, teléfono, fechas)</li>
                                        <li>Todos los campos son <strong>opcionales</strong>, pero al menos uno debe tener valor</li>
                                        <li><strong>Fecha inicio:</strong> busca desde esa fecha hasta hoy</li>
                                        <li><strong>Fecha fin:</strong> busca todo lo registrado hasta esa fecha</li>
                                        <li>Puedes usar ambas fechas para definir un rango específico</li>
                                        <li>Las fechas no pueden ser <strong>futuras</strong></li>
                                        <li>Los resultados incluyen conversaciones <strong>transferidas</strong> agrupadas</li>
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

            {loading && <LoadingSpinner text="Cargando resultados..." />}

            {error && <ErrorMessage message={error} />}

            {!loading && results && results.data && results.data.length > 0 && (
                <div>
                    <SearchControls
                        sortOrder={sortOrder}
                        perPage={perPage}
                        onSortChange={aplicarOrdenamiento}
                        onPerPageChange={setPerPage}
                        perPageOptions={[10, 25, 50, 100]} // Ensure options include 50
                    />

                    <ResultsHeader
                        currentCount={displayedResults.length}
                        totalCount={results.total}
                        itemName="conversación"
                        itemNamePlural="conversaciones"
                        onDownload={descargarTodas}
                        downloadButtonText="Descargar Todas"
                    />

                    <div className="card p-4 mb-6">
                        <Input
                            label="Filtrar en resultados actuales"
                            value={localFilter}
                            onChange={aplicarFiltroLocal}
                            placeholder="Buscar por nombre, ID, teléfono, email..."
                        />
                    </div>

                    <div className="space-y-3">
                        {displayedResults.map((chat: any) => (
                            <div key={chat.conn_id} className="card p-5 hover:shadow-lg transition-shadow border border-gray-100">
                                <div className="flex justify-between items-start gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-start justify-between mb-3">
                                            <div>
                                                <h3 className="text-lg font-bold text-gray-900">
                                                    {chat.customer_name || "Cliente desconocido"}
                                                </h3>
                                                <p className="text-sm text-gray-500">
                                                    ID Conversación: <span className="font-mono font-medium text-gray-700">{chat.conn_id}</span>
                                                </p>
                                                {chat.is_transferred && chat.all_agents && chat.all_agents.length > 1 && (
                                                    <div className="mt-1 flex items-center gap-2">
                                                        <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-xs font-medium">
                                                            Transferida
                                                        </span>
                                                        <span className="text-xs text-gray-500">
                                                            {chat.all_agents.join(' → ')}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                            <div>
                                                <span className="text-gray-500 block">Customer ID:</span>
                                                <p className="font-medium text-gray-900">{chat.customer_id}</p>
                                            </div>
                                            <div>
                                                <span className="text-gray-500 block">Teléfono:</span>
                                                <p className="font-medium text-gray-900">{chat.customer_phone || "-"}</p>
                                            </div>
                                            <div>
                                                <span className="text-gray-500 block">Agente:</span>
                                                <p className="font-medium text-gray-900">{chat.agent_name}</p>
                                            </div>
                                            <div>
                                                <span className="text-gray-500 block">Fecha:</span>
                                                <p className="font-medium text-gray-900">
                                                    {formatDate(chat.date)}
                                                </p>
                                            </div>
                                        </div>

                                        {chat.customer_email && (
                                            <p className="text-sm text-gray-500 mt-2">
                                                <span className="font-medium">Email:</span> {chat.customer_email}
                                            </p>
                                        )}

                                        <div className="flex gap-2 mt-3 text-xs">
                                            {chat.channel && (
                                                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                                                    {chat.channel}
                                                </span>
                                            )}
                                            {chat.feeling && (
                                                <span className={`px-2 py-1 rounded ${chat.feeling === 'positive' ? 'bg-green-100 text-green-700' :
                                                    chat.feeling === 'negative' ? 'bg-red-100 text-red-700' :
                                                        'bg-gray-100 text-gray-700'
                                                    }`}>
                                                    {chat.feeling}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <Button
                                            text="Ver Detalle"
                                            onClick={() => verDetalle(chat.conn_id)}
                                            variant="primary"
                                        />
                                        <Button
                                            text="Descargar"
                                            onClick={() => descargarConversacion(chat.conn_id)}
                                            variant="secondary"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Paginación visual */}
                    <div className="mt-6 flex flex-col items-center gap-2">
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            totalItems={allLoadedResults ? allLoadedResults.length : 0}
                            perPage={perPage}
                            onPageChange={setCurrentPage}
                            onPerPageChange={(pp) => {
                                setPerPage(pp);
                                setCurrentPage(1);
                            }}
                        />
                    </div>
                    <div className="flex flex-col items-center gap-1 mt-2">
                        <div className="text-sm text-gray-700">
                            Página {currentPage} de {totalPages}
                        </div>
                        <div className="text-sm text-gray-500">
                            Mostrando {displayedResults.length} de {results?.total ?? 0} conversaciones
                        </div>
                    </div>
                </div>
            )}

            {!loading && results && results.data && results.data.length === 0 && (
                <EmptyState
                    title="No se encontraron resultados"
                    message="No hay conversaciones que coincidan con los filtros de búsqueda."
                />
            )}
        </div>
    );
}

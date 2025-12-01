"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Button from "../../../components/Button";
import EmptyState from "../../../components/common/EmptyState";
import ErrorMessage from "../../../components/common/ErrorMessage";
import LoadingSpinner from "../../../components/common/LoadingSpinner";
import Pagination from "../../../components/common/Pagination";
import Input from "../../../components/Input";
import { Cdr1Record } from "../../../types/cdr";
import { apiClient } from "../../../utils/api";
import { formatDate, formatTime } from "../../../utils/formatters";

interface Cdr1Response {
    status: string;
    data: Cdr1Record[] | null;
    detalle: string | null;
    total: number;
    next_cursor?: string | null;
    has_more?: boolean;
    page?: number;
}

export default function ConnectedCallsPage() {
    const router = useRouter();
    const [telefono, setTelefono] = useState("");
    const [customerId, setCustomerId] = useState("");
    const [connId, setConnId] = useState("");
    const [agentId, setAgentId] = useState("");
    const [fechaInicio, setFechaInicio] = useState("");
    const [fechaFin, setFechaFin] = useState("");
    const [perPage, setPerPage] = useState(50);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [totalCount, setTotalCount] = useState(0);
    const [displayedResults, setDisplayedResults] = useState<Cdr1Record[]>([]);
    const [results, setResults] = useState<Cdr1Response | null>(null);
    const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Buscar llamadas conectadas
    const buscarCdr1 = async (e?: React.FormEvent, customPage?: number, customPerPage?: number) => {
        if (e) e.preventDefault();
        setLoading(true);
        setError("");
        try {
            const params: Record<string, any> = {
                order_by: sortOrder,
                page: customPage ?? currentPage,
                per_page: customPerPage ?? perPage
            };
            if (telefono) params.telefono = telefono;
            if (customerId) params.customer_id = customerId;
            if (connId) params.conn_id = connId;
            if (agentId) params.agent_id = agentId;
            if (fechaInicio) params.desde = fechaInicio;
            if (fechaFin) params.hasta = fechaFin;


            const data = await apiClient.get<Cdr1Response>("/api/cdr_1/search", params);

            if (data.status === "error") {
                setError(data.detalle || "Error desconocido");
                setDisplayedResults([]);
            } else {
                setResults(data);
                setDisplayedResults(Array.isArray(data.data) ? data.data : []);
                if (typeof data.total === 'number') {
                    setTotalCount(data.total);
                    setTotalPages(Math.ceil(data.total / (customPerPage ?? perPage)));
                    setCurrentPage(data.page || 1);
                } else {
                    setTotalCount(0);
                    setTotalPages(0);
                }
            }
        } catch (err: any) {
            setError(err.message || "Error al buscar llamadas conectadas");
            setDisplayedResults([]);
        } finally {
            setLoading(false);
        }
    };

    // Navegar a detalle de llamada
    const verDetalle = (connId: string) => {
        router.push(`/calls/${connId}`);
    };

    const limpiarFiltros = () => {
        setTelefono("");
        setCustomerId("");
        setConnId("");
        setAgentId("");
        setFechaInicio("");
        setFechaFin("");
        setResults(null);
        setDisplayedResults([]);
        setSortOrder('desc');
        setError("");
    };

    const aplicarOrdenamiento = (orden: 'desc' | 'asc') => {
        setSortOrder(orden);
        if (!results || !Array.isArray(results.data)) {
            return;
        }
        const datosOrdenados = [...results.data].sort((a, b) => {
            const dateA = a.date ? new Date(a.date).getTime() : 0;
            const dateB = b.date ? new Date(b.date).getTime() : 0;
            return orden === 'desc' ? dateB - dateA : dateA - dateB;
        });
        setDisplayedResults(datosOrdenados.slice(0, perPage));
    };

    return (
        <div className="max-w-7xl mx-auto">
            <div className="mb-6">
                <h1 className="text-4xl font-bold text-gray-900 mb-2">
                    Detalle de llamadas
                </h1>
                <p className="text-gray-500">
                    Consulta el detalle de llamadas conectadas por teléfono, agente, cliente o rango de fechas.
                </p>
            </div>

            <div className="card-avalogic p-6 mb-6">
                <form onSubmit={buscarCdr1}>
                    <div className="grid md:grid-cols-2 gap-6 mb-6">
                        <Input
                            label="Teléfono"
                            value={telefono}
                            onChange={setTelefono}
                            placeholder="+57 300 123 4567"
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
                            label="Conn ID"
                            value={connId}
                            onChange={setConnId}
                            placeholder="Ej: 1234567890"
                        />
                        <Input
                            label="Agent ID"
                            value={agentId}
                            onChange={setAgentId}
                            placeholder="ID del agente"
                        />
                    </div>

                    <div className="grid md:grid-cols-2 gap-6 mb-6">
                        <Input
                            label="Fecha Inicio"
                            value={fechaInicio}
                            onChange={setFechaInicio}
                            type="date"
                        />
                        <Input
                            label="Fecha Fin"
                            value={fechaFin}
                            onChange={setFechaFin}
                            type="date"
                        />
                    </div>

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

            {/* Resultados */}
            {!loading && results && results.status === "ok" && Array.isArray(results.data) && results.data && results.data.length > 0 && (
                <div>
                    <div className="card-avalogic p-4 mb-4">
                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <label className="block mb-2 font-semibold text-gray-900 text-sm">
                                    Ordenar resultados por fecha
                                </label>
                                <select
                                    value={sortOrder}
                                    onChange={e => aplicarOrdenamiento(e.target.value as 'desc' | 'asc')}
                                    className="input-avalogic"
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
                                    onChange={async e => {
                                        const newPerPage = Number(e.target.value);
                                        setPerPage(newPerPage);
                                        setCurrentPage(1);
                                        await buscarCdr1(undefined, 1, newPerPage);
                                    }}
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
                    <div className="mt-2 text-sm text-gray-900 font-medium">
                        {results && results.data && results.data.length > 0 && (
                            <>Registros recuperados: <span className="font-bold">{results.data.length}</span></>
                        )}
                    </div>
                    <div className="card-avalogic overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                                            Agente
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                                            Fecha
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                                            Teléfono
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                                            Duración
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                                            Estado
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">
                                            Acciones
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {displayedResults.map((call, index) => (
                                        <tr key={call.conn_id || index} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {call.agent_name || "-"}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    ID: {call.agent_id || "-"}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">
                                                    {call.date ? formatDate(call.date) : "-"}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {call.date ? formatTime(call.date) : ""}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">
                                                    {call.telephone || "-"}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    Cliente: {call.customer_id || "-"}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">
                                                    {call.time_seg ? `${call.time_seg}s` : "-"}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">
                                                    {call.hang_up || "-"}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <Button
                                                    text="Ver Detalle"
                                                    onClick={() => verDetalle(call.conn_id)}
                                                    variant="secondary"
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div className="mt-6 flex flex-col items-center gap-2">
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            totalItems={results?.total ?? 0}
                            perPage={perPage}
                            onPageChange={async (page) => {
                                setCurrentPage(page);
                                await buscarCdr1(undefined, page);
                            }}
                            onPerPageChange={async (pp) => {
                                setPerPage(pp);
                                setCurrentPage(1);
                                await buscarCdr1(undefined, 1);
                            }}
                        />
                        <div className="text-sm text-gray-700 mt-2">
                            Página {currentPage} de {totalPages}
                        </div>
                        <div className="text-sm text-gray-500">
                            Mostrando {displayedResults.length} de {totalCount} llamadas conectadas
                        </div>
                    </div>
                </div>
            )}

            {/* Empty state para data vacía o nula */}
            {!loading && results && results.status === "ok" && ((Array.isArray(results.data) && results.data.length === 0) || !Array.isArray(results.data) || !results.data) && (
                <EmptyState
                    title="No se encontraron resultados"
                    message="No hay llamadas conectadas que coincidan con los criterios de búsqueda."
                />
            )}
        </div>
    );
}

"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Button from "../../components/Button";
import EmptyState from "../../components/common/EmptyState";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { DetailedCdrResponse } from "../../types/cdr";
import { apiClient } from "../../utils/api";
import { downloadJSON } from "../../utils/download";
import { formatDateTime } from "../../utils/formatters";

export default function CallDetailPage() {
    const params = useParams();
    const router = useRouter();
    const connId = params.conn_id as string;

    const [data, setData] = useState<DetailedCdrResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const descargarLlamada = () => {
        if (!data) return;
        downloadJSON(data, `llamada_${connId}.json`);
    };

    useEffect(() => {
        async function fetchDetail() {
            try {
                setLoading(true);
                setError("");

                const responseData = await apiClient.get(`/api/calls/reporte_cdr/${connId}`) as DetailedCdrResponse;
                setData(responseData);
            } catch (err: any) {
                setError(err.message || "Error al cargar el detalle de la llamada");
            } finally {
                setLoading(false);
            }
        }

        if (connId) {
            fetchDetail();
        }
    }, [connId]);

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto">
                <LoadingSpinner text="Cargando detalle de la llamada..." />
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-7xl mx-auto">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                    <div className="flex items-center mb-4">
                        <svg className="w-6 h-6 text-red-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        <h3 className="text-lg font-medium text-red-800">Error</h3>
                    </div>
                    <p className="text-sm text-red-700 mb-4">{error}</p>
                    <Button
                        text="Volver"
                        onClick={() => router.back()}
                        variant="secondary"
                    />
                </div>
            </div>
        );
    }

    if (!data) {
        return null;
    }

    const { header: summary, details } = data;

    return (
        <div className="max-w-7xl mx-auto">
            <div className="mb-6 flex gap-3">
                <Button
                    text="← Volver"
                    onClick={() => router.back()}
                    variant="secondary"
                />
                <Button
                    text="Descargar detalle"
                    onClick={descargarLlamada}
                    variant="secondary"
                />
            </div>

            <div className="card-avalogic p-6 mb-6">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">
                            Detalle de Llamada
                        </h1>
                        <p className="text-sm text-gray-500">
                            ID de Conexión: <span className="font-mono font-medium text-gray-900">{summary.conn_id}</span>
                        </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${summary.state?.toLowerCase().includes('answered') || summary.state?.toLowerCase().includes('contestad')
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                        }`}>
                        {summary.state || "Desconocido"}
                    </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
                    <div>
                        <span className="text-sm text-gray-500 block mb-1">Teléfono</span>
                        <p className="font-medium text-gray-900">{summary.telephone || "-"}</p>
                    </div>
                    <div>
                        <span className="text-sm text-gray-500 block mb-1">Customer ID</span>
                        <p className="font-medium text-gray-900">{summary.customer_id || "-"}</p>
                    </div>
                    <div>
                        <span className="text-sm text-gray-500 block mb-1">Agente</span>
                        <p className="font-medium text-gray-900">{summary.agent_name || "-"}</p>
                    </div>
                    <div>
                        <span className="text-sm text-gray-500 block mb-1">Fecha</span>
                        <p className="font-medium text-gray-900">
                            {summary.date ? formatDateTime(summary.date) : "-"}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
                    <div>
                        <span className="text-sm text-gray-500 block mb-1">Duración</span>
                        <p className="font-medium text-gray-900">
                            {summary.duration_sec ? `${summary.duration_sec}s` : "-"}
                        </p>
                    </div>
                    <div>
                        <span className="text-sm text-gray-500 block mb-1">Tiempo de Espera</span>
                        <p className="font-medium text-gray-900">
                            {summary.waiting_sec !== null ? `${summary.waiting_sec}s` : "-"}
                        </p>
                    </div>
                    <div>
                        <span className="text-sm text-gray-500 block mb-1">Canal</span>
                        <p className="font-medium text-gray-900">{summary.channel || "-"}</p>
                    </div>
                    <div>
                        <span className="text-sm text-gray-500 block mb-1">Campaña</span>
                        <p className="font-medium text-gray-900">{summary.campaign || "-"}</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
                    <div>
                        <span className="text-sm text-gray-500 block mb-1">Cola</span>
                        <p className="font-medium text-gray-900">{summary.queue || "-"}</p>
                    </div>
                    <div>
                        <span className="text-sm text-gray-500 block mb-1">ANI</span>
                        <p className="font-medium text-gray-900">{summary.ani || "-"}</p>
                    </div>
                    <div>
                        <span className="text-sm text-gray-500 block mb-1">ID de Llamada</span>
                        <p className="font-medium text-gray-900 text-xs">{summary.call_id || "-"}</p>
                    </div>
                    <div>
                        <span className="text-sm text-gray-500 block mb-1">Grabación</span>
                        {summary.recording ? (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                Disponible
                            </span>
                        ) : (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                                No disponible
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {details && (
                <div className="space-y-6">
                    {/* CDR 1 Details */}
                    {details.cdr1 && details.cdr1.length > 0 && (
                        <div className="card-avalogic p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">
                                Detalle Llamada Conectada
                            </h2>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Fecha</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Agente</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Teléfono</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Destino</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Duración</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Actividad</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Finalización</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {details.cdr1.map((record, idx) => (
                                            <tr key={idx} className="hover:bg-gray-50">
                                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
                                                    {record.date ? formatDateTime(record.date) : "-"}
                                                </td>
                                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
                                                    {record.agent_name || "-"}
                                                </td>
                                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
                                                    {record.telephone || "-"}
                                                </td>
                                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
                                                    {record.destiny || "-"}
                                                </td>
                                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
                                                    {record.time_seg ? `${record.time_seg}s` : "-"}
                                                </td>
                                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
                                                    <div className="font-medium">{record.cod_act || "-"}</div>
                                                    <div className="text-xs text-gray-500">{record.description_cod_act || ""}</div>
                                                </td>
                                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
                                                    {record.hang_up || "-"}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* CDR 5 Details */}
                    {details.cdr5 && details.cdr5.length > 0 && (
                        <div className="card-avalogic p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">
                                Detalle Llamada No Conectada
                            </h2>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Fecha</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Agente</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Teléfono</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Tiempo Ring</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Resultado</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Interacción</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {details.cdr5.map((record, idx) => (
                                            <tr key={idx} className="hover:bg-gray-50">
                                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
                                                    {record.date ? formatDateTime(record.date) : "-"}
                                                </td>
                                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
                                                    {record.agent_name || "-"}
                                                </td>
                                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
                                                    {record.telephone || "-"}
                                                </td>
                                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
                                                    {record.ring_time || "-"}
                                                </td>
                                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
                                                    {record.result || "-"}
                                                </td>
                                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
                                                    {record.type_interaction || "-"}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Diagram / IVR Details */}
                    {details.diagram && details.diagram.length > 0 && (
                        <div className="card-avalogic p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">
                                Detalle Llamada IVR
                            </h2>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Fecha</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Paso (RP Name)</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Opción</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Resultado</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Tiempo</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">ANI</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {details.diagram.map((record, idx) => (
                                            <tr key={idx} className="hover:bg-gray-50">
                                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
                                                    {record.date ? formatDateTime(record.date) : "-"}
                                                </td>
                                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
                                                    {record.rp_name || "-"}
                                                </td>
                                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
                                                    {record.cod_opc_menu || "-"}
                                                </td>
                                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
                                                    {record.result || "-"}
                                                </td>
                                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
                                                    {record.time || "-"}
                                                </td>
                                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
                                                    {record.ani || "-"}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Tipification Details */}
                    {details.tipification && details.tipification.length > 0 && (
                        <div className="card-avalogic p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">
                                Detalle Tipificación
                            </h2>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Fecha</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Agente</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Teléfono</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Destino</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Tiempo</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Actividad</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Comentarios</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {details.tipification.map((record, idx) => (
                                            <tr key={idx} className="hover:bg-gray-50">
                                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
                                                    {record.date ? formatDateTime(record.date) : "-"}
                                                </td>
                                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
                                                    <div className="font-medium">{record.agent_name || "-"}</div>
                                                    <div className="text-xs text-gray-500">ID: {record.agent_id || "-"}</div>
                                                </td>
                                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
                                                    {record.telephone || "-"}
                                                </td>
                                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
                                                    {record.destiny || "-"}
                                                </td>
                                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
                                                    {record.time || "-"}
                                                </td>
                                                <td className="px-4 py-2 text-sm text-gray-700">
                                                    <div className="font-medium">{record.cod_act || "-"}</div>
                                                    <div className="text-xs text-gray-500">{record.description_cod_act || ""}</div>
                                                    {record.cod_act_2 && (
                                                        <>
                                                            <div className="font-medium mt-1">{record.cod_act_2}</div>
                                                            <div className="text-xs text-gray-500">{record.description_cod_act_2 || ""}</div>
                                                        </>
                                                    )}
                                                </td>
                                                <td className="px-4 py-2 text-sm text-gray-700 max-w-xs">
                                                    <div className="truncate" title={record.comments || ""}>
                                                        {record.comments || "-"}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {!details && (
                <div className="card-avalogic p-6">
                    <EmptyState
                        title="No hay información adicional"
                        message="No se encontró información detallada adicional para esta llamada"
                    />
                </div>
            )}
        </div>
    );
}

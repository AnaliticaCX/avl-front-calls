"use client";

import { AlertCircle } from "lucide-react";
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
            <div className="mx-auto w-full max-w-[1800px] px-4 py-6 sm:px-6 lg:px-8">
                <LoadingSpinner text="Cargando detalle de la llamada..." />
            </div>
        );
    }

    if (error) {
        return (
            <div className="mx-auto w-full max-w-[1800px] px-4 py-6 sm:px-6 lg:px-8">
                <div className="bg-critical-soft border border-critical/25 rounded-lg p-6">
                    <div className="flex items-center mb-4">
                        <AlertCircle size={22} className="mr-3 text-critical" aria-hidden />
                        <h3 className="text-lg font-medium text-critical">Error</h3>
                    </div>
                    <p className="text-sm text-critical mb-4">{error}</p>
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
        <div className="mx-auto w-full max-w-[1800px] px-4 py-6 sm:px-6 lg:px-8">
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

            <div className="card p-6 mb-6">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h1 className="text-3xl font-bold text-ink-900 mb-2">
                            Detalle de Llamada
                        </h1>
                        <p className="text-sm text-ink-500">
                            ID de Conexión: <span className="font-mono font-medium text-ink-900">{summary.conn_id}</span>
                        </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${summary.state?.toLowerCase().includes('answered') || summary.state?.toLowerCase().includes('contestad')
                        ? 'bg-positive-soft text-positive'
                        : 'bg-critical-soft text-critical'
                        }`}>
                        {summary.state || "Desconocido"}
                    </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-hairline">
                    <div>
                        <span className="text-sm text-ink-500 block mb-1">Teléfono</span>
                        <p className="font-medium text-ink-900">{summary.telephone || "-"}</p>
                    </div>
                    <div>
                        <span className="text-sm text-ink-500 block mb-1">Customer ID</span>
                        <p className="font-medium text-ink-900">{summary.customer_id || "-"}</p>
                    </div>
                    <div>
                        <span className="text-sm text-ink-500 block mb-1">Agente</span>
                        <p className="font-medium text-ink-900">{summary.agent_name || "-"}</p>
                    </div>
                    <div>
                        <span className="text-sm text-ink-500 block mb-1">Fecha</span>
                        <p className="font-medium text-ink-900">
                            {summary.date ? formatDateTime(summary.date) : "-"}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
                    <div>
                        <span className="text-sm text-ink-500 block mb-1">Duración</span>
                        <p className="font-medium text-ink-900">
                            {summary.duration_sec ? `${summary.duration_sec}s` : "-"}
                        </p>
                    </div>
                    <div>
                        <span className="text-sm text-ink-500 block mb-1">Tiempo de Espera</span>
                        <p className="font-medium text-ink-900">
                            {summary.waiting_sec !== null ? `${summary.waiting_sec}s` : "-"}
                        </p>
                    </div>
                    <div>
                        <span className="text-sm text-ink-500 block mb-1">Canal</span>
                        <p className="font-medium text-ink-900">{summary.channel || "-"}</p>
                    </div>
                    <div>
                        <span className="text-sm text-ink-500 block mb-1">Campaña</span>
                        <p className="font-medium text-ink-900">{summary.campaign || "-"}</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
                    <div>
                        <span className="text-sm text-ink-500 block mb-1">Cola</span>
                        <p className="font-medium text-ink-900">{summary.queue || "-"}</p>
                    </div>
                    <div>
                        <span className="text-sm text-ink-500 block mb-1">ANI</span>
                        <p className="font-medium text-ink-900">{summary.ani || "-"}</p>
                    </div>
                    <div>
                        <span className="text-sm text-ink-500 block mb-1">ID de Llamada</span>
                        <p className="font-medium text-ink-900 text-xs">{summary.call_id || "-"}</p>
                    </div>
                    <div>
                        <span className="text-sm text-ink-500 block mb-1">Grabación</span>
                        {summary.recording ? (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-positive-soft text-positive">
                                Disponible
                            </span>
                        ) : (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-ink-100 text-ink-800">
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
                        <div className="card p-6">
                            <h2 className="text-xl font-bold text-ink-900 mb-4">
                                Detalle Llamada Conectada
                            </h2>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-hairline">
                                    <thead className="bg-surface-sunken">
                                        <tr>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-ink-900 uppercase tracking-wider">Fecha</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-ink-900 uppercase tracking-wider">Agente</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-ink-900 uppercase tracking-wider">Teléfono</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-ink-900 uppercase tracking-wider">Destino</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-ink-900 uppercase tracking-wider">Duración</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-ink-900 uppercase tracking-wider">Actividad</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-ink-900 uppercase tracking-wider">Finalización</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-hairline">
                                        {details.cdr1.map((record, idx) => (
                                            <tr key={idx} className="hover:bg-surface-sunken">
                                                <td className="px-4 py-2 whitespace-nowrap text-sm text-ink-700">
                                                    {record.date ? formatDateTime(record.date) : "-"}
                                                </td>
                                                <td className="px-4 py-2 whitespace-nowrap text-sm text-ink-700">
                                                    {record.agent_name || "-"}
                                                </td>
                                                <td className="px-4 py-2 whitespace-nowrap text-sm text-ink-700">
                                                    {record.telephone || "-"}
                                                </td>
                                                <td className="px-4 py-2 whitespace-nowrap text-sm text-ink-700">
                                                    {record.destiny || "-"}
                                                </td>
                                                <td className="px-4 py-2 whitespace-nowrap text-sm text-ink-700">
                                                    {record.time_seg ? `${record.time_seg}s` : "-"}
                                                </td>
                                                <td className="px-4 py-2 whitespace-nowrap text-sm text-ink-700">
                                                    <div className="font-medium">{record.cod_act || "-"}</div>
                                                    <div className="text-xs text-ink-500">{record.description_cod_act || ""}</div>
                                                </td>
                                                <td className="px-4 py-2 whitespace-nowrap text-sm text-ink-700">
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
                        <div className="card p-6">
                            <h2 className="text-xl font-bold text-ink-900 mb-4">
                                Detalle Llamada No Conectada
                            </h2>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-hairline">
                                    <thead className="bg-surface-sunken">
                                        <tr>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-ink-900 uppercase tracking-wider">Fecha</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-ink-900 uppercase tracking-wider">Agente</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-ink-900 uppercase tracking-wider">Teléfono</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-ink-900 uppercase tracking-wider">Tiempo Ring</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-ink-900 uppercase tracking-wider">Resultado</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-ink-900 uppercase tracking-wider">Interacción</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-hairline">
                                        {details.cdr5.map((record, idx) => (
                                            <tr key={idx} className="hover:bg-surface-sunken">
                                                <td className="px-4 py-2 whitespace-nowrap text-sm text-ink-700">
                                                    {record.date ? formatDateTime(record.date) : "-"}
                                                </td>
                                                <td className="px-4 py-2 whitespace-nowrap text-sm text-ink-700">
                                                    {record.agent_name || "-"}
                                                </td>
                                                <td className="px-4 py-2 whitespace-nowrap text-sm text-ink-700">
                                                    {record.telephone || "-"}
                                                </td>
                                                <td className="px-4 py-2 whitespace-nowrap text-sm text-ink-700">
                                                    {record.ring_time || "-"}
                                                </td>
                                                <td className="px-4 py-2 whitespace-nowrap text-sm text-ink-700">
                                                    {record.result || "-"}
                                                </td>
                                                <td className="px-4 py-2 whitespace-nowrap text-sm text-ink-700">
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
                        <div className="card p-6">
                            <h2 className="text-xl font-bold text-ink-900 mb-4">
                                Detalle Llamada IVR
                            </h2>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-hairline">
                                    <thead className="bg-surface-sunken">
                                        <tr>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-ink-900 uppercase tracking-wider">Fecha</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-ink-900 uppercase tracking-wider">Paso (RP Name)</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-ink-900 uppercase tracking-wider">Opción</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-ink-900 uppercase tracking-wider">Resultado</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-ink-900 uppercase tracking-wider">Tiempo</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-ink-900 uppercase tracking-wider">ANI</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-hairline">
                                        {details.diagram.map((record, idx) => (
                                            <tr key={idx} className="hover:bg-surface-sunken">
                                                <td className="px-4 py-2 whitespace-nowrap text-sm text-ink-700">
                                                    {record.date ? formatDateTime(record.date) : "-"}
                                                </td>
                                                <td className="px-4 py-2 whitespace-nowrap text-sm text-ink-700">
                                                    {record.rp_name || "-"}
                                                </td>
                                                <td className="px-4 py-2 whitespace-nowrap text-sm text-ink-700">
                                                    {record.cod_opc_menu || "-"}
                                                </td>
                                                <td className="px-4 py-2 whitespace-nowrap text-sm text-ink-700">
                                                    {record.result || "-"}
                                                </td>
                                                <td className="px-4 py-2 whitespace-nowrap text-sm text-ink-700">
                                                    {record.time || "-"}
                                                </td>
                                                <td className="px-4 py-2 whitespace-nowrap text-sm text-ink-700">
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
                        <div className="card p-6">
                            <h2 className="text-xl font-bold text-ink-900 mb-4">
                                Detalle Tipificación
                            </h2>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-hairline">
                                    <thead className="bg-surface-sunken">
                                        <tr>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-ink-900 uppercase tracking-wider">Fecha</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-ink-900 uppercase tracking-wider">Agente</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-ink-900 uppercase tracking-wider">Teléfono</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-ink-900 uppercase tracking-wider">Destino</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-ink-900 uppercase tracking-wider">Tiempo</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-ink-900 uppercase tracking-wider">Actividad</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-ink-900 uppercase tracking-wider">Comentarios</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-hairline">
                                        {details.tipification.map((record, idx) => (
                                            <tr key={idx} className="hover:bg-surface-sunken">
                                                <td className="px-4 py-2 whitespace-nowrap text-sm text-ink-700">
                                                    {record.date ? formatDateTime(record.date) : "-"}
                                                </td>
                                                <td className="px-4 py-2 whitespace-nowrap text-sm text-ink-700">
                                                    <div className="font-medium">{record.agent_name || "-"}</div>
                                                    <div className="text-xs text-ink-500">ID: {record.agent_id || "-"}</div>
                                                </td>
                                                <td className="px-4 py-2 whitespace-nowrap text-sm text-ink-700">
                                                    {record.telephone || "-"}
                                                </td>
                                                <td className="px-4 py-2 whitespace-nowrap text-sm text-ink-700">
                                                    {record.destiny || "-"}
                                                </td>
                                                <td className="px-4 py-2 whitespace-nowrap text-sm text-ink-700">
                                                    {record.time || "-"}
                                                </td>
                                                <td className="px-4 py-2 text-sm text-ink-700">
                                                    <div className="font-medium">{record.cod_act || "-"}</div>
                                                    <div className="text-xs text-ink-500">{record.description_cod_act || ""}</div>
                                                    {record.cod_act_2 && (
                                                        <>
                                                            <div className="font-medium mt-1">{record.cod_act_2}</div>
                                                            <div className="text-xs text-ink-500">{record.description_cod_act_2 || ""}</div>
                                                        </>
                                                    )}
                                                </td>
                                                <td className="px-4 py-2 text-sm text-ink-700 max-w-xs">
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
                <div className="card p-6">
                    <EmptyState
                        title="No hay información adicional"
                        message="No se encontró información detallada adicional para esta llamada"
                    />
                </div>
            )}
        </div>
    );
}

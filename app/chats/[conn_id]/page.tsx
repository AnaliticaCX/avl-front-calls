"use client";

import { AlertCircle } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Button from "../../components/Button";
import EmptyState from "../../components/common/EmptyState";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { apiClient } from "../../utils/api";
import { downloadJSON } from "../../utils/download";
import { formatDateTime, formatTime } from "../../utils/formatters";

interface Message {
    date: string;
    from: string;
    channel: string;
    message: string;
    to_name: string;
    from_name: string;
    to_field?: string;
    is_transferred_agent?: boolean;  // Indica si el mensaje es de un agente secundario (transferencia)
}

interface ChatDetail {
    conn_id: string;
    agent_name: string;
    customer_name: string;
    conversation: Message[];
    ingest_date?: string;
}

interface ChatSummary {
    conn_id: string;
    channel: string;
    date: string;
    customer_name: string;
    customer_email?: string;
    customer_phone?: string;
    customer_id?: string;
    agent_name: string;
    agent_id: string;
    chat_duration?: string;
    customer_chars?: string;
    feeling?: string;
    is_transferred?: boolean;  // Indica si la conversación fue transferida
    all_agents?: string[];  // Todos los agentes que participaron
}

interface ChatDetailResponse {
    summary: ChatSummary;
    conversation: ChatDetail;
}

export default function ChatDetailPage() {
    const params = useParams();
    const router = useRouter();
    const connId = params.conn_id as string;

    const [data, setData] = useState<ChatDetailResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const descargarConversacion = () => {
        if (!data) return;
        downloadJSON(data, `conversacion_${connId}.json`);
    };

    useEffect(() => {
        async function fetchDetail() {
            try {
                setLoading(true);
                setError("");

                const responseData = await apiClient.get(`/api/v1/chats/${connId}`) as ChatDetailResponse;
                setData(responseData);
            } catch (err: any) {
                setError(err.message || "Error al cargar la conversación");
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
                <LoadingSpinner text="Cargando conversación..." />
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
                        text="Volver a búsqueda"
                        onClick={() => router.push("/chats")}
                        variant="secondary"
                    />
                </div>
            </div>
        );
    }

    if (!data) {
        return null;
    }

    const { summary, conversation } = data;

    return (
        <div className="mx-auto w-full max-w-[1800px] px-4 py-6 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="mb-6 flex gap-3">
                <Button
                    text="← Volver a búsqueda"
                    onClick={() => router.push("/chats")}
                    variant="secondary"
                />
                <Button
                    text="Descargar esta conversación"
                    onClick={descargarConversacion}
                    variant="secondary"
                />
            </div>

            {/* Summary Card */}
            <div className="card p-6 mb-6">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h1 className="text-3xl font-bold text-ink-900 mb-2">
                            {summary.customer_name}
                        </h1>
                        <p className="text-sm text-ink-500">
                            Conn ID: <span className="font-mono font-medium text-ink-700">{summary.conn_id}</span>
                        </p>
                        {summary.is_transferred && summary.all_agents && summary.all_agents.length > 1 && (
                            <div className="mt-2 flex items-center gap-2">
                                <span className="px-3 py-1 bg-caution-soft text-caution rounded-full text-sm font-medium">
                                    Conversación transferida
                                </span>
                                <span className="text-sm text-ink-500">
                                    Agentes: {summary.all_agents.join(' → ')}
                                </span>
                            </div>
                        )}
                    </div>
                    {summary.feeling && (
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${summary.feeling === 'positive' ? 'bg-positive-soft text-positive' :
                            summary.feeling === 'negative' ? 'bg-critical-soft text-critical' :
                                'bg-ink-100 text-ink-700'
                            }`}>
                            {summary.feeling}
                        </span>
                    )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-hairline">
                    <div>
                        <span className="text-sm text-ink-500 block mb-1">Customer ID</span>
                        <p className="font-medium text-ink-900">{summary.customer_id || "-"}</p>
                    </div>
                    <div>
                        <span className="text-sm text-ink-500 block mb-1">Teléfono</span>
                        <p className="font-medium text-ink-900">{summary.customer_phone || "-"}</p>
                    </div>
                    <div>
                        <span className="text-sm text-ink-500 block mb-1">Email</span>
                        <p className="font-medium text-ink-900">{summary.customer_email || "-"}</p>
                    </div>
                    <div>
                        <span className="text-sm text-ink-500 block mb-1">Canal</span>
                        <p className="font-medium text-ink-900">{summary.channel}</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
                    <div>
                        <span className="text-sm text-ink-500 block mb-1">Agente</span>
                        <p className="font-medium text-ink-900">{summary.agent_name}</p>
                    </div>
                    <div>
                        <span className="text-sm text-ink-500 block mb-1">ID Agente</span>
                        <p className="font-medium text-ink-900">{summary.agent_id}</p>
                    </div>
                    <div>
                        <span className="text-sm text-ink-500 block mb-1">Fecha</span>
                        <p className="font-medium text-ink-900">
                            {formatDateTime(summary.date)}
                        </p>
                    </div>
                    {summary.chat_duration && (
                        <div>
                            <span className="text-sm text-ink-500 block mb-1">Duración</span>
                            <p className="font-medium text-ink-900">{summary.chat_duration}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Conversation */}
            <div className="card p-6">
                <h2 className="text-2xl font-bold text-ink-900 mb-6">
                    Conversación
                </h2>

                {conversation && conversation.conversation && conversation.conversation.length > 0 ? (
                    <div className="space-y-4">
                        {conversation.conversation.map((message, index) => {
                            // Determinar el tipo de mensaje basado en los campos "from" y "from_name"
                            const isCustomer = message.from === 'CUSTOMER';
                            const isBot = message.from === 'AGENT' && message.from_name === 'chat_bot';
                            const isAgent = message.from === 'AGENT' && message.from_name !== 'chat_bot';

                            // Detectar si es mensaje de WhatsApp del usuario
                            const isWhatsAppCustomer = isCustomer && message.channel?.toLowerCase() === 'whatsapp';                            // Definir estilos según el tipo de mensaje
                            let bgColor = 'bg-ink-100';
                            let textColor = 'text-ink-900';
                            let nameColor = 'text-ink-700';
                            let timeColor = 'text-ink-500';
                            let tagBg = 'bg-ink-200';
                            let tagText = 'text-ink-600';
                            let alignment = 'justify-start';

                            if (isWhatsAppCustomer) {
                                // Usuario de WhatsApp: fondo azul claro con texto azul oscuro (derecha)
                                bgColor = 'bg-info-soft';
                                textColor = 'text-info';
                                nameColor = 'text-info';
                                timeColor = 'text-info';
                                tagBg = 'bg-info/20';
                                tagText = 'text-info';
                                alignment = 'justify-end';
                            } else if (isCustomer) {
                                // Otros clientes: fondo azul con texto blanco (derecha)
                                bgColor = 'bg-primary';
                                textColor = 'text-white';
                                nameColor = 'text-white opacity-90';
                                timeColor = 'text-white opacity-75';
                                tagBg = 'bg-white bg-opacity-20';
                                tagText = 'text-white';
                                alignment = 'justify-end';
                            } else if (isBot) {
                                // Bot: verde (izquierda)
                                bgColor = 'bg-positive-soft';
                                textColor = 'text-positive';
                                nameColor = 'text-positive';
                                timeColor = 'text-positive';
                                tagBg = 'bg-positive/20';
                                tagText = 'text-positive';
                                alignment = 'justify-start';
                            }
                            // isAgent: gris (izquierda) - ya definido por defecto

                            // Detectar si el mensaje contiene HTML
                            const isHTML = message.message.includes('<') && message.message.includes('>');

                            return (
                                <div
                                    key={index}
                                    className={`flex ${alignment}`}
                                >
                                    <div className={`max-w-[70%]`}>
                                        <div className={`rounded-lg p-4 ${bgColor} ${textColor}`}>
                                            <div className="flex items-center justify-between mb-2">
                                                <span className={`text-sm font-semibold ${nameColor}`}>
                                                    {message.from_name}
                                                </span>
                                                <span className={`text-xs ${timeColor}`}>
                                                    {formatTime(message.date)}
                                                </span>
                                            </div>
                                            {isHTML ? (
                                                <div
                                                    className="text-sm whitespace-pre-wrap break-words"
                                                    dangerouslySetInnerHTML={{ __html: message.message }}
                                                />
                                            ) : (
                                                <p className="text-sm whitespace-pre-wrap break-words">
                                                    {message.message}
                                                </p>
                                            )}
                                            {message.channel && (
                                                <span className={`inline-block mt-2 text-xs px-2 py-0.5 rounded ${tagBg} ${tagText}`}>
                                                    {message.channel}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <EmptyState
                        title="Sin mensajes"
                        message="No hay mensajes en esta conversación"
                    />
                )}
            </div>
        </div>
    );
}

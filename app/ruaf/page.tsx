"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, CircleStop, Clock, Download, FileSpreadsheet, HelpCircle, Laptop, ListChecks, Loader2, Pause, Play, Radar, RefreshCw, Timer, Trash2, Upload, UploadCloud, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import ErrorMessage from "../components/common/ErrorMessage";
import LoadingSpinner from "../components/common/LoadingSpinner";
import PageHeader from "../components/common/PageHeader";
import { CorridaHistorial, RuafAccionResponse, RuafEstado, RuafSubidaUrlResponse } from "../types/ruaf";
import { useAbortable } from "../hooks/useAbortable";
import { apiClient, isAbortError } from "../utils/api";

const REFRESH_MS = 10000;
// Tras confirmar el lote se consulta el estado más seguido hasta ver que el EC2 empezó a procesar.
const ARRANQUE_POLL_MS = 2000;
const ARRANQUE_TIMEOUT_MS = 45000;
const XLSX_CONTENT_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

function formatearReloj(segundos: number): string {
    const s = Math.max(0, Math.round(segundos));
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${m}:${r.toString().padStart(2, "0")}`;
}

function ProgressRing({ pct, procesando }: { pct: number; procesando: boolean }) {
    const R = 42;
    const CIRC = 2 * Math.PI * R;
    const offset = CIRC - (pct / 100) * CIRC;
    return (
        <div className="relative w-24 h-24 flex-shrink-0">
            <svg viewBox="0 0 96 96" className="w-24 h-24 -rotate-90">
                <circle cx="48" cy="48" r={R} fill="none" stroke="currentColor" strokeWidth="8" className="text-ink-100" />
                <motion.circle
                    cx="48"
                    cy="48"
                    r={R}
                    fill="none"
                    strokeWidth="8"
                    strokeLinecap="round"
                    className={procesando ? "text-caution" : "text-primary"}
                    stroke="currentColor"
                    strokeDasharray={CIRC}
                    initial={{ strokeDashoffset: CIRC }}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ duration: 0.7, ease: "easeOut" }}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-bold text-ink-900 tabular-nums">{pct}%</span>
            </div>
        </div>
    );
}

function StatTile({
    icon: Icon,
    label,
    value,
    colorClass,
    delay,
}: {
    icon: typeof ListChecks;
    label: string;
    value: number;
    colorClass: string;
    delay: number;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay }}
            className="card p-4 sm:p-5"
        >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${colorClass}`}>
                <Icon size={20} />
            </div>
            <div className="text-2xl font-bold text-ink-900 tabular-nums">{value}</div>
            <div className="text-sm text-ink-500">{label}</div>
        </motion.div>
    );
}

function HistorialChart({ corridas }: { corridas: CorridaHistorial[] }) {
    if (corridas.length === 0) {
        return (
            <div className="text-sm text-ink-400 text-center py-10">
                Todavía no hay corridas registradas — aparecerán aquí después de la primera vez
                que se limpie o se suba un lote.
            </div>
        );
    }

    const datos = [...corridas].reverse().slice(-14);
    const BAR_H = 88;

    return (
        <div className="overflow-x-auto">
            <div className="flex items-end gap-3 h-40 pb-1 min-w-fit px-1">
                {datos.map((c, i) => {
                    const erroresH = c.total > 0 ? (c.errores / c.total) * BAR_H : 0;
                    const sinH = c.total > 0 ? (c.sin_resultado / c.total) * BAR_H : 0;
                    const exitosasH = c.total > 0 ? (c.exitosas / c.total) * BAR_H : 0;
                    return (
                        <motion.div
                            key={c.timestamp}
                            initial={{ opacity: 0, scaleY: 0 }}
                            animate={{ opacity: 1, scaleY: 1 }}
                            transition={{ duration: 0.3, delay: i * 0.03 }}
                            style={{ transformOrigin: "bottom" }}
                            className="flex flex-col items-center gap-1 flex-shrink-0 w-8"
                            title={`${c.fecha} — ${c.exitosas} exitosas, ${c.sin_resultado} sin resultado, ${c.errores} errores de ${c.total}`}
                        >
                            <span className="text-[10px] text-ink-400 tabular-nums">{c.pct_exito}%</span>
                            <div
                                className="w-full rounded-sm overflow-hidden flex flex-col justify-end bg-ink-100"
                                style={{ height: BAR_H }}
                            >
                                {erroresH > 0 && <div style={{ height: erroresH }} className="bg-critical" />}
                                {sinH > 0 && <div style={{ height: sinH }} className="bg-caution" />}
                                {exitosasH > 0 && <div style={{ height: exitosasH }} className="bg-positive" />}
                            </div>
                            <span className="text-[10px] text-ink-400 tabular-nums">{c.total}</span>
                        </motion.div>
                    );
                })}
            </div>
            <div className="flex items-center gap-4 mt-3 text-xs text-ink-500">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-positive" /> Exitosas</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-caution" /> Sin resultado</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-critical" /> Errores</span>
            </div>
        </div>
    );
}

function AccionBoton({
    icon: Icon,
    label,
    onClick,
    loading,
    disabled,
    variant = "secondary",
}: {
    icon: typeof Play;
    label: string;
    onClick: () => void;
    loading: boolean;
    disabled?: boolean;
    variant?: "secondary" | "danger";
}) {
    const colorClass =
        variant === "danger"
            ? "border-critical/25 text-critical hover:bg-critical-soft hover:border-critical/30"
            : "border-hairline text-ink-700 hover:bg-surface-sunken hover:border-primary/40";
    return (
        <button
            onClick={onClick}
            disabled={loading || disabled}
            className={`inline-flex items-center justify-center gap-2 rounded-full border-2 bg-white px-4 py-2 text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${colorClass}`}
        >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Icon size={16} />}
            {label}
        </button>
    );
}

type EtapaSubida = "preparando" | "subiendo" | "confirmando" | "iniciando";

const ETAPAS: { id: EtapaSubida; label: string }[] = [
    { id: "preparando", label: "Preparando la subida" },
    { id: "subiendo", label: "Subiendo el archivo" },
    { id: "confirmando", label: "Entregando el lote al servidor RUAF" },
    { id: "iniciando", label: "Esperando que empiece el procesamiento" },
];

function ProgresoSubida({
    archivo,
    etapa,
    progreso,
    onCancel,
}: {
    archivo: File;
    etapa: EtapaSubida;
    progreso: number;
    onCancel?: () => void;
}) {
    const actual = ETAPAS.findIndex((e) => e.id === etapa);
    const determinado = etapa === "subiendo";
    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-primary/25 bg-primary/5 p-5"
            role="status"
            aria-live="polite"
        >
            <div className="mb-4 flex items-center gap-3">
                <motion.div
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                    className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"
                >
                    <UploadCloud size={20} />
                </motion.div>
                <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink-900">{archivo.name}</p>
                    <p className="text-xs text-ink-500">{ETAPAS[actual].label}…</p>
                </div>
                {onCancel && (
                    <button type="button" onClick={onCancel} className="btn btn-ghost py-1.5 text-sm text-critical">
                        <CircleStop size={15} />
                        Cancelar
                    </button>
                )}
            </div>

            <div className="relative mb-4 h-2 overflow-hidden rounded-full bg-ink-100">
                {determinado ? (
                    <motion.div
                        className="h-full rounded-full bg-primary"
                        animate={{ width: `${progreso}%` }}
                        transition={{ ease: "easeOut", duration: 0.3 }}
                    />
                ) : (
                    <motion.div
                        className="absolute inset-y-0 w-1/3 rounded-full bg-primary"
                        animate={{ left: ["-33%", "100%"] }}
                        transition={{ duration: 1.3, repeat: Infinity, ease: "easeInOut" }}
                    />
                )}
            </div>

            <ol className="space-y-2">
                {ETAPAS.map((e, i) => (
                    <li key={e.id} className="flex items-center gap-2 text-sm">
                        {i < actual ? (
                            <CheckCircle2 size={16} className="text-positive" />
                        ) : i === actual ? (
                            <Loader2 size={16} className="animate-spin text-primary" />
                        ) : (
                            <span className="mx-[3px] h-2.5 w-2.5 rounded-full border-2 border-ink-200" />
                        )}
                        <span className={i === actual ? "font-medium text-ink-900" : i < actual ? "text-ink-500" : "text-ink-400"}>
                            {e.label}
                            {e.id === "subiendo" && i === actual && <span className="tabular"> · {progreso}%</span>}
                        </span>
                    </li>
                ))}
            </ol>
        </motion.div>
    );
}

function AyudaModal({ onClose }: { onClose: () => void }) {
    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [onClose]);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ opacity: 0, y: 16, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 16, scale: 0.98 }}
                transition={{ duration: 0.2 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto p-6 sm:p-7"
            >
                <div className="flex items-start justify-between mb-4">
                    <h2 className="text-xl font-bold text-ink-900">Cómo usar esta página</h2>
                    <button onClick={onClose} className="text-ink-400 hover:text-ink-700 -mt-1 -mr-1 p-1">
                        <X size={20} />
                    </button>
                </div>

                <div className="space-y-4 text-sm text-ink-700">
                    <div>
                        <p className="font-semibold text-ink-900 mb-1">¿Qué hace?</p>
                        <p>
                            Consulta automáticamente en RUAF, cédula por cédula, si la persona está afiliada
                            y cotizando a salud, y con qué EPS. El proceso corre solo, en un servidor — esta
                            página solo lo muestra y te deja controlarlo.
                        </p>
                    </div>
                    <div>
                        <p className="font-semibold text-ink-900 mb-1">Subir un lote</p>
                        <p>
                            Un archivo <code className="bg-ink-100 px-1 rounded">.xlsx</code> con columnas{" "}
                            <code className="bg-ink-100 px-1 rounded">Cedula</code> y{" "}
                            <code className="bg-ink-100 px-1 rounded">FechaExpedicion</code>. Al subirlo,
                            reemplaza el lote actual (el anterior queda archivado, no se pierde). Solo se
                            puede subir uno nuevo cuando no hay nada procesando.
                        </p>
                    </div>
                    <div>
                        <p className="font-semibold text-ink-900 mb-1">Descargar el resultado</p>
                        <p>
                            El botón "Descargar resultado" te da un Excel simple: por cada cédula, si está
                            cotizando o no, con qué EPS, o — si no se pudo verificar — el motivo puntual.
                            Podés descargarlo incluso mientras el lote sigue procesando (solo trae lo que ya
                            se alcanzó a consultar).
                        </p>
                    </div>
                    <div className="rounded-xl bg-caution-soft border border-caution/25 p-4">
                        <p className="font-semibold text-caution flex items-center gap-2 mb-1">
                            <Laptop size={16} /> Mientras esté "Procesando"
                        </p>
                        <p className="text-caution">
                            El servidor sale a internet a través de un túnel que corre desde una laptop.{" "}
                            <strong>No se puede cerrar la tapa del laptop mientras haya un lote corriendo</strong>{" "}
                            — al cerrarla, el túnel se corta y el proceso empieza a fallar. Dejala abierta y
                            despierta (o conectada a un monitor externo) hasta que quede "Disponible" otra vez.
                        </p>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}

export default function RuafPage() {
    const [estado, setEstado] = useState<RuafEstado | null>(null);
    const [historial, setHistorial] = useState<CorridaHistorial[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");

    const [accionEnCurso, setAccionEnCurso] = useState<string | null>(null);
    const [feedback, setFeedback] = useState<{ ok: boolean; texto: string } | null>(null);
    const [mostrarAyuda, setMostrarAyuda] = useState(false);

    const [archivo, setArchivo] = useState<File | null>(null);
    const [arrastrando, setArrastrando] = useState(false);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const [segundosRestantes, setSegundosRestantes] = useState(0);

    const [etapa, setEtapa] = useState<EtapaSubida | null>(null);
    const [progreso, setProgreso] = useState(0);
    const subida = useAbortable();
    const estadoCardRef = useRef<HTMLDivElement | null>(null);

    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const feedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // el historial casi no cambia, no hace falta pedirlo junto al estado cada 10s
    const cargarEstado = useCallback(async (esRefresh: boolean) => {
        if (esRefresh) setRefreshing(true);
        try {
            const estadoData = await apiClient.get<RuafEstado>("/api/ruaf/estado");
            setEstado(estadoData);
            setSegundosRestantes(estadoData.tiempo_estimado_minutos * 60);
            setError("");
        } catch (err: any) {
            setError(err.message || "Error al consultar el estado de RUAF");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    const cargarHistorial = useCallback(async () => {
        try {
            const historialData = await apiClient.get<{ corridas: CorridaHistorial[] }>("/api/ruaf/historial");
            setHistorial(historialData.corridas || []);
        } catch {
            // no pasa nada, se queda con el ultimo valor
        }
    }, []);

    const cargarTodo = useCallback(
        async (esRefresh: boolean) => {
            await Promise.all([cargarEstado(esRefresh), cargarHistorial()]);
        },
        [cargarEstado, cargarHistorial]
    );

    useEffect(() => {
        cargarTodo(false);
        intervalRef.current = setInterval(() => cargarEstado(true), REFRESH_MS);
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [cargarTodo, cargarEstado]);

    useEffect(() => {
        if (estado?.procesando) {
            tickRef.current = setInterval(() => {
                setSegundosRestantes((s) => Math.max(0, s - 1));
            }, 1000);
        }
        return () => {
            if (tickRef.current) clearInterval(tickRef.current);
        };
    }, [estado?.procesando]);

    const mostrarFeedback = (ok: boolean, texto: string) => {
        if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
        setFeedback({ ok, texto });
        feedbackTimeoutRef.current = setTimeout(() => setFeedback(null), 6000);
    };

    const ejecutarAccion = async (nombre: string, endpoint: string, confirmar?: string, afectaHistorial = false) => {
        if (confirmar && !window.confirm(confirmar)) return;
        setAccionEnCurso(nombre);
        try {
            const resp = await apiClient.post<RuafAccionResponse>(endpoint);
            mostrarFeedback(resp.ok, resp.ok ? resp.mensaje : resp.error || "Ocurrió un error.");
        } catch (err: any) {
            mostrarFeedback(false, err.message || "No se pudo completar la acción.");
        } finally {
            setAccionEnCurso(null);
            if (afectaHistorial) {
                cargarTodo(true);
            } else {
                cargarEstado(true);
            }
        }
    };

    const elegirArchivo = (f: File | null) => {
        if (f && !f.name.toLowerCase().endsWith(".xlsx")) {
            mostrarFeedback(false, "El archivo debe ser .xlsx");
            return;
        }
        setArchivo(f);
    };

    const subirLote = async () => {
        if (!archivo) return;
        const signal = subida.begin();
        setProgreso(0);
        setEtapa("preparando");
        try {
            // El archivo va directo del navegador a S3 con una URL prefirmada y
            // recién ahí se le avisa al EC2 que lo baje: así el lote no queda
            // limitado por el tamaño máximo del cuerpo de la request.
            const { upload_url, s3_key } = await apiClient.post<RuafSubidaUrlResponse>(
                "/api/ruaf/subir_lote_url",
                { nombre_archivo: archivo.name },
                signal
            );
            setEtapa("subiendo");
            await apiClient.putToSignedUrl(upload_url, archivo, XLSX_CONTENT_TYPE, { onProgress: setProgreso, signal });
            // Desde aquí ya no se cancela: el EC2 podría haber tomado el lote.
            setEtapa("confirmando");
            const resp = await apiClient.post<RuafAccionResponse>("/api/ruaf/subir_lote_confirmar", { s3_key });
            if (!resp.ok) {
                setEtapa(null);
                mostrarFeedback(false, resp.error || "Ocurrió un error.");
                cargarEstado(true);
                return;
            }
            mostrarFeedback(true, resp.mensaje);
            setArchivo(null);
            if (fileInputRef.current) fileInputRef.current.value = "";
            setEtapa("iniciando");
            estadoCardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
            cargarTodo(true);
        } catch (err: any) {
            setEtapa(null);
            if (isAbortError(err)) {
                mostrarFeedback(false, "Subida cancelada. El lote no se envió.");
                return;
            }
            mostrarFeedback(false, err.message || "No se pudo subir el lote.");
            cargarEstado(true);
        }
    };

    const cancelarSubida = () => subida.abort();

    // Mientras el EC2 arranca el lote, se consulta más seguido para mostrar el avance apenas empiece.
    useEffect(() => {
        if (etapa !== "iniciando") return;
        const poll = setInterval(() => cargarEstado(true), ARRANQUE_POLL_MS);
        const limite = setTimeout(() => setEtapa(null), ARRANQUE_TIMEOUT_MS);
        return () => {
            clearInterval(poll);
            clearTimeout(limite);
        };
    }, [etapa, cargarEstado]);

    if (etapa === "iniciando" && estado?.procesando) setEtapa(null);

    const descargarResumen = async () => {
        setAccionEnCurso("descargar");
        try {
            const blob = await apiClient.getBlob("/api/ruaf/resumen");
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `resumen_ruaf_${new Date().toISOString().slice(0, 10)}.xlsx`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
        } catch (err: any) {
            mostrarFeedback(false, err.message || "No se pudo descargar el resumen.");
        } finally {
            setAccionEnCurso(null);
        }
    };

    const pct = estado && estado.total > 0 ? Math.round((estado.procesadas / estado.total) * 100) : 0;
    // si el EC2 no responde, disponible y procesando llegan los dos en false
    const sinConexion = !!estado && !estado.disponible && !estado.procesando;
    const puedeSubir = !!estado && estado.disponible && !estado.procesando && etapa === null;
    const arrancando = etapa === "iniciando";

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex items-start justify-between gap-4">
                <PageHeader
                            icon={Radar}
                    title="Estado de RUAF"
                    description="Disponibilidad, avance en vivo e historial del proceso automático de consultas a RUAF."
                />
                <button
                    onClick={() => setMostrarAyuda(true)}
                    className="btn btn-secondary text-sm py-2 px-4 flex-shrink-0 mt-1"
                >
                    <HelpCircle size={16} />
                    Cómo usarlo
                </button>
            </div>

            <AnimatePresence>{mostrarAyuda && <AyudaModal onClose={() => setMostrarAyuda(false)} />}</AnimatePresence>

            {feedback && (
                <div
                    className={`mt-4 flex items-start gap-2 rounded-lg px-3 py-2.5 text-sm ${
                        feedback.ok ? "bg-positive-soft text-positive" : "bg-critical-soft text-critical"
                    }`}
                >
                    {feedback.ok ? <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0" /> : <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />}
                    <span>{feedback.texto}</span>
                </div>
            )}

            {loading && <LoadingSpinner text="Consultando estado de RUAF..." />}
            {!loading && error && <ErrorMessage message={error} />}

            {!loading && !error && estado && (
                <div className="space-y-6">
                    <div
                        ref={estadoCardRef}
                        className={`card scroll-mt-6 p-5 transition-shadow sm:p-6 ${arrancando ? "ring-2 ring-primary/30" : ""}`}
                    >
                        <div className="flex flex-wrap items-center gap-5">
                            <ProgressRing pct={pct} procesando={estado.procesando} />

                            <div className="flex-1 min-w-[200px]">
                                <div className="flex flex-wrap items-center gap-3 mb-2">
                                    {arrancando ? (
                                        <span className="px-3 py-1.5 rounded-full text-sm font-medium bg-primary/10 text-primary inline-flex items-center gap-2">
                                            <Loader2 size={16} className="animate-spin" />
                                            Iniciando lote
                                        </span>
                                    ) : estado.procesando ? (
                                        <span className="px-3 py-1.5 rounded-full text-sm font-medium bg-caution-soft text-caution inline-flex items-center gap-2">
                                            <Loader2 size={16} className="animate-spin" />
                                            Procesando
                                        </span>
                                    ) : estado.disponible ? (
                                        <span className="px-3 py-1.5 rounded-full text-sm font-medium bg-positive-soft text-positive inline-flex items-center gap-2">
                                            <CheckCircle2 size={16} />
                                            Disponible
                                        </span>
                                    ) : (
                                        <span className="px-3 py-1.5 rounded-full text-sm font-medium bg-critical-soft text-critical inline-flex items-center gap-2">
                                            <AlertTriangle size={16} />
                                            Sin conexión
                                        </span>
                                    )}
                                </div>
                                {arrancando ? (
                                    <p className="text-sm text-ink-500">
                                        Lote recibido. Esperando que el servidor de RUAF empiece a procesarlo…
                                    </p>
                                ) : estado.procesando ? (
                                    <p className="text-sm text-ink-500">
                                        {estado.pendientes} cédula{estado.pendientes !== 1 ? "s" : ""} pendiente
                                        {estado.pendientes !== 1 ? "s" : ""} · tiempo estimado{" "}
                                        <span className="font-semibold text-ink-700 tabular-nums">
                                            {formatearReloj(segundosRestantes)}
                                        </span>
                                    </p>
                                ) : estado.disponible ? (
                                    <p className="text-sm text-ink-500">Listo para recibir un nuevo lote.</p>
                                ) : (
                                    <p className="text-sm text-critical">
                                        No se pudo conectar con el servidor de RUAF (EC2 apagado o túnel caído).
                                        Reintenta en unos minutos.
                                    </p>
                                )}
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={descargarResumen}
                                    disabled={accionEnCurso === "descargar" || estado.procesadas === 0}
                                    className="btn btn-secondary text-sm py-2 px-4 disabled:opacity-40 disabled:cursor-not-allowed"
                                    title={estado.procesadas === 0 ? "Todavía no hay resultados para descargar" : "Descargar resultado (cotizando / EPS / error)"}
                                >
                                    {accionEnCurso === "descargar" ? (
                                        <Loader2 size={14} className="animate-spin" />
                                    ) : (
                                        <Download size={14} />
                                    )}
                                    Descargar resultado
                                </button>
                                <button
                                    onClick={() => cargarTodo(true)}
                                    disabled={refreshing}
                                    className="btn btn-secondary text-sm py-2 px-4"
                                >
                                    <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                        <StatTile icon={ListChecks} label="Total" value={estado.total} colorClass="bg-ink-100 text-ink-600" delay={0} />
                        <StatTile icon={CheckCircle2} label="Exitosas" value={estado.exitosas} colorClass="bg-positive-soft text-positive" delay={0.05} />
                        <StatTile icon={Clock} label="Procesadas" value={estado.procesadas} colorClass="bg-primary/10 text-primary" delay={0.1} />
                        <StatTile icon={Timer} label="Pendientes" value={estado.pendientes} colorClass="bg-caution-soft text-caution" delay={0.15} />
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.2 }}
                        className="card p-5 sm:p-6"
                    >
                        <h2 className="text-lg font-bold text-ink-900 mb-1">Historial de corridas</h2>
                        <p className="text-sm text-ink-500 mb-4">
                            Cada barra es un lote que se cerró (limpiar o subir un lote nuevo).
                        </p>
                        <HistorialChart corridas={historial} />
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.25 }}
                        className="card p-5 sm:p-6"
                    >
                        <h2 className="text-lg font-bold text-ink-900 mb-1">Acciones</h2>
                        <p className="text-sm text-ink-500 mb-4">
                            Actúa directo sobre el proceso del servidor — sin necesitar terminal.
                        </p>

                        <div className="flex flex-wrap gap-3 mb-6">
                            <AccionBoton
                                icon={Pause}
                                label="Pausar"
                                loading={accionEnCurso === "pausar"}
                                onClick={() => ejecutarAccion("pausar", "/api/ruaf/pausar", "¿Pausar el proceso? Se detiene el scraper y el watchdog hasta que lo reanudes.")}
                            />
                            <AccionBoton
                                icon={Play}
                                label="Reanudar"
                                loading={accionEnCurso === "reanudar"}
                                onClick={() => ejecutarAccion("reanudar", "/api/ruaf/reanudar")}
                            />
                            <AccionBoton
                                icon={Trash2}
                                label="Limpiar registros"
                                variant="danger"
                                loading={accionEnCurso === "limpiar"}
                                onClick={() => ejecutarAccion("limpiar", "/api/ruaf/limpiar", "¿Limpiar los registros actuales? El resultado actual se archiva (no se pierde) y las cédulas quedan pendientes otra vez.", true)}
                            />
                        </div>

                        <div className="border-t border-hairline pt-5">
                            <label className="block text-sm font-semibold text-ink-900 mb-2">Subir un lote nuevo</label>

                            {!puedeSubir && etapa === null && (
                                <div className="mb-3 flex items-start gap-2 rounded-lg bg-caution-soft border border-caution/25 px-3 py-2.5 text-sm text-caution">
                                    <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
                                    <span>
                                        {sinConexion
                                            ? "No se puede subir un lote: el servidor de RUAF no responde ahora mismo."
                                            : "Hay un lote procesando ahora — no se puede subir uno nuevo hasta que termine o lo pauses."}
                                    </span>
                                </div>
                            )}

                            {etapa && etapa !== "iniciando" && archivo ? (
                                <ProgresoSubida
                                    archivo={archivo}
                                    etapa={etapa}
                                    progreso={progreso}
                                    onCancel={etapa === "preparando" || etapa === "subiendo" ? cancelarSubida : undefined}
                                />
                            ) : (
                            <div
                                onDragOver={(e) => {
                                    if (!puedeSubir) return;
                                    e.preventDefault();
                                    setArrastrando(true);
                                }}
                                onDragLeave={() => setArrastrando(false)}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    setArrastrando(false);
                                    if (!puedeSubir) return;
                                    elegirArchivo(e.dataTransfer.files?.[0] || null);
                                }}
                                onClick={() => puedeSubir && fileInputRef.current?.click()}
                                className={`relative rounded-xl border-2 border-dashed p-6 text-center transition-colors ${
                                    !puedeSubir
                                        ? "border-hairline bg-surface-sunken cursor-not-allowed opacity-60"
                                        : arrastrando
                                        ? "border-primary bg-primary/5 cursor-pointer"
                                        : "border-hairline hover:border-primary/40 hover:bg-surface-sunken cursor-pointer"
                                }`}
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".xlsx"
                                    disabled={!puedeSubir}
                                    onChange={(e) => elegirArchivo(e.target.files?.[0] || null)}
                                    className="hidden"
                                />

                                {archivo ? (
                                    <div className="flex items-center justify-center gap-3">
                                        <FileSpreadsheet size={28} className="text-primary flex-shrink-0" />
                                        <div className="text-left">
                                            <p className="text-sm font-medium text-ink-900">{archivo.name}</p>
                                            <p className="text-xs text-ink-500">{(archivo.size / 1024).toFixed(0)} KB</p>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setArchivo(null);
                                                if (fileInputRef.current) fileInputRef.current.value = "";
                                            }}
                                            className="text-ink-400 hover:text-critical p-1"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-2 text-ink-500">
                                        <UploadCloud size={28} className={puedeSubir ? "text-primary/60" : "text-ink-300"} />
                                        <p className="text-sm">
                                            <span className="font-medium text-primary">Elegí un archivo</span> o arrastralo aquí
                                        </p>
                                        <p className="text-xs text-ink-400">
                                            .xlsx con columnas Cedula y FechaExpedicion · límite ~150KB
                                        </p>
                                    </div>
                                )}
                            </div>

                            )}

                            {archivo && etapa === null && (
                                <button
                                    onClick={subirLote}
                                    disabled={!puedeSubir}
                                    title={!puedeSubir ? "Ya no se puede subir — el estado cambió mientras elegías el archivo" : undefined}
                                    className="btn btn-primary text-sm py-2 px-5 mt-3 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Upload size={14} />
                                    Subir y empezar
                                </button>
                            )}
                        </div>
                    </motion.div>

                    <p className="text-xs text-ink-400 text-center">
                        Actualizado: {estado.actualizado} · se refresca solo cada {REFRESH_MS / 1000} segundos
                    </p>
                </div>
            )}
        </div>
    );
}

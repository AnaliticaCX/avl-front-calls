"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
    AlertTriangle,
    CheckCircle2,
    Clock,
    Download,
    FileSpreadsheet,
    HelpCircle,
    Laptop,
    ListChecks,
    Loader2,
    Pause,
    Play,
    RefreshCw,
    Timer,
    Trash2,
    Upload,
    UploadCloud,
    X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import ErrorMessage from "../components/common/ErrorMessage";
import LoadingSpinner from "../components/common/LoadingSpinner";
import PageHeader from "../components/common/PageHeader";
import { CorridaHistorial, RuafAccionResponse, RuafEstado } from "../types/ruaf";
import { apiClient } from "../utils/api";

const REFRESH_MS = 10000;

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
                <circle cx="48" cy="48" r={R} fill="none" stroke="currentColor" strokeWidth="8" className="text-gray-100" />
                <motion.circle
                    cx="48"
                    cy="48"
                    r={R}
                    fill="none"
                    strokeWidth="8"
                    strokeLinecap="round"
                    className={procesando ? "text-amber-400" : "text-primary"}
                    stroke="currentColor"
                    strokeDasharray={CIRC}
                    initial={{ strokeDashoffset: CIRC }}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ duration: 0.7, ease: "easeOut" }}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-bold text-gray-900 tabular-nums">{pct}%</span>
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
            <div className="text-2xl font-bold text-gray-900 tabular-nums">{value}</div>
            <div className="text-sm text-gray-500">{label}</div>
        </motion.div>
    );
}

function HistorialChart({ corridas }: { corridas: CorridaHistorial[] }) {
    if (corridas.length === 0) {
        return (
            <div className="text-sm text-gray-400 text-center py-10">
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
                            <span className="text-[10px] text-gray-400 tabular-nums">{c.pct_exito}%</span>
                            <div
                                className="w-full rounded-sm overflow-hidden flex flex-col justify-end bg-gray-100"
                                style={{ height: BAR_H }}
                            >
                                {erroresH > 0 && <div style={{ height: erroresH }} className="bg-red-400" />}
                                {sinH > 0 && <div style={{ height: sinH }} className="bg-amber-400" />}
                                {exitosasH > 0 && <div style={{ height: exitosasH }} className="bg-green-500" />}
                            </div>
                            <span className="text-[10px] text-gray-400 tabular-nums">{c.total}</span>
                        </motion.div>
                    );
                })}
            </div>
            <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-green-500" /> Exitosas</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Sin resultado</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-400" /> Errores</span>
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
            ? "border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
            : "border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-primary/40";
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

function AyudaModal({ onClose }: { onClose: () => void }) {
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
                    <h2 className="text-xl font-bold text-gray-900">Cómo usar esta página</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-700 -mt-1 -mr-1 p-1">
                        <X size={20} />
                    </button>
                </div>

                <div className="space-y-4 text-sm text-gray-700">
                    <div>
                        <p className="font-semibold text-gray-900 mb-1">¿Qué hace?</p>
                        <p>
                            Consulta automáticamente en RUAF, cédula por cédula, si la persona está afiliada
                            y cotizando a salud, y con qué EPS. El proceso corre solo, en un servidor — esta
                            página solo lo muestra y te deja controlarlo.
                        </p>
                    </div>
                    <div>
                        <p className="font-semibold text-gray-900 mb-1">Subir un lote</p>
                        <p>
                            Un archivo <code className="bg-gray-100 px-1 rounded">.xlsx</code> con columnas{" "}
                            <code className="bg-gray-100 px-1 rounded">Cedula</code> y{" "}
                            <code className="bg-gray-100 px-1 rounded">FechaExpedicion</code>. Al subirlo,
                            reemplaza el lote actual (el anterior queda archivado, no se pierde). Solo se
                            puede subir uno nuevo cuando no hay nada procesando.
                        </p>
                    </div>
                    <div>
                        <p className="font-semibold text-gray-900 mb-1">Descargar el resultado</p>
                        <p>
                            El botón "Descargar resultado" te da un Excel simple: por cada cédula, si está
                            cotizando o no, con qué EPS, o — si no se pudo verificar — el motivo puntual.
                            Podés descargarlo incluso mientras el lote sigue procesando (solo trae lo que ya
                            se alcanzó a consultar).
                        </p>
                    </div>
                    <div className="rounded-xl bg-amber-50 border border-amber-200 p-4">
                        <p className="font-semibold text-amber-900 flex items-center gap-2 mb-1">
                            <Laptop size={16} /> Mientras esté "Procesando"
                        </p>
                        <p className="text-amber-900">
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

    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const cargarTodo = useCallback(async (esRefresh: boolean) => {
        if (esRefresh) setRefreshing(true);
        try {
            const [estadoData, historialData] = await Promise.all([
                apiClient.get<RuafEstado>("/api/ruaf/estado"),
                apiClient.get<{ corridas: CorridaHistorial[] }>("/api/ruaf/historial"),
            ]);
            setEstado(estadoData);
            setHistorial(historialData.corridas || []);
            setSegundosRestantes(estadoData.tiempo_estimado_minutos * 60);
            setError("");
        } catch (err: any) {
            setError(err.message || "Error al consultar el estado de RUAF");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        cargarTodo(false);
        intervalRef.current = setInterval(() => cargarTodo(true), REFRESH_MS);
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [cargarTodo]);

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
        setFeedback({ ok, texto });
        setTimeout(() => setFeedback(null), 6000);
    };

    const ejecutarAccion = async (nombre: string, endpoint: string, confirmar?: string) => {
        if (confirmar && !window.confirm(confirmar)) return;
        setAccionEnCurso(nombre);
        try {
            const resp = await apiClient.post<RuafAccionResponse>(endpoint);
            mostrarFeedback(resp.ok, resp.ok ? resp.mensaje : resp.error || "Ocurrió un error.");
        } catch (err: any) {
            mostrarFeedback(false, err.message || "No se pudo completar la acción.");
        } finally {
            setAccionEnCurso(null);
            cargarTodo(true);
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
        setAccionEnCurso("subir_lote");
        try {
            const formData = new FormData();
            formData.append("archivo", archivo);
            const resp = await apiClient.postFormData<RuafAccionResponse>("/api/ruaf/subir_lote", formData);
            mostrarFeedback(resp.ok, resp.ok ? resp.mensaje : resp.error || "Ocurrió un error.");
            if (resp.ok) {
                setArchivo(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
            }
        } catch (err: any) {
            mostrarFeedback(false, err.message || "No se pudo subir el lote.");
        } finally {
            setAccionEnCurso(null);
            cargarTodo(true);
        }
    };

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
    const puedeSubir = !!estado && !estado.procesando;

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex items-start justify-between gap-4">
                <PageHeader
                    title="Estado de RUAF"
                    description="Disponibilidad, avance en vivo e historial del proceso automático de consultas a RUAF."
                />
                <button
                    onClick={() => setMostrarAyuda(true)}
                    className="btn-secondary text-sm py-2 px-4 flex-shrink-0 mt-1"
                >
                    <HelpCircle size={16} />
                    Cómo usarlo
                </button>
            </div>

            <AnimatePresence>{mostrarAyuda && <AyudaModal onClose={() => setMostrarAyuda(false)} />}</AnimatePresence>

            {loading && <LoadingSpinner text="Consultando estado de RUAF..." />}
            {!loading && error && <ErrorMessage message={error} />}

            {!loading && !error && estado && (
                <div className="space-y-6">
                    <div className="card p-5 sm:p-6">
                        <div className="flex flex-wrap items-center gap-5">
                            <ProgressRing pct={pct} procesando={estado.procesando} />

                            <div className="flex-1 min-w-[200px]">
                                <div className="flex flex-wrap items-center gap-3 mb-2">
                                    {estado.disponible ? (
                                        <span className="px-3 py-1.5 rounded-full text-sm font-medium bg-green-100 text-green-700 inline-flex items-center gap-2">
                                            <CheckCircle2 size={16} />
                                            Disponible
                                        </span>
                                    ) : (
                                        <span className="px-3 py-1.5 rounded-full text-sm font-medium bg-amber-100 text-amber-700 inline-flex items-center gap-2">
                                            <Loader2 size={16} className="animate-spin" />
                                            Procesando
                                        </span>
                                    )}
                                </div>
                                {estado.disponible ? (
                                    <p className="text-sm text-gray-500">Listo para recibir un nuevo lote.</p>
                                ) : (
                                    <p className="text-sm text-gray-500">
                                        {estado.pendientes} cédula{estado.pendientes !== 1 ? "s" : ""} pendiente
                                        {estado.pendientes !== 1 ? "s" : ""} · tiempo estimado{" "}
                                        <span className="font-semibold text-gray-700 tabular-nums">
                                            {formatearReloj(segundosRestantes)}
                                        </span>
                                    </p>
                                )}
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={descargarResumen}
                                    disabled={accionEnCurso === "descargar" || estado.procesadas === 0}
                                    className="btn-secondary text-sm py-2 px-4 disabled:opacity-40 disabled:cursor-not-allowed"
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
                                    className="btn-secondary text-sm py-2 px-4"
                                >
                                    <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                        <StatTile icon={ListChecks} label="Total" value={estado.total} colorClass="bg-gray-100 text-gray-600" delay={0} />
                        <StatTile icon={CheckCircle2} label="Exitosas" value={estado.exitosas} colorClass="bg-green-100 text-green-600" delay={0.05} />
                        <StatTile icon={Clock} label="Procesadas" value={estado.procesadas} colorClass="bg-primary/10 text-primary" delay={0.1} />
                        <StatTile icon={Timer} label="Pendientes" value={estado.pendientes} colorClass="bg-amber-100 text-amber-600" delay={0.15} />
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.2 }}
                        className="card p-5 sm:p-6"
                    >
                        <h2 className="text-lg font-bold text-gray-900 mb-1">Historial de corridas</h2>
                        <p className="text-sm text-gray-500 mb-4">
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
                        <h2 className="text-lg font-bold text-gray-900 mb-1">Acciones</h2>
                        <p className="text-sm text-gray-500 mb-4">
                            Actúa directo sobre el proceso del servidor — sin necesitar terminal.
                        </p>

                        {feedback && (
                            <div
                                className={`mb-4 flex items-start gap-2 rounded-lg px-3 py-2.5 text-sm ${
                                    feedback.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                                }`}
                            >
                                {feedback.ok ? <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0" /> : <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />}
                                <span>{feedback.texto}</span>
                            </div>
                        )}

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
                                onClick={() => ejecutarAccion("limpiar", "/api/ruaf/limpiar", "¿Limpiar los registros actuales? El resultado actual se archiva (no se pierde) y las cédulas quedan pendientes otra vez.")}
                            />
                        </div>

                        <div className="border-t border-gray-100 pt-5">
                            <label className="block text-sm font-semibold text-gray-900 mb-2">Subir un lote nuevo</label>

                            {!puedeSubir && (
                                <div className="mb-3 flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2.5 text-sm text-amber-800">
                                    <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
                                    <span>
                                        Hay un lote procesando ahora — no se puede subir uno nuevo hasta que
                                        termine o lo pauses.
                                    </span>
                                </div>
                            )}

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
                                        ? "border-gray-100 bg-gray-50 cursor-not-allowed opacity-60"
                                        : arrastrando
                                        ? "border-primary bg-primary/5 cursor-pointer"
                                        : "border-gray-200 hover:border-primary/40 hover:bg-gray-50 cursor-pointer"
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
                                            <p className="text-sm font-medium text-gray-900">{archivo.name}</p>
                                            <p className="text-xs text-gray-500">{(archivo.size / 1024).toFixed(0)} KB</p>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setArchivo(null);
                                                if (fileInputRef.current) fileInputRef.current.value = "";
                                            }}
                                            className="text-gray-400 hover:text-red-500 p-1"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-2 text-gray-500">
                                        <UploadCloud size={28} className={puedeSubir ? "text-primary/60" : "text-gray-300"} />
                                        <p className="text-sm">
                                            <span className="font-medium text-primary">Elegí un archivo</span> o arrastralo aquí
                                        </p>
                                        <p className="text-xs text-gray-400">
                                            .xlsx con columnas Cedula y FechaExpedicion · límite ~150KB
                                        </p>
                                    </div>
                                )}
                            </div>

                            {archivo && (
                                <button
                                    onClick={subirLote}
                                    disabled={accionEnCurso === "subir_lote"}
                                    className="btn-primary text-sm py-2 px-5 mt-3 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {accionEnCurso === "subir_lote" ? (
                                        <Loader2 size={14} className="animate-spin" />
                                    ) : (
                                        <Upload size={14} />
                                    )}
                                    Subir y empezar
                                </button>
                            )}
                        </div>
                    </motion.div>

                    <p className="text-xs text-gray-400 text-center">
                        Actualizado: {estado.actualizado} · se refresca solo cada {REFRESH_MS / 1000} segundos
                    </p>
                </div>
            )}
        </div>
    );
}

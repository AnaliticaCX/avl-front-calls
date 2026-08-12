"use client";

import { motion } from "framer-motion";
import {
    AlertTriangle,
    CheckCircle2,
    Clock,
    ListChecks,
    Loader2,
    Pause,
    Play,
    RefreshCw,
    Timer,
    Trash2,
    Upload,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import ErrorMessage from "../components/common/ErrorMessage";
import LoadingSpinner from "../components/common/LoadingSpinner";
import PageHeader from "../components/common/PageHeader";
import { CorridaHistorial, RuafAccionResponse, RuafEstado } from "../types/ruaf";
import { apiClient } from "../utils/api";

const REFRESH_MS = 10000;

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
    variant = "secondary",
}: {
    icon: typeof Play;
    label: string;
    onClick: () => void;
    loading: boolean;
    variant?: "secondary" | "danger";
}) {
    const colorClass =
        variant === "danger"
            ? "border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
            : "border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-primary/40";
    return (
        <button
            onClick={onClick}
            disabled={loading}
            className={`inline-flex items-center justify-center gap-2 rounded-full border-2 bg-white px-4 py-2 text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${colorClass}`}
        >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Icon size={16} />}
            {label}
        </button>
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

    const [archivo, setArchivo] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const cargarTodo = useCallback(async (esRefresh: boolean) => {
        if (esRefresh) setRefreshing(true);
        try {
            const [estadoData, historialData] = await Promise.all([
                apiClient.get<RuafEstado>("/api/ruaf/estado"),
                apiClient.get<{ corridas: CorridaHistorial[] }>("/api/ruaf/historial"),
            ]);
            setEstado(estadoData);
            setHistorial(historialData.corridas || []);
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

    const mostrarFeedback = (ok: boolean, texto: string) => {
        setFeedback({ ok, texto });
        setTimeout(() => setFeedback(null), 6000);
    };

    const ejecutarAccion = async (
        nombre: string,
        endpoint: string,
        confirmar?: string
    ) => {
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

    const pct = estado && estado.total > 0 ? Math.round((estado.procesadas / estado.total) * 100) : 0;

    return (
        <div className="max-w-4xl mx-auto">
            <PageHeader
                title="Estado de RUAF"
                description="Disponibilidad, avance en vivo e historial del proceso automático de consultas a RUAF."
            />

            {loading && <LoadingSpinner text="Consultando estado de RUAF..." />}
            {!loading && error && <ErrorMessage message={error} />}

            {!loading && !error && estado && (
                <div className="space-y-6">
                    <div className="card p-5 sm:p-6">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <div className="flex flex-wrap items-center gap-3">
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
                                <span className="text-sm text-gray-500">
                                    {estado.disponible
                                        ? "Listo para recibir un nuevo lote"
                                        : `${estado.pendientes} cédula${estado.pendientes !== 1 ? "s" : ""} pendiente${estado.pendientes !== 1 ? "s" : ""} · ~${estado.tiempo_estimado_minutos} min restante${estado.tiempo_estimado_minutos !== 1 ? "s" : ""}`}
                                </span>
                            </div>
                            <button
                                onClick={() => cargarTodo(true)}
                                disabled={refreshing}
                                className="btn-secondary text-sm py-2 px-4"
                            >
                                <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
                                Actualizar
                            </button>
                        </div>

                        <div className="mt-5">
                            <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                                <span>Progreso del lote actual</span>
                                <span className="tabular-nums">{pct}%</span>
                            </div>
                            <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                                <motion.div
                                    className="h-full rounded-full bg-primary"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${pct}%` }}
                                    transition={{ duration: 0.6, ease: "easeOut" }}
                                />
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

                        <div className="flex flex-wrap gap-3 mb-5">
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
                            <p className="text-xs text-gray-500 mb-3">
                                Archivo .xlsx con columnas <code className="bg-gray-100 px-1 rounded">Cedula</code> y{" "}
                                <code className="bg-gray-100 px-1 rounded">FechaExpedicion</code>. Reemplaza el lote actual
                                (el anterior queda archivado). Límite ~150KB — para lotes grandes, seguir subiendo por scp.
                            </p>
                            <div className="flex flex-wrap items-center gap-3">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".xlsx"
                                    onChange={(e) => setArchivo(e.target.files?.[0] || null)}
                                    className="text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-primary/10 file:text-primary file:text-sm file:font-medium hover:file:bg-primary/20"
                                />
                                <button
                                    onClick={subirLote}
                                    disabled={!archivo || accionEnCurso === "subir_lote"}
                                    className="btn-primary text-sm py-2 px-4 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {accionEnCurso === "subir_lote" ? (
                                        <Loader2 size={14} className="animate-spin" />
                                    ) : (
                                        <Upload size={14} />
                                    )}
                                    Subir
                                </button>
                            </div>
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

"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Clock, ListChecks, Loader2, RefreshCw, Timer } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import ErrorMessage from "../components/common/ErrorMessage";
import LoadingSpinner from "../components/common/LoadingSpinner";
import PageHeader from "../components/common/PageHeader";
import { RuafEstado } from "../types/ruaf";
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
            className="card p-5"
        >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${colorClass}`}>
                <Icon size={20} />
            </div>
            <div className="text-2xl font-bold text-gray-900 tabular-nums">{value}</div>
            <div className="text-sm text-gray-500">{label}</div>
        </motion.div>
    );
}

export default function RuafPage() {
    const [estado, setEstado] = useState<RuafEstado | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const cargarEstado = useCallback(async (esRefresh: boolean) => {
        if (esRefresh) setRefreshing(true);
        try {
            const data = await apiClient.get<RuafEstado>("/api/ruaf/estado");
            setEstado(data);
            setError("");
        } catch (err: any) {
            setError(err.message || "Error al consultar el estado de RUAF");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        cargarEstado(false);
        intervalRef.current = setInterval(() => cargarEstado(true), REFRESH_MS);
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [cargarEstado]);

    const pct = estado && estado.total > 0 ? Math.round((estado.procesadas / estado.total) * 100) : 0;

    return (
        <div className="max-w-4xl mx-auto">
            <PageHeader
                title="Estado de RUAF"
                description="Disponibilidad y avance en vivo del proceso automático de consultas a RUAF."
            />

            {loading && <LoadingSpinner text="Consultando estado de RUAF..." />}
            {!loading && error && <ErrorMessage message={error} />}

            {!loading && !error && estado && (
                <div className="space-y-6">
                    <div className="card p-6">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
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
                                onClick={() => cargarEstado(true)}
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

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <StatTile icon={ListChecks} label="Total" value={estado.total} colorClass="bg-gray-100 text-gray-600" delay={0} />
                        <StatTile icon={CheckCircle2} label="Exitosas" value={estado.exitosas} colorClass="bg-green-100 text-green-600" delay={0.05} />
                        <StatTile icon={Clock} label="Procesadas" value={estado.procesadas} colorClass="bg-primary/10 text-primary" delay={0.1} />
                        <StatTile icon={Timer} label="Pendientes" value={estado.pendientes} colorClass="bg-amber-100 text-amber-600" delay={0.15} />
                    </div>

                    <p className="text-xs text-gray-400 text-center">
                        Actualizado: {estado.actualizado} · se refresca solo cada {REFRESH_MS / 1000} segundos
                    </p>
                </div>
            )}
        </div>
    );
}

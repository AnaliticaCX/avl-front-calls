"use client";

import { useEffect, useState } from "react";
import ErrorMessage from "../components/common/ErrorMessage";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { RuafEstado } from "../types/ruaf";
import { apiClient } from "../utils/api";

export default function RuafPage() {
    const [estado, setEstado] = useState<RuafEstado | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        apiClient
            .get<RuafEstado>("/api/ruaf/estado")
            .then(setEstado)
            .catch((err: any) => setError(err.message || "Error al consultar el estado de RUAF"))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="max-w-3xl mx-auto">
            <div className="mb-6">
                <h1 className="text-4xl font-bold text-gray-900 mb-2">RUAF (solo para test)</h1>
                <p className="text-gray-600">
                    Vista mínima del estado del proceso de consultas RUAF. Datos crudos, sin
                    diseño final todavía.
                </p>
            </div>

            {loading && <LoadingSpinner text="Consultando estado de RUAF..." />}
            {!loading && error && <ErrorMessage message={error} />}

            {!loading && !error && estado && (
                <div className="card p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <span
                            className={`inline-block w-3 h-3 rounded-full ${estado.disponible ? "bg-green-500" : "bg-yellow-500"
                                }`}
                        />
                        <span className="text-lg font-semibold text-gray-900">
                            {estado.disponible ? "Disponible" : "Procesando"}
                        </span>
                    </div>

                    <dl className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <dt className="text-gray-500">Procesando</dt>
                            <dd className="font-medium text-gray-900">{String(estado.procesando)}</dd>
                        </div>
                        <div>
                            <dt className="text-gray-500">Tiempo estimado (min)</dt>
                            <dd className="font-medium text-gray-900">{estado.tiempo_estimado_minutos}</dd>
                        </div>
                        <div>
                            <dt className="text-gray-500">Total</dt>
                            <dd className="font-medium text-gray-900">{estado.total}</dd>
                        </div>
                        <div>
                            <dt className="text-gray-500">Procesadas</dt>
                            <dd className="font-medium text-gray-900">{estado.procesadas}</dd>
                        </div>
                        <div>
                            <dt className="text-gray-500">Pendientes</dt>
                            <dd className="font-medium text-gray-900">{estado.pendientes}</dd>
                        </div>
                        <div>
                            <dt className="text-gray-500">Exitosas</dt>
                            <dd className="font-medium text-gray-900">{estado.exitosas}</dd>
                        </div>
                        <div className="col-span-2">
                            <dt className="text-gray-500">Actualizado</dt>
                            <dd className="font-medium text-gray-900">{estado.actualizado}</dd>
                        </div>
                    </dl>
                </div>
            )}
        </div>
    );
}

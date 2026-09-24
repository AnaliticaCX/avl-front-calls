"use client";

import { CircleStop, FileText, Loader2, Search } from "lucide-react";
import { useState } from "react";
import { loanStatusTone, Stack, StatusPill } from "../../components/common/cells";
import ErrorMessage from "../../components/common/ErrorMessage";
import InfoCallout from "../../components/common/InfoCallout";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import PageHeader from "../../components/common/PageHeader";
import Table, { type Column } from "../../components/common/Table";
import Input from "../../components/Input";
import { useAbortable } from "../../hooks/useAbortable";
import { EstadoCuentaResponse } from "../../types/quemadores";
import { apiClient, isAbortError } from "../../utils/api";
import { downloadEstadoCuentaPDF } from "../../utils/download";
import { formatCurrency } from "../../utils/formatters";

export default function EstadoCuentaPage() {
    const [loanNumber, setLoanNumber] = useState("");
    const [result, setResult] = useState<EstadoCuentaResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const { begin, abort } = useAbortable();

    const cancelar = () => {
        abort();
        setLoading(false);
    };

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!loanNumber.trim()) {
            setError("Debes ingresar el número de la obligación.");
            return;
        }

        const signal = begin();
        setLoading(true);
        setError("");
        setResult(null);
        try {
            const data = await apiClient.get<EstadoCuentaResponse>(
                "/api/quemadores/estado_cuenta/search",
                { loan_number: loanNumber.trim() },
                signal
            );
            setResult(data);
        } catch (err) {
            if (isAbortError(err)) return;
            setError(err instanceof Error ? err.message : "Error al consultar el estado de cuenta");
        } finally {
            if (!signal.aborted) setLoading(false);
        }
    };

    const money = (value: any) => <span className="tabular">{formatCurrency(value)}</span>;

    const columns: Column[] = [
        {
            key: "fecha_pago",
            label: "Fecha de pago",
            render: (value: any) => new Date(value).toLocaleDateString("es-CO"),
        },
        { key: "capital_pagado", label: "Capital", align: "right", render: money },
        { key: "interes_corriente", label: "Interés corriente", align: "right", render: money },
        { key: "interes_mora", label: "Interés de mora", align: "right", render: money },
        { key: "gastos_cobranza", label: "Gastos de cobranza", align: "right", render: money },
        { key: "aval", label: "Aval", align: "right", render: money },
        { key: "seguros", label: "Seguros", align: "right", render: money },
        {
            key: "total_pagado",
            label: "Total pagado",
            align: "right",
            render: (value: any) => <span className="tabular font-semibold text-ink-900">{formatCurrency(value)}</span>,
        },
    ];

    return (
        <div className="mx-auto w-full max-w-[1800px] px-4 py-6 sm:px-6 lg:px-8">
            <PageHeader
                icon={FileText}
                title="Estado de Cuenta"
                description="Genera el estado de cuenta de una obligación. La plantilla legal (Resfin, Moviaval o Avalogic) se elige automáticamente según el tipo de negocio del crédito."
            />

            <InfoCallout id="estado-cuenta" title="¿Cómo funciona?">
                <ul className="space-y-1 list-disc list-inside">
                    <li>Se consulta <strong>una sola obligación</strong> a la vez</li>
                    <li>El avalista (Resfin / Moviaval / Avalogic) se detecta automáticamente por el tipo de negocio del crédito</li>
                    <li>La tabla agrupa los pagos por fecha en capital, intereses, mora, gastos de cobranza, aval y seguros</li>
                    <li>Conceptos como garantía mobiliaria, GPS o comisiones no se incluyen (no forman parte del estado de cuenta)</li>
                </ul>
            </InfoCallout>

            <form onSubmit={handleSearch} className="card mb-6 p-4 sm:p-5">
                <div className="flex flex-wrap items-end gap-4">
                    <div className="w-full max-w-xs">
                        <Input
                            label="Número de obligación"
                            value={loanNumber}
                            onChange={setLoanNumber}
                            placeholder="Ej: 2185363"
                            disabled={loading}
                        />
                    </div>
                    <button type="submit" disabled={loading} className="btn btn-primary">
                        {loading ? (
                            <>
                                <Loader2 size={15} className="animate-spin" aria-hidden />
                                Consultando
                            </>
                        ) : (
                            <>
                                <Search size={15} aria-hidden />
                                Consultar
                            </>
                        )}
                    </button>
                    {loading && (
                        <button type="button" onClick={cancelar} className="btn btn-ghost text-critical">
                            <CircleStop size={15} aria-hidden />
                            Cancelar
                        </button>
                    )}
                </div>
            </form>

            {error && <ErrorMessage message={error} />}
            {loading && <LoadingSpinner text="Consultando estado de cuenta..." />}

            {result && !loading && (
                <div className="space-y-4">
                    <div className="card flex flex-wrap items-center justify-between gap-4 p-5">
                        <div>
                            <Stack
                                strong
                                primary={result.nombre_cliente ?? "Cliente sin nombre"}
                                secondary={`${result.documento_tipo ?? ""} ${result.documento ?? ""}`.trim() || undefined}
                            />
                            <div className="mt-2 flex flex-wrap gap-2">
                                <span className="pill bg-accent-50 text-accent-700">
                                    Obligación {result.obligacion}
                                </span>
                                <StatusPill value={result.avalista} tone="info" />
                                {result.estado_obligacion && (
                                    <StatusPill
                                        value={result.estado_obligacion}
                                        tone={loanStatusTone(result.estado_obligacion)}
                                    />
                                )}
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-6 text-right">
                            <div>
                                <div className="text-[0.6875rem] font-semibold uppercase tracking-wide text-ink-400">
                                    Saldo actual
                                </div>
                                <div className="tabular text-lg font-semibold text-ink-900">
                                    {formatCurrency(result.saldo_actual)}
                                </div>
                            </div>
                            <div>
                                <div className="text-[0.6875rem] font-semibold uppercase tracking-wide text-ink-400">
                                    Días de mora
                                </div>
                                <div className="tabular text-lg font-semibold text-ink-900">
                                    {result.dias_mora ?? 0}
                                </div>
                            </div>
                            <div>
                                <div className="text-[0.6875rem] font-semibold uppercase tracking-wide text-ink-400">
                                    Total pagado
                                </div>
                                <div className="tabular text-lg font-semibold text-positive">
                                    {formatCurrency(result.total_pagado)}
                                </div>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => downloadEstadoCuentaPDF(result)}
                            className="btn btn-primary"
                        >
                            Descargar PDF
                        </button>
                    </div>

                    {result.avalista === "Avalogic" && (
                        <div
                            role="alert"
                            className="rounded-xl border border-caution/25 bg-caution-soft p-4 text-sm text-caution"
                        >
                            El texto legal de la plantilla Avalogic todavía está pendiente de definir
                            (la versión recibida repetía el texto de Resfin). El PDF se genera con un
                            párrafo marcado como pendiente — no lo envíes a un cliente hasta que se
                            reemplace.
                        </div>
                    )}

                    <Table columns={columns} data={result.pagos} expandable={false} />
                </div>
            )}
        </div>
    );
}

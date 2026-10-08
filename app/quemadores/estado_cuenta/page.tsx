"use client";

import { FileText, Loader2, Search, X } from "lucide-react";
import { useState } from "react";
import { loanStatusTone, Stack, StatusPill } from "../../components/common/cells";
import ErrorMessage from "../../components/common/ErrorMessage";
import InfoCallout from "../../components/common/InfoCallout";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import PageHeader from "../../components/common/PageHeader";
import Table, { type Column } from "../../components/common/Table";
import Input from "../../components/Input";
import { useAbortable } from "../../hooks/useAbortable";
import { EstadoCuentaResponse, EstadoCuentaRow } from "../../types/quemadores";
import { apiClient, isAbortError } from "../../utils/api";
import { downloadEstadoCuentaWord } from "../../utils/downloadEstadoCuentaWord";
import { formatCurrency } from "../../utils/formatters";
import EstadoCuentaPreview from "./EstadoCuentaPreview";

const sumColumn = (pagos: EstadoCuentaRow[], key: keyof EstadoCuentaRow): number =>
    pagos.reduce((acc, row) => acc + Number(row[key] ?? 0), 0);

// Declaraciones de renta piden años fiscales completos (hasta 31 de dic), casi
// nunca una fecha intermedia: elegir el año de una lista es más rápido que
// navegar un calendario hasta encontrar "31 de diciembre".
const ANIO_ACTUAL = new Date().getFullYear();
const ANIOS_FISCALES = Array.from({ length: 10 }, (_, i) => {
    const anio = String(ANIO_ACTUAL - i);
    return { value: anio, label: anio };
});

export default function EstadoCuentaPage() {
    const [loanNumber, setLoanNumber] = useState("");
    const [anioFiscal, setAnioFiscal] = useState("");
    const [result, setResult] = useState<EstadoCuentaResponse | null>(null);
    const [vista, setVista] = useState<"tabla" | "documento">("tabla");
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
            const params: Record<string, string> = { loan_number: loanNumber.trim() };
            if (anioFiscal) params.fecha_corte = `${anioFiscal}-12-31`;
            const data = await apiClient.get<EstadoCuentaResponse>(
                "/api/quemadores/estado_cuenta/search",
                params,
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

    const totales = result
        ? {
              capital_pagado: sumColumn(result.pagos, "capital_pagado"),
              interes_corriente: sumColumn(result.pagos, "interes_corriente"),
              interes_mora: sumColumn(result.pagos, "interes_mora"),
              gastos_cobranza: sumColumn(result.pagos, "gastos_cobranza"),
              aval: sumColumn(result.pagos, "aval"),
              seguros: sumColumn(result.pagos, "seguros"),
              total_pagado: sumColumn(result.pagos, "total_pagado"),
          }
        : undefined;

    return (
        <div className="mx-auto w-full max-w-[1800px] px-4 py-6 sm:px-6 lg:px-8">
            <PageHeader
                icon={FileText}
                title="Estado de Cuenta"
                description="Genera el estado de cuenta de una obligación. La plantilla legal (Resfin, Moviaval o Avalogic, de aval o de compra de cartera) se elige automáticamente según el tipo de negocio y su historial de cambios."
            />

            <InfoCallout id="estado-cuenta" title="¿Cómo funciona?">
                <ul className="space-y-1 list-disc list-inside">
                    <li>Se consulta <strong>una sola obligación</strong> a la vez</li>
                    <li>El avalista (Resfin / Moviaval / Avalogic) se detecta automáticamente por el tipo de negocio del crédito</li>
                    <li>Si la obligación pasó de un avalista a otro (según el histórico de cambios de tipo de negocio) se usa la plantilla de <strong>compra de cartera</strong>; si no, la de aval. Avalogic siempre usa compra de cartera y Resfin siempre usa la de aval</li>
                    <li>Descarga en <strong>Word</strong> para completar a mano el liquidador de Optimus: el documento trae un hueco resaltado donde pegar la imagen</li>
                    <li>La tabla agrupa los pagos por fecha en capital, intereses, mora, gastos de cobranza, aval y seguros</li>
                    <li>Conceptos como garantía mobiliaria, GPS o comisiones no se incluyen (no forman parte del estado de cuenta)</li>
                                        <li>Sin año fiscal se trae el histórico completo de pagos</li>
                    <li>Para declaraciones de renta: elige el <strong>año fiscal</strong> para acotar a los pagos de ese año (del 1 de enero al 31 de diciembre)</li>
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
                    <div className="w-full max-w-xs">
                        <Input
                            label="Año fiscal (opcional)"
                            value={anioFiscal}
                            onChange={setAnioFiscal}
                            options={ANIOS_FISCALES}
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
                            <X size={15} aria-hidden />
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
                                <StatusPill
                                    value={
                                        result.compra_cartera || result.avalista === "Avalogic"
                                            ? "Plantilla: Compra de cartera"
                                            : "Plantilla: Aval"
                                    }
                                    tone="neutral"
                                />
                                {result.estado_obligacion && (
                                    <StatusPill
                                        value={result.estado_obligacion}
                                        tone={loanStatusTone(result.estado_obligacion)}
                                    />
                                )}
                                <span className="pill bg-ink-50 text-ink-600">
                                    {result.fecha_corte ? `Año fiscal ${result.fecha_corte.slice(0, 4)}` : "Histórico"}
                                </span>
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
                            onClick={() => downloadEstadoCuentaWord(result)}
                            className="btn btn-primary"
                        >
                            Descargar Word
                        </button>
                    </div>

                    <div className="flex gap-2" role="tablist" aria-label="Vista del estado de cuenta">
                        <button
                            type="button"
                            role="tab"
                            aria-selected={vista === "tabla"}
                            onClick={() => setVista("tabla")}
                            className={vista === "tabla" ? "btn btn-primary" : "btn btn-ghost"}
                        >
                            Tabla de pagos
                        </button>
                        <button
                            type="button"
                            role="tab"
                            aria-selected={vista === "documento"}
                            onClick={() => setVista("documento")}
                            className={vista === "documento" ? "btn btn-primary" : "btn btn-ghost"}
                        >
                            Vista previa del documento
                        </button>
                    </div>

                    {vista === "tabla" ? (
                        <Table
                            columns={columns}
                            data={result.pagos}
                            expandable={false}
                            totalsRow={totales}
                            totalsLabel="Totales"
                        />
                    ) : (
                        <EstadoCuentaPreview data={result} />
                    )}
                </div>
            )}
        </div>
    );
}

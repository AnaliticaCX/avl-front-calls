"use client";

import { Bot, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import Chat from "../components/asistente/Chat";
import ErrorMessage from "../components/common/ErrorMessage";
import InlineAlert from "../components/common/InlineAlert";
import LoadingSpinner from "../components/common/LoadingSpinner";
import PageContainer from "../components/common/PageContainer";
import PageHeader from "../components/common/PageHeader";
import { useAbortable } from "../hooks/useAbortable";
import { ResumenLinea, ResumenResponse } from "../types/asistente";
import { apiClient, isAbortError } from "../utils/api";

const NUMERO = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 });
const FECHA_TITULO = new Intl.DateTimeFormat("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
});
const FECHA_CORTA = new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "long" });
const FECHA_LARGA = new Intl.DateTimeFormat("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "long",
});

/** Hoy en Colombia como YYYY-MM-DD, sin depender de la zona del navegador. */
function hoyColombia(): string {
    return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" }).format(new Date());
}

/**
 * Las fechas llegan como YYYY-MM-DD. `new Date("2026-10-12")` las lee como medianoche UTC,
 * que en Colombia todavía es el día anterior, así que se arman con año, mes y día locales.
 */
function aFecha(iso: string): Date {
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(y, m - 1, d);
}

function formatoFecha(fmt: Intl.DateTimeFormat, iso: string | null): string {
    return iso ? fmt.format(aFecha(iso)).replace(",", "") : "—";
}

function ayerColombia(): string {
    const hoy = aFecha(hoyColombia());
    hoy.setDate(hoy.getDate() - 1);
    return new Intl.DateTimeFormat("en-CA").format(hoy);
}

/** "KAREN GRAJALES ARCILA" -> "Karen Grajales Arcila"; "CÉLULA 3" -> "Célula 3", como en el correo. */
function nombrePropio(texto: string | null): string {
    return (texto ?? "").toLocaleLowerCase("es-CO").replace(/(^|\s)\p{L}/gu, (c) => c.toLocaleUpperCase("es-CO"));
}

function valor(linea: Pick<ResumenLinea, "unidad">, v: number | null): string {
    if (v === null) return "—";
    return linea.unidad === "pesos" ? `$${NUMERO.format(v)}` : NUMERO.format(v);
}

/**
 * Comparación contra el mismo día del mes anterior, con el texto del correo. Sin base_mes
 * hay dos casos: en las cifras del día y el reparto, el día equivalente cayó domingo o
 * festivo; en el top, el día existió y lo que falta es que ese asesor tuviera pagos.
 */
function comparacion(linea: ResumenLinea, sinBase: string): string {
    const dia = formatoFecha(FECHA_CORTA, linea.fecha_base);
    if (linea.ratio_mes === null || linea.base_mes === null) return `${sinBase} ${dia}`;
    const pct = Math.round((linea.ratio_mes - 1) * 100);
    return `vs ${valor(linea, linea.base_mes)} del ${dia} (${pct >= 0 ? "+" : ""}${pct}%)`;
}

function Frescura({ resumen }: { resumen: ResumenResponse }) {
    const { ultima_carga, datos_hasta, fecha_corte } = resumen;
    if (!ultima_carga || ultima_carga < hoyColombia()) {
        return (
            <InlineAlert tone="caution">
                La carga de hoy todavía no llega (corre hacia las 7:50 a. m.). Las cifras son de la
                última carga, del {formatoFecha(FECHA_LARGA, ultima_carga)}.
            </InlineAlert>
        );
    }
    const ayer = ayerColombia();
    if (fecha_corte < ayer && datos_hasta === fecha_corte) {
        return (
            <InlineAlert tone="info">
                Actualizado hoy. Ayer, {formatoFecha(FECHA_LARGA, ayer)}, no hubo pagos aplicados (domingo o
                festivo), así que este es el último día con pagos.
            </InlineAlert>
        );
    }
    if (datos_hasta && datos_hasta < fecha_corte) {
        return (
            <InlineAlert tone="info">
                El {formatoFecha(FECHA_LARGA, fecha_corte)} no tuvo pagos aplicados; los últimos son del{" "}
                {formatoFecha(FECHA_LARGA, datos_hasta)}.
            </InlineAlert>
        );
    }
    return null;
}

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
    return (
        <section>
            <h2 className="border-b border-hairline pb-2 text-xs font-semibold uppercase tracking-wider text-ink-500">
                {titulo}
            </h2>
            <ul className="divide-y divide-hairline/60">{children}</ul>
        </section>
    );
}

function Fila({ etiqueta, cifra, detalle }: { etiqueta: string; cifra: string; detalle?: string }) {
    return (
        <li
            className={`grid grid-cols-[1fr_auto] gap-x-4 py-2 text-sm ${
                detalle === undefined ? "" : "sm:grid-cols-[minmax(0,1.3fr)_8rem_minmax(0,1.6fr)]"
            }`}
        >
            <span className="text-ink-800">{etiqueta}</span>
            <span className="text-right font-medium tabular-nums text-ink-900">{cifra}</span>
            {detalle !== undefined && (
                <span className="col-span-2 text-xs text-ink-500 sm:col-span-1 sm:text-right sm:text-sm">
                    {detalle}
                </span>
            )}
        </li>
    );
}

function ResumenCorreo({ resumen }: { resumen: ResumenResponse }) {
    const s = resumen.secciones;
    return (
        <div className="card space-y-6 p-5 sm:p-6">
            <header>
                <h2 className="text-xl font-semibold text-ink-900">Resumen diario</h2>
                <p className="text-sm text-ink-500">{formatoFecha(FECHA_TITULO, resumen.fecha_corte)}</p>
            </header>

            <Frescura resumen={resumen} />

            <Seccion titulo="Pagos aplicados">
                {s.resumen.map((l) => (
                    <Fila
                        key={l.orden}
                        etiqueta={l.etiqueta ?? ""}
                        cifra={valor(l, l.valor)}
                        detalle={comparacion(l, "sin día comparable el")}
                    />
                ))}
            </Seccion>

            <Seccion titulo="Reparto entre asesores">
                {s.percentil.map((l) => (
                    <Fila
                        key={l.orden}
                        etiqueta={l.etiqueta ?? ""}
                        cifra={valor(l, l.valor)}
                        detalle={comparacion(l, "sin día comparable el")}
                    />
                ))}
            </Seccion>

            <Seccion titulo="Los 5 con más pagos">
                {s.top_recaudo.length === 0 && (
                    <li className="py-2 text-sm text-ink-400">Ningún asesor tuvo pagos aplicados ese día.</li>
                )}
                {s.top_recaudo.map((l) => (
                    <Fila
                        key={l.orden}
                        etiqueta={`${nombrePropio(l.etiqueta)} (${nombrePropio(l.celula)})`}
                        cifra={valor(l, l.valor)}
                        detalle={comparacion(l, "sin pagos el")}
                    />
                ))}
            </Seccion>

            <Seccion titulo={`Sin acuerdo (${s.sin_acuerdo.length})`}>
                {s.sin_acuerdo.map((l) => (
                    <Fila
                        key={l.orden}
                        etiqueta={`${nombrePropio(l.etiqueta)} (${nombrePropio(l.celula)})`}
                        cifra={`$${NUMERO.format(l.valor ?? 0)}`}
                    />
                ))}
            </Seccion>
        </div>
    );
}

export default function AsistentePage() {
    const [fecha, setFecha] = useState("");
    const [resumen, setResumen] = useState<ResumenResponse | null>(null);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");
    const { begin } = useAbortable();

    const cargar = useCallback(
        async (dia: string) => {
            const signal = begin();
            setCargando(true);
            setError("");
            try {
                const data = await apiClient.get<ResumenResponse>(
                    "/api/asistente/resumen",
                    { fecha: dia },
                    signal
                );
                setResumen(data);
            } catch (e) {
                if (isAbortError(e)) return;
                setError(e instanceof Error ? e.message : "No se pudo cargar el resumen");
            } finally {
                if (!signal.aborted) setCargando(false);
            }
        },
        [begin]
    );

    useEffect(() => {
        cargar(fecha);
    }, [cargar, fecha]);

    return (
        <PageContainer width="narrow">
            <PageHeader
                title="Asistente de recaudo"
                description="El resumen del correo diario con la última carga del datalake, y preguntas sobre el recaudo."
                icon={Bot}
                actions={
                    <>
                        <input
                            type="date"
                            className="input w-auto"
                            value={fecha || resumen?.fecha_corte || ""}
                            max={hoyColombia()}
                            onChange={(e) => setFecha(e.target.value)}
                            aria-label="Día del resumen"
                        />
                        <button
                            className="btn btn-secondary"
                            onClick={() => cargar(fecha)}
                            disabled={cargando}
                            aria-label="Actualizar resumen"
                        >
                            <RefreshCw size={16} className={cargando ? "animate-spin" : ""} aria-hidden />
                        </button>
                    </>
                }
            />

            {error && <ErrorMessage message={error} onRetry={() => cargar(fecha)} />}

            {cargando && !resumen && <LoadingSpinner text="Calculando el resumen..." />}

            {resumen && (
                <div className={`space-y-6 transition-opacity ${cargando ? "opacity-60" : ""}`}>
                    <ResumenCorreo resumen={resumen} />
                    <Chat />
                </div>
            )}
        </PageContainer>
    );
}

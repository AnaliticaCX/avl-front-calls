"use client";

import { useMemo } from "react";
import type { EstadoCuentaResponse } from "../../types/quemadores";
import {
    construirDocumento,
    ESTADO_CUENTA_COLUMNS,
    filasOtrasFuentes,
    filasTabla,
    NOTA_OTRAS_FUENTES,
    OTRAS_FUENTES_COLUMNS,
    TITULO_OTRAS_FUENTES,
} from "../../utils/estadoCuentaDocumento";

/**
 * Vista previa del documento que se descarga en Word. Usa el mismo modelo que el generador
 * del .docx, así que lo que se ve acá es lo que sale en el archivo.
 */
export default function EstadoCuentaPreview({ data }: { data: EstadoCuentaResponse }) {
    const doc = useMemo(() => construirDocumento(data), [data]);
    const { filas, totales } = useMemo(() => filasTabla(data), [data]);
    const otras = useMemo(() => filasOtrasFuentes(data), [data]);
    const [saludo, ...firma] = doc.cierre;

    return (
        <div className="overflow-x-auto rounded-xl bg-ink-50 p-3 sm:p-6">
            <article
                className="mx-auto w-full max-w-[860px] rounded-sm bg-white p-8 text-[13px] leading-relaxed text-ink-800 shadow-soft sm:p-12"
                style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
            >
                <header className="mb-6 flex items-center justify-between gap-4">
                    <div>
                        {doc.ciudad}, {doc.fecha}
                    </div>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={doc.logo} alt={doc.empresa} className="h-14 w-auto max-w-[220px] object-contain" />
                </header>

                <h2 className="mb-1 text-center text-base font-bold text-ink-900">ESTADO DE CUENTA</h2>
                {doc.periodo && <p className="mb-5 text-center text-[11px] text-ink-400">{doc.periodo}</p>}

                <div className={doc.periodo ? "" : "mt-5"}>
                    {doc.parrafos.map((texto) => (
                        <p key={texto} className="mb-3 text-justify">
                            {texto}
                        </p>
                    ))}
                </div>

                <table className="my-4 w-full border-collapse text-center text-[10px]">
                    <thead>
                        <tr>
                            {ESTADO_CUENTA_COLUMNS.map((c) => (
                                <th key={c.key} className="bg-[#375a6f] px-1 py-1.5 font-bold text-white">
                                    {c.label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {filas.map((fila) => (
                            <tr key={fila[0] + fila[7]}>
                                {fila.map((valor, i) => (
                                    <td key={i} className="border border-ink-100 px-1 py-1">
                                        {valor}
                                    </td>
                                ))}
                            </tr>
                        ))}
                        <tr>
                            {totales.map((valor, i) => (
                                <td key={i} className="border border-ink-100 px-1 py-1 font-bold">
                                    {valor}
                                </td>
                            ))}
                        </tr>
                    </tbody>
                </table>
                {filas.length === 0 && (
                    <p className="mb-3 text-center text-[11px] text-ink-400">No hay pagos en el período.</p>
                )}

                {otras.filas.length > 0 && (
                    <>
                        <h3 className="mb-1 mt-5 text-center text-[11px] font-bold text-ink-900">
                            {TITULO_OTRAS_FUENTES}
                        </h3>
                        <p className="mb-2 text-center text-[10px] text-ink-400">{NOTA_OTRAS_FUENTES}</p>
                        <table className="mb-4 w-full border-collapse text-center text-[10px]">
                            <thead>
                                <tr>
                                    {OTRAS_FUENTES_COLUMNS.map((c) => (
                                        <th key={c.key} className="bg-[#375a6f] px-1 py-1.5 font-bold text-white">
                                            {c.label}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {otras.filas.map((fila, i) => (
                                    <tr key={i}>
                                        {fila.map((valor, j) => (
                                            <td key={j} className="border border-ink-100 px-1 py-1">
                                                {valor}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                                <tr>
                                    {otras.totales.map((valor, i) => (
                                        <td key={i} className="border border-ink-100 px-1 py-1 font-bold">
                                            {valor}
                                        </td>
                                    ))}
                                </tr>
                            </tbody>
                        </table>
                    </>
                )}

                {doc.posTabla.map((bloque, i) =>
                    bloque.tipo === "liquidador" ? (
                        <p
                            key={i}
                            className="my-4 rounded bg-yellow-200 px-2 py-1 text-center font-bold text-ink-900"
                        >
                            [Pegar aquí la imagen del liquidador de Optimus]
                        </p>
                    ) : (
                        <p key={i} className="mb-3 text-justify">
                            {bloque.segmentos.map((s, j) => (s.b ? <strong key={j}>{s.t}</strong> : s.t))}
                        </p>
                    )
                )}

                {doc.diasMora !== null && (
                    <p className="mb-3 text-justify">
                        <strong>Días de mora: {doc.diasMora}</strong>
                    </p>
                )}

                <div className="mt-6">
                    <p className="mb-3">{saludo}</p>
                    {firma.map((linea) => (
                        <div key={linea}>{linea}</div>
                    ))}
                </div>

                {doc.pie.length > 0 && (
                    <div className="mt-6 text-center">
                        {doc.pie.map((linea) => (
                            <div key={linea}>{linea}</div>
                        ))}
                    </div>
                )}
            </article>
        </div>
    );
}

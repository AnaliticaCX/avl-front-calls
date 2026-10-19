"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Database, Loader2, MessageSquareText, SendHorizontal, Sparkles } from "lucide-react";
import { FormEvent, useEffect, useRef, useState } from "react";
import { Trabajo } from "../../types/asistente";
import { apiClient } from "../../utils/api";

/** El backend procesa la pregunta aparte (puede pasar de los 30 s del gateway) y se consulta su estado. */
const POLL_MS = 2000;
const TIMEOUT_MS = 4 * 60 * 1000;
/** Turnos anteriores que viajan como contexto; el backend acepta hasta seis. */
const MAX_HISTORIAL = 6;

const SUGERENCIAS = [
    "¿Por qué la célula 2 recaudó menos esta semana que la anterior?",
    "¿Quiénes son los 10 asesores con más recaudo en lo que va del mes?",
    "¿Cuántos acuerdos de pago se cerraron ayer, por célula?",
];

interface Turno {
    pregunta: string;
    trabajo: Trabajo | null;
    error: string | null;
}

const esperar = (ms: number) => new Promise((resolver) => setTimeout(resolver, ms));

async function esperarRespuesta(id: string, cancelado: () => boolean): Promise<Trabajo> {
    const limite = Date.now() + TIMEOUT_MS;
    while (Date.now() < limite && !cancelado()) {
        await esperar(POLL_MS);
        const trabajo = await apiClient.get<Trabajo>(`/api/asistente/preguntas/${id}`);
        if (trabajo.estado === "listo" || trabajo.estado === "error") return trabajo;
    }
    throw new Error("La respuesta está tardando más de lo normal. Intenta de nuevo en un momento.");
}

/** Negrita con **texto**, sin interpretar HTML: cada trozo se pinta como texto de React. */
function ConNegrita({ texto }: { texto: string }) {
    return (
        <>
            {texto.split(/(\*\*[^*]+\*\*)/g).map((trozo, i) =>
                trozo.startsWith("**") && trozo.endsWith("**") ? (
                    <strong key={i} className="font-semibold text-ink-900">
                        {trozo.slice(2, -2)}
                    </strong>
                ) : (
                    <span key={i}>{trozo}</span>
                )
            )}
        </>
    );
}

/** Párrafos y viñetas con guion: el único formato que se le pide al asistente. */
function TextoRespuesta({ texto }: { texto: string }) {
    const bloques = texto.split(/\n\s*\n/);
    return (
        <div className="space-y-2 text-sm leading-relaxed text-ink-800">
            {bloques.map((bloque, i) => {
                const lineas = bloque.split("\n").filter((l) => l.trim());
                if (lineas.length > 0 && lineas.every((l) => /^\s*[-•]\s/.test(l))) {
                    return (
                        <ul key={i} className="list-disc space-y-1 pl-5">
                            {lineas.map((l, j) => (
                                <li key={j}>
                                    <ConNegrita texto={l.replace(/^\s*[-•]\s/, "")} />
                                </li>
                            ))}
                        </ul>
                    );
                }
                return (
                    <p key={i} className="whitespace-pre-wrap">
                        <ConNegrita texto={bloque} />
                    </p>
                );
            })}
        </div>
    );
}

function Consultas({ trabajo }: { trabajo: Trabajo }) {
    const [abierto, setAbierto] = useState(false);
    const consultas = trabajo.respuesta?.consultas ?? [];
    if (consultas.length === 0) return null;
    return (
        <div className="mt-3 border-t border-hairline pt-2">
            <button
                onClick={() => setAbierto((v) => !v)}
                className="flex items-center gap-1.5 text-xs font-medium text-ink-500 transition-colors hover:text-accent-600"
                aria-expanded={abierto}
            >
                <Database size={13} aria-hidden />
                De dónde salen las cifras ({consultas.length} {consultas.length === 1 ? "consulta" : "consultas"})
                <ChevronDown size={13} className={`transition-transform ${abierto ? "rotate-180" : ""}`} aria-hidden />
            </button>
            {abierto && (
                <ol className="mt-2 space-y-3">
                    {consultas.map((c, i) => (
                        <li key={i} className="text-xs">
                            <p className="font-medium text-ink-700">{c.proposito}</p>
                            <p className={c.error ? "text-critical" : "text-ink-400"}>
                                {c.error ? `No se ejecutó: ${c.error}` : `${c.filas} filas · ${c.segundos} s`}
                            </p>
                            <pre className="mt-1 overflow-x-auto rounded-lg bg-ink-950 p-3 text-[11px] leading-relaxed text-ink-100">
                                {c.sql}
                            </pre>
                        </li>
                    ))}
                </ol>
            )}
        </div>
    );
}

function Respuesta({ turno }: { turno: Turno }) {
    const { trabajo, error } = turno;
    if (error || trabajo?.estado === "error") {
        return (
            <p className="text-sm text-critical">
                {error ?? "No pude completar la respuesta. Intenta de nuevo; si se repite, avísale a datos."}
            </p>
        );
    }
    if (!trabajo?.respuesta) {
        return (
            <p className="flex items-center gap-2 text-sm text-ink-500">
                <Loader2 size={15} className="animate-spin" aria-hidden />
                {trabajo?.estado === "procesando" ? "Consultando los datos..." : "Recibí tu pregunta..."}
            </p>
        );
    }
    return (
        <>
            <TextoRespuesta texto={trabajo.respuesta.texto} />
            <Consultas trabajo={trabajo} />
        </>
    );
}

export default function Chat() {
    const [turnos, setTurnos] = useState<Turno[]>([]);
    const [pregunta, setPregunta] = useState("");
    const [ocupado, setOcupado] = useState(false);
    const montado = useRef(true);
    const final = useRef<HTMLDivElement>(null);

    useEffect(() => {
        montado.current = true;
        return () => {
            montado.current = false;
        };
    }, []);

    useEffect(() => {
        final.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, [turnos]);

    const actualizarUltimo = (cambio: Partial<Turno>) =>
        setTurnos((prev) => prev.map((t, i) => (i === prev.length - 1 ? { ...t, ...cambio } : t)));

    const preguntar = async (texto: string) => {
        const limpio = texto.trim();
        if (limpio.length < 3 || ocupado) return;
        const historial = turnos
            .filter((t) => t.trabajo?.respuesta?.estado === "ok")
            .slice(-MAX_HISTORIAL)
            .map((t) => ({ pregunta: t.pregunta, respuesta: t.trabajo!.respuesta!.texto }));

        setTurnos((prev) => [...prev, { pregunta: limpio, trabajo: null, error: null }]);
        setPregunta("");
        setOcupado(true);
        try {
            const creado = await apiClient.post<Trabajo>("/api/asistente/preguntas", {
                pregunta: limpio,
                historial,
            });
            actualizarUltimo({ trabajo: creado });
            const listo = await esperarRespuesta(creado.id, () => !montado.current);
            if (montado.current) actualizarUltimo({ trabajo: listo });
        } catch (e) {
            if (montado.current) {
                actualizarUltimo({ error: e instanceof Error ? e.message : "No se pudo enviar la pregunta" });
            }
        } finally {
            if (montado.current) setOcupado(false);
        }
    };

    const enviar = (e: FormEvent) => {
        e.preventDefault();
        preguntar(pregunta);
    };

    return (
        <section className="card p-5">
            <h2 className="mb-1 flex items-center gap-2 text-base font-semibold text-ink-900">
                <MessageSquareText size={18} className="text-accent-600" aria-hidden />
                Pregúntale al asistente
            </h2>
            <p className="mb-4 text-sm text-ink-500">
                Responde con cifras del datalake y te muestra la consulta de donde sale cada número.
                Puede tardar entre 20 segundos y un par de minutos.
            </p>

            {turnos.length === 0 && (
                <div className="mb-4 flex flex-wrap gap-2">
                    {SUGERENCIAS.map((s) => (
                        <button
                            key={s}
                            onClick={() => preguntar(s)}
                            className="flex items-center gap-1.5 rounded-full border border-hairline bg-surface-sunken px-3 py-1.5 text-left text-xs text-ink-700 transition-colors hover:border-accent-300 hover:text-ink-900"
                        >
                            <Sparkles size={12} className="shrink-0 text-accent-600" aria-hidden />
                            {s}
                        </button>
                    ))}
                </div>
            )}

            <div className="space-y-4">
                <AnimatePresence initial={false}>
                    {turnos.map((t, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-2"
                        >
                            <div className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md bg-accent-500 px-4 py-2 text-sm text-white">
                                {t.pregunta}
                            </div>
                            <div className="max-w-[95%] rounded-2xl rounded-bl-md border border-hairline bg-surface-sunken px-4 py-3">
                                <Respuesta turno={t} />
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
                <div ref={final} />
            </div>

            <form onSubmit={enviar} className="mt-4 flex gap-2">
                <input
                    className="input"
                    value={pregunta}
                    onChange={(e) => setPregunta(e.target.value)}
                    placeholder="Escribe tu pregunta sobre el recaudo..."
                    maxLength={1000}
                    disabled={ocupado}
                    aria-label="Pregunta para el asistente"
                />
                <button
                    type="submit"
                    className="btn btn-primary shrink-0"
                    disabled={ocupado || pregunta.trim().length < 3}
                    aria-label="Enviar pregunta"
                >
                    {ocupado ? <Loader2 size={16} className="animate-spin" aria-hidden /> : <SendHorizontal size={16} aria-hidden />}
                </button>
            </form>
        </section>
    );
}

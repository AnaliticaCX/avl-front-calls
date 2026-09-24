"use client";

import { formatCurrency } from "../../utils/formatters";

interface Installment {
    n: number;
    date: string;
    amount: number;
}

interface ParsedGestion {
    installments: Installment[];
    total: number | null;
    cancelacionTotal: number | null;
    valorConDescuento: number | null;
    tags: string[];
    narrative: string;
}

const INSTALLMENT_RE = /(\d{1,2})\.\s*(\d{2}\/\d{2}\/\d{4})\s*\$\s*([\d.,]+)/g;
const TOTAL_RE = /TOTAL:\s*\$?\s*([\d.,]+)/i;
const CANCELACION_RE = /Cancelaci[oó]n total\s*:\s*\$?\s*([\d.,]+)/i;
const DESCUENTO_RE = /Valor a pagar con descuento\s*:\s*\$?\s*([\d.,]+)/i;
const TAG_PATTERNS: [string, RegExp][] = [
    ["Métodos de pago", /M[eé]todos de pago/i],
    ["Guion de incumplimiento", /Gui[oó]n de incumplimiento/i],
];

/**
 * "500.000" (miles) vs "8,032,655.28" (miles con coma, decimal con punto) vs
 * "1.234,56" (formato latino con decimales): el separador que queda pegado a
 * un grupo de 1-2 dígitos al final es el decimal; el de grupos de 3 es de miles.
 */
function parseAmount(raw: string): number | null {
    const cleaned = raw.replace(/[^\d.,]/g, "");
    if (!cleaned) return null;

    const hasComma = cleaned.includes(",");
    const hasDot = cleaned.includes(".");
    let normalized = cleaned;

    if (hasComma && hasDot) {
        const lastComma = cleaned.lastIndexOf(",");
        const lastDot = cleaned.lastIndexOf(".");
        normalized =
            lastDot > lastComma
                ? cleaned.replace(/,/g, "")
                : cleaned.replace(/\./g, "").replace(",", ".");
    } else if (hasDot) {
        const parts = cleaned.split(".");
        if (parts.length > 1 && parts[parts.length - 1].length === 3) {
            normalized = cleaned.replace(/\./g, "");
        }
    } else if (hasComma) {
        const parts = cleaned.split(",");
        normalized =
            parts.length > 1 && parts[parts.length - 1].length === 3
                ? cleaned.replace(/,/g, "")
                : cleaned.replace(",", ".");
    }

    const n = Number(normalized);
    return Number.isNaN(n) ? null : n;
}

/**
 * Reconoce el guion de negociación de paz y salvo: cronograma de cuotas
 * numeradas, total, valor de cancelación total y valor con descuento. Si no
 * encuentra al menos una cuota, devuelve null y el texto se muestra tal cual
 * — evita romper notas que no siguen este formato.
 */
function parseGestionObservation(text: string): ParsedGestion | null {
    const installments = Array.from(text.matchAll(INSTALLMENT_RE))
        .map((m) => ({ n: Number(m[1]), date: m[2], amount: parseAmount(m[3]) }))
        .filter((i): i is Installment => i.amount !== null);

    if (installments.length === 0) return null;

    const totalMatch = text.match(TOTAL_RE);
    const cancelacionMatch = text.match(CANCELACION_RE);
    const descuentoMatch = text.match(DESCUENTO_RE);
    const tags = TAG_PATTERNS.filter(([, re]) => re.test(text)).map(([label]) => label);

    let narrative = text
        .replace(INSTALLMENT_RE, " ")
        .replace(TOTAL_RE, " ")
        .replace(CANCELACION_RE, " ")
        .replace(DESCUENTO_RE, " ");
    for (const [, re] of TAG_PATTERNS) {
        narrative = narrative.replace(new RegExp(re.source, "gi"), " ");
    }
    narrative = narrative
        .replace(/\/{2,}/g, " ")
        .replace(/^\s*[\d.,]+\s*/, " ") // número suelto que quedó de un total ya extraído
        .replace(/\s*\.\s*(?=\.|$)/g, "") // puntos huérfanos de las etiquetas removidas
        .replace(/\s{2,}/g, " ")
        .trim();

    return {
        installments,
        total: totalMatch ? parseAmount(totalMatch[1]) : null,
        cancelacionTotal: cancelacionMatch ? parseAmount(cancelacionMatch[1]) : null,
        valorConDescuento: descuentoMatch ? parseAmount(descuentoMatch[1]) : null,
        tags,
        narrative,
    };
}

function StatChip({ label, value, tone }: { label: string; value: number; tone: "critical" | "positive" }) {
    const toneClasses = tone === "critical" ? "bg-critical-soft text-critical" : "bg-positive-soft text-positive";
    return (
        <div className={`rounded-lg px-3 py-2 ${toneClasses}`}>
            <div className="text-[0.6875rem] font-semibold uppercase tracking-wide opacity-80">{label}</div>
            <div className="tabular text-sm font-semibold">{formatCurrency(value)}</div>
        </div>
    );
}

export default function GestionObservation({ text }: { text: string | null | undefined }) {
    if (!text) return <span className="text-ink-300">—</span>;

    const parsed = parseGestionObservation(text);
    if (!parsed) {
        return <p className="whitespace-pre-wrap break-words text-sm text-ink-700">{text}</p>;
    }

    const total = parsed.total ?? parsed.installments.reduce((sum, i) => sum + i.amount, 0);

    return (
        <div className="space-y-3">
            <div className="overflow-hidden rounded-lg border border-hairline">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-surface-sunken text-left text-[0.6875rem] font-semibold uppercase tracking-wide text-ink-400">
                            <th className="px-3 py-1.5 font-semibold">#</th>
                            <th className="px-3 py-1.5 font-semibold">Fecha</th>
                            <th className="px-3 py-1.5 text-right font-semibold">Valor</th>
                        </tr>
                    </thead>
                    <tbody>
                        {parsed.installments.map((i) => (
                            <tr key={i.n} className="border-t border-hairline">
                                <td className="px-3 py-1 text-ink-500">{i.n}</td>
                                <td className="px-3 py-1 text-ink-700">{i.date}</td>
                                <td className="tabular px-3 py-1 text-right text-ink-800">{formatCurrency(i.amount)}</td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr className="border-t border-hairline bg-surface-sunken font-semibold">
                            <td className="px-3 py-1.5" colSpan={2}>
                                Total del plan
                            </td>
                            <td className="tabular px-3 py-1.5 text-right text-ink-900">{formatCurrency(total)}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            {(parsed.cancelacionTotal !== null || parsed.valorConDescuento !== null) && (
                <div className="flex flex-wrap gap-2">
                    {parsed.cancelacionTotal !== null && (
                        <StatChip label="Cancelación total" value={parsed.cancelacionTotal} tone="critical" />
                    )}
                    {parsed.valorConDescuento !== null && (
                        <StatChip label="Valor con descuento" value={parsed.valorConDescuento} tone="positive" />
                    )}
                </div>
            )}

            {parsed.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                    {parsed.tags.map((tag) => (
                        <span key={tag} className="pill bg-info-soft text-info">
                            {tag}
                        </span>
                    ))}
                </div>
            )}

            {parsed.narrative && (
                <p className="whitespace-pre-wrap break-words text-sm text-ink-700">{parsed.narrative}</p>
            )}
        </div>
    );
}

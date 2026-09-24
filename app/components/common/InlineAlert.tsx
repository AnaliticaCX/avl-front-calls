import { AlertCircle, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { ReactNode } from "react";

type Tone = "critical" | "caution" | "positive" | "info";

const TONES: Record<Tone, { wrap: string; icon: typeof Info; iconColor: string }> = {
    critical: {
        wrap: "border-critical/25 bg-critical-soft",
        icon: AlertCircle,
        iconColor: "text-critical",
    },
    caution: {
        wrap: "border-caution/25 bg-caution-soft",
        icon: AlertTriangle,
        iconColor: "text-caution",
    },
    positive: {
        wrap: "border-positive/25 bg-positive-soft",
        icon: CheckCircle2,
        iconColor: "text-positive",
    },
    info: {
        wrap: "border-info/25 bg-info-soft",
        icon: Info,
        iconColor: "text-info",
    },
};

interface InlineAlertProps {
    children: ReactNode;
    tone?: Tone;
    className?: string;
}

/** Aviso compacto de una línea, para validaciones y estados puntuales. */
export default function InlineAlert({
    children,
    tone = "critical",
    className = "",
}: InlineAlertProps) {
    const { wrap, icon: Icon, iconColor } = TONES[tone];

    return (
        <div
            role="alert"
            className={`mb-6 flex items-start gap-2.5 rounded-xl border p-3 ${wrap} ${className}`}
        >
            <Icon size={17} className={`mt-px shrink-0 ${iconColor}`} aria-hidden />
            <p className="min-w-0 flex-1 text-sm font-medium text-ink-700">{children}</p>
        </div>
    );
}

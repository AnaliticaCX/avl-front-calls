type LogoVariant = "color" | "onDark" | "mono";

interface IsotipoProps {
    size?: number;
    variant?: LogoVariant;
    className?: string;
}

/** Marca gráfica de Organízate: anillo bicolor + barras ascendentes con cola de "Q". */
export function Isotipo({ size = 32, variant = "color", className }: IsotipoProps) {
    const ink =
        variant === "onDark" ? "#FFFFFF" : variant === "mono" ? "currentColor" : "#092049";
    const accent = variant === "mono" ? "currentColor" : "#03AE9E";

    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 64 64"
            fill="none"
            className={className}
            role="img"
            aria-label="Organízate"
        >
            <path
                d="M29.91 8.09 A 24 24 0 0 0 23.79 54.55"
                stroke={ink}
                strokeWidth={6}
                strokeLinecap="round"
            />
            <path
                d="M34.09 8.09 A 24 24 0 0 1 40.21 54.55"
                stroke={accent}
                strokeWidth={6}
                strokeLinecap="round"
            />
            <path d="M21 47.5 V 42.5" stroke={accent} strokeWidth={5} strokeLinecap="round" />
            <path d="M28.5 47.5 V 36" stroke={accent} strokeWidth={5} strokeLinecap="round" />
            <path
                d="M36.5 25 V 43.5 Q 36.5 47.5 40.5 47.5 H 49"
                stroke={accent}
                strokeWidth={5}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

interface LogoProps extends IsotipoProps {
    /** Oculta el texto y deja solo la marca (sidebar colapsada). */
    compact?: boolean;
}

/** Lockup completo: isotipo + palabra "Organízate". */
export default function Logo({
    size = 32,
    variant = "color",
    compact = false,
    className,
}: LogoProps) {
    const wordColor = variant === "onDark" ? "text-white" : "text-brand-ink";

    return (
        <span className={`inline-flex items-center gap-2.5 ${className ?? ""}`}>
            <Isotipo size={size} variant={variant} />
            {!compact && (
                <span
                    className={`font-display font-semibold tracking-tight ${wordColor}`}
                    style={{ fontSize: size * 0.62 }}
                >
                    Organ<span className="text-brand-accent">í</span>zate
                </span>
            )}
        </span>
    );
}

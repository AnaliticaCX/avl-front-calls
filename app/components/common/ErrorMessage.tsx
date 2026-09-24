import { AlertTriangle, RotateCw } from "lucide-react";

interface ErrorMessageProps {
    message: string;
    /** Si se pasa, muestra un botón para reintentar la consulta. */
    onRetry?: () => void;
}

export default function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
    return (
        <div
            role="alert"
            className="mb-6 flex items-start gap-3 rounded-xl border border-critical/25 bg-critical-soft p-4"
        >
            <AlertTriangle size={18} className="mt-0.5 shrink-0 text-critical" aria-hidden />

            <div className="min-w-0 flex-1">
                <h3 className="text-sm font-semibold text-critical">No pudimos completar la consulta</h3>
                <p className="mt-0.5 break-words text-sm text-ink-600">{message}</p>
            </div>

            {onRetry && (
                <button onClick={onRetry} className="btn btn-secondary shrink-0 py-1.5 text-xs">
                    <RotateCw size={14} aria-hidden />
                    Reintentar
                </button>
            )}
        </div>
    );
}

import { SearchX } from "lucide-react";
import { ReactNode } from "react";

interface EmptyStateProps {
    icon?: ReactNode;
    title: string;
    message: string;
    /** Acción opcional, p. ej. limpiar filtros. */
    action?: ReactNode;
}

export default function EmptyState({ icon, title, message, action }: EmptyStateProps) {
    return (
        <div className="card flex flex-col items-center justify-center p-12 text-center">
            <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-surface-sunken text-ink-300">
                {icon ?? <SearchX size={26} aria-hidden />}
            </span>
            <h3 className="mb-1 text-base font-semibold text-ink-900">{title}</h3>
            <p className="max-w-sm text-sm text-ink-400">{message}</p>
            {action && <div className="mt-5">{action}</div>}
        </div>
    );
}

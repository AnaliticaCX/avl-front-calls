import type { LucideIcon } from "lucide-react";
import { ReactNode } from "react";

interface PageHeaderProps {
    title: string;
    description?: string;
    icon?: LucideIcon;
    /** Botones o controles alineados a la derecha (descargar, refrescar...). */
    actions?: ReactNode;
}

export default function PageHeader({
    title,
    description,
    icon: Icon,
    actions,
}: PageHeaderProps) {
    return (
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-3">
                {Icon && (
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-500/10 text-accent-600">
                        <Icon size={20} aria-hidden />
                    </span>
                )}
                <div className="min-w-0">
                    <h1 className="text-xl font-semibold sm:text-2xl">{title}</h1>
                    {description && (
                        <p className="mt-1 max-w-3xl text-sm text-ink-500">{description}</p>
                    )}
                </div>
            </div>

            {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </div>
    );
}

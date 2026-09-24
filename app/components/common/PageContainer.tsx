import { ReactNode } from "react";

type Width = "wide" | "narrow" | "full";

const WIDTHS: Record<Width, string> = {
    // Tablas y vistas de datos: aprovecha pantallas grandes sin volverse ilegible.
    wide: "max-w-[1800px]",
    // Formularios, detalle y lectura.
    narrow: "max-w-4xl",
    // Sin limite: el hijo gestiona su propio ancho.
    full: "max-w-none",
};

interface PageContainerProps {
    children: ReactNode;
    width?: Width;
    className?: string;
}

/** Envoltura estandar de pagina: ancho y respiracion consistentes en toda la app. */
export default function PageContainer({
    children,
    width = "wide",
    className = "",
}: PageContainerProps) {
    return (
        <div className={`mx-auto w-full px-4 py-6 sm:px-6 lg:px-8 ${WIDTHS[width]} ${className}`}>
            {children}
        </div>
    );
}

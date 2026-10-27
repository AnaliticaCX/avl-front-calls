import {
    BadgeCheck,
    BookUser,
    Bot,
    Flame,
    FileText,
    Gauge,
    Headphones,
    LayoutDashboard,
    Mail,
    MessageSquareText,
    MessagesSquare,
    PhoneCall,
    PhoneOff,
    Radar,
    ScrollText,
    Tags,
    type LucideIcon,
} from "lucide-react";
import type { Perfil } from "../utils/auth";

export interface NavItem {
    href: string;
    label: string;
    icon: LucideIcon;
    /** Descripción corta para hubs y tooltips. */
    blurb?: string;
    children?: NavItem[];
}

export interface NavSection {
    /** Identificador estable (persistencia de colapsado). */
    id: string;
    label: string;
    icon: LucideIcon;
    /** Color de acento del área, en tokens Tailwind. */
    accent: string;
    items: NavItem[];
}

export const HOME_ITEM: NavItem = {
    href: "/",
    label: "Inicio",
    icon: LayoutDashboard,
};

/**
 * El asistente de recaudo (resumen diario y chat) solo lo ve el perfil `asistente`, que además
 * ve todos los demás módulos. Los tokens generales ven la página sin este apartado.
 */
export const ASISTENTE_ITEM: NavItem = {
    href: "/asistente",
    label: "Asistente de recaudo",
    icon: Bot,
    blurb: "Resumen del día y preguntas sobre el recaudo",
};

/**
 * Interruptor del apartado. Apagado mientras el agente nuevo no sirva el resumen y el chat:
 * nadie ve la sección Recaudo, todos entran a Inicio y /asistente devuelve a Inicio. La
 * pantalla y el chat se conservan para cuando el apartado vuelva al mismo lugar.
 */
export const ASISTENTE_VISIBLE = false;

/** Pantalla de entrada de cada perfil: con el apartado visible, la líder entra directo a él. */
export function homePath(perfil: Perfil): string {
    return ASISTENTE_VISIBLE && perfil === "asistente" ? ASISTENTE_ITEM.href : HOME_ITEM.href;
}

export const RECAUDO_SECTION: NavSection = {
    id: "recaudo",
    label: "Recaudo",
    icon: Bot,
    accent: "accent",
    items: [ASISTENTE_ITEM],
};

export const NAV_SECTIONS: NavSection[] = [
    {
        id: "historicos",
        label: "Históricos",
        icon: ScrollText,
        accent: "accent",
        items: [
            {
                href: "/calls",
                label: "Llamadas",
                icon: PhoneCall,
                blurb: "CDR, tipificación e IVR",
                children: [
                    { href: "/calls/general", label: "Reporte CDR", icon: Gauge },
                    { href: "/calls/detalle_llamadas", label: "Detalle de llamadas", icon: PhoneCall },
                    {
                        href: "/calls/detalle_llamadas_no_conectadas",
                        label: "No conectadas",
                        icon: PhoneOff,
                    },
                    { href: "/calls/ivr", label: "IVR", icon: Headphones },
                    { href: "/calls/detalle_tipificacion", label: "Tipificación", icon: Tags },
                ],
            },
            { href: "/chats", label: "Chats", icon: MessagesSquare, blurb: "Conversaciones de agentes" },
            { href: "/sms", label: "SMS", icon: MessageSquareText, blurb: "Mensajería saliente" },
            { href: "/emails", label: "Correos", icon: Mail, blurb: "Envíos y entregabilidad" },
        ],
    },
    {
        id: "quemadores",
        label: "Quemadores",
        icon: Flame,
        accent: "caution",
        items: [
            {
                href: "/quemadores/paz_salvo",
                label: "Paz y Salvo",
                icon: BadgeCheck,
                blurb: "Acuerdos y valores pagados",
            },
            {
                href: "/quemadores/contactos",
                label: "Contactos",
                icon: BookUser,
                blurb: "Teléfonos y correos por obligación",
            },
            {
                href: "/quemadores/estado_cuenta",
                label: "Estado de Cuenta",
                icon: FileText,
                blurb: "PDF por obligación, según avalista",
            },
        ],
    },
    {
        id: "ruaf",
        label: "RUAF",
        icon: Radar,
        accent: "info",
        items: [
            {
                href: "/ruaf",
                label: "Corridas",
                icon: Radar,
                blurb: "Cargue, progreso y resultados",
            },
        ],
    },
];

/**
 * Secciones que ve cada perfil: con el apartado visible, el asistente va primero y solo para
 * su perfil.
 */
export function seccionesPara(perfil: Perfil): NavSection[] {
    return ASISTENTE_VISIBLE && perfil === "asistente"
        ? [RECAUDO_SECTION, ...NAV_SECTIONS]
        : NAV_SECTIONS;
}

/** El asistente lo abre solo su perfil y solo con el apartado visible; lo demás, todos. */
export function puedeAbrir(perfil: Perfil, pathname: string): boolean {
    if (!isActive(pathname, ASISTENTE_ITEM.href)) return true;
    return ASISTENTE_VISIBLE && perfil === "asistente";
}

const TODAS_LAS_SECCIONES = [RECAUDO_SECTION, ...NAV_SECTIONS];

/** Aplana la navegación a una lista de rutas para breadcrumbs y títulos. */
export const ALL_NAV_ITEMS: NavItem[] = TODAS_LAS_SECCIONES.flatMap((section) =>
    section.items.flatMap((item) => [item, ...(item.children ?? [])])
);

/** Devuelve la sección a la que pertenece una ruta. */
export function findSection(pathname: string): NavSection | undefined {
    return TODAS_LAS_SECCIONES.find((section) =>
        section.items.some(
            (item) =>
                pathname === item.href ||
                pathname.startsWith(`${item.href}/`) ||
                item.children?.some((c) => pathname === c.href || pathname.startsWith(`${c.href}/`))
        )
    );
}

/** Coincidencia de ruta activa, tolerante a sub-rutas dinámicas. */
export function isActive(pathname: string, href: string): boolean {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
}

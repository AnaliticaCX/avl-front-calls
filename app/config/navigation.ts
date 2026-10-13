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
 * El asistente de recaudo no vive en NAV_SECTIONS: solo lo ve un token de perfil
 * `asistente`, y ese token no ve nada más. Por eso tampoco aparece en el inicio ni en
 * los hubs de los tokens generales, que recibirían 401 al abrirlo.
 */
export const ASISTENTE_ITEM: NavItem = {
    href: "/asistente",
    label: "Asistente de recaudo",
    icon: Bot,
    blurb: "Resumen del día y preguntas sobre el recaudo",
};

/** Pantalla de entrada de cada perfil. */
export function homePath(perfil: Perfil): string {
    return perfil === "asistente" ? ASISTENTE_ITEM.href : HOME_ITEM.href;
}

/** Rutas que un perfil puede abrir; lo demás lo devuelve a su pantalla de entrada. */
export function puedeAbrir(perfil: Perfil, pathname: string): boolean {
    const esAsistente = isActive(pathname, ASISTENTE_ITEM.href);
    return perfil === "asistente" ? esAsistente : !esAsistente;
}

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

/** Aplana la navegación a una lista de rutas para breadcrumbs y títulos. */
export const ALL_NAV_ITEMS: NavItem[] = NAV_SECTIONS.flatMap((section) =>
    section.items.flatMap((item) => [item, ...(item.children ?? [])])
);

/** Devuelve la sección a la que pertenece una ruta. */
export function findSection(pathname: string): NavSection | undefined {
    return NAV_SECTIONS.find((section) =>
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

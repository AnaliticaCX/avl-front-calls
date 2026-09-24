"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import PageContainer from "./components/common/PageContainer";
import { NAV_SECTIONS } from "./config/navigation";

/** Tono de acento por area, en clases estaticas para que Tailwind las conserve. */
const ACCENTS: Record<string, { icon: string; bar: string }> = {
    accent: {
        icon: "bg-accent-500/10 text-accent-600",
        bar: "bg-accent-500",
    },
    caution: {
        icon: "bg-caution/10 text-caution",
        bar: "bg-caution",
    },
    info: {
        icon: "bg-info/10 text-info",
        bar: "bg-info",
    },
};

export default function Home() {
    return (
        <PageContainer>
            {/* Encabezado */}
            <motion.header
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="mb-8"
            >
                <h1 className="text-2xl font-semibold sm:text-3xl">
                    Bienvenido a <span className="text-accent-600">Organízate</span>
                </h1>
                <p className="mt-2 max-w-2xl text-ink-500">
                    Tres áreas de consulta sobre la misma base: el histórico de comunicaciones,
                    los informes de cartera quemada y las corridas de RUAF.
                </p>
            </motion.header>

            {/* Áreas */}
            <div className="grid gap-5 lg:grid-cols-3">
                {NAV_SECTIONS.map((section, si) => {
                    const tone = ACCENTS[section.accent] ?? ACCENTS.accent;
                    const SectionIcon = section.icon;

                    return (
                        <motion.section
                            key={section.id}
                            initial={{ opacity: 0, y: 14 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                                duration: 0.45,
                                delay: 0.06 * si,
                                ease: [0.16, 1, 0.3, 1],
                            }}
                            className="card card-interactive flex flex-col overflow-hidden"
                        >
                            {/* Filo superior con el color del area */}
                            <span aria-hidden className={`h-1 w-full ${tone.bar}`} />

                            <div className="flex flex-1 flex-col p-5">
                                <div className="mb-4 flex items-center gap-3">
                                    <span
                                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tone.icon}`}
                                    >
                                        <SectionIcon size={20} aria-hidden />
                                    </span>
                                    <div className="min-w-0">
                                        <h2 className="truncate text-base font-semibold">
                                            {section.label}
                                        </h2>
                                        <p className="text-xs text-ink-400">
                                            {section.items.length}{" "}
                                            {section.items.length === 1 ? "módulo" : "módulos"}
                                        </p>
                                    </div>
                                </div>

                                <ul className="flex flex-1 flex-col gap-1">
                                    {section.items.map((item) => {
                                        const ItemIcon = item.icon;
                                        return (
                                            <li key={item.href}>
                                                <Link
                                                    href={item.href}
                                                    className="group/item flex items-center gap-3 rounded-lg px-2.5 py-2.5 transition-colors hover:bg-surface-sunken"
                                                >
                                                    <ItemIcon
                                                        size={17}
                                                        className="shrink-0 text-ink-400 transition-colors group-hover/item:text-accent-600"
                                                        aria-hidden
                                                    />
                                                    <span className="min-w-0 flex-1">
                                                        <span className="block truncate text-sm font-medium text-ink-800">
                                                            {item.label}
                                                        </span>
                                                        {item.blurb && (
                                                            <span className="block truncate text-xs text-ink-400">
                                                                {item.blurb}
                                                            </span>
                                                        )}
                                                    </span>
                                                    <ArrowRight
                                                        size={15}
                                                        className="shrink-0 text-ink-300 transition-transform group-hover/item:translate-x-0.5"
                                                        aria-hidden
                                                    />
                                                </Link>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        </motion.section>
                    );
                })}
            </div>
        </PageContainer>
    );
}

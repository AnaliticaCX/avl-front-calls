"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type { NavItem } from "../../config/navigation";

/** Rejilla de accesos a modulos, usada en las paginas hub de cada area. */
export default function ModuleGrid({ items }: { items: NavItem[] }) {
    return (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((item, i) => {
                const Icon = item.icon;
                return (
                    <motion.div
                        key={item.href}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.05 * i, ease: [0.16, 1, 0.3, 1] }}
                    >
                        <Link
                            href={item.href}
                            className="group card card-interactive flex h-full items-start gap-4 p-5"
                        >
                            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent-500/10 text-accent-600 transition-colors group-hover:bg-accent-500 group-hover:text-white">
                                <Icon size={21} aria-hidden />
                            </span>

                            <span className="min-w-0 flex-1">
                                <span className="block font-semibold text-ink-900">
                                    {item.label}
                                </span>
                                {item.blurb && (
                                    <span className="mt-0.5 block text-sm text-ink-500">
                                        {item.blurb}
                                    </span>
                                )}
                            </span>

                            <ArrowRight
                                size={17}
                                className="mt-1 shrink-0 text-ink-300 transition-all group-hover:translate-x-0.5 group-hover:text-accent-600"
                                aria-hidden
                            />
                        </Link>
                    </motion.div>
                );
            })}
        </div>
    );
}

"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { usePathname } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function AppShell({ children }: { children: ReactNode }) {
    const [menuOpen, setMenuOpen] = useState(false);
    const pathname = usePathname();

    // El drawer se cierra al navegar.
    useEffect(() => {
        setMenuOpen(false);
    }, [pathname]);

    // Bloquea el scroll del cuerpo mientras el drawer esta abierto.
    useEffect(() => {
        document.body.style.overflow = menuOpen ? "hidden" : "";
        return () => {
            document.body.style.overflow = "";
        };
    }, [menuOpen]);

    return (
        <div className="flex h-screen overflow-hidden bg-surface-sunken">
            {/* Sidebar fijo (escritorio) */}
            <div className="hidden shrink-0 lg:block">
                <Sidebar />
            </div>

            {/* Drawer (movil) */}
            <AnimatePresence>
                {menuOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            onClick={() => setMenuOpen(false)}
                            className="fixed inset-0 z-40 bg-ink-950/50 backdrop-blur-sm lg:hidden"
                            aria-hidden
                        />
                        <motion.div
                            initial={{ x: "-100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "-100%" }}
                            transition={{ type: "spring", stiffness: 380, damping: 38 }}
                            className="fixed inset-y-0 left-0 z-50 lg:hidden"
                            role="dialog"
                            aria-modal="true"
                            aria-label="Menu de navegacion"
                        >
                            <Sidebar mobile onNavigate={() => setMenuOpen(false)} />
                            <button
                                onClick={() => setMenuOpen(false)}
                                className="absolute -right-11 top-3 rounded-lg bg-surface p-2 text-ink-600 shadow-soft"
                                aria-label="Cerrar menu"
                            >
                                <X size={18} />
                            </button>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Columna principal */}
            <div className="flex min-w-0 flex-1 flex-col">
                <Topbar onOpenMenu={() => setMenuOpen(true)} />

                <main className="flex-1 overflow-y-auto">
                    <motion.div
                        key={pathname}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                        className="min-h-full"
                    >
                        {children}
                    </motion.div>
                </main>
            </div>
        </div>
    );
}

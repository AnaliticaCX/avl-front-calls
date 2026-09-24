"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Info, X } from "lucide-react";
import { ReactNode, useEffect, useState } from "react";

interface InfoCalloutProps {
    /** Clave estable para recordar que ya se cerró en este navegador. */
    id: string;
    title: string;
    children: ReactNode;
}

/** Aviso de ayuda contextual, descartable y persistente por usuario. */
export default function InfoCallout({ id, title, children }: InfoCalloutProps) {
    const storageKey = `org.callout.${id}.dismissed`;
    // Arranca oculto para no parpadear antes de leer la preferencia.
    const [ready, setReady] = useState(false);
    const [dismissed, setDismissed] = useState(true);

    useEffect(() => {
        try {
            setDismissed(window.localStorage.getItem(storageKey) === "1");
        } catch {
            setDismissed(false);
        }
        setReady(true);
    }, [storageKey]);

    const dismiss = () => {
        setDismissed(true);
        try {
            window.localStorage.setItem(storageKey, "1");
        } catch {
            /* almacenamiento no disponible: se cierra solo en esta sesión */
        }
    };

    if (!ready) return null;

    return (
        <AnimatePresence initial={false}>
            {!dismissed && (
                <motion.aside
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden"
                >
                    <div className="mb-6 flex items-start gap-3 rounded-xl border border-info/20 bg-info-soft p-4">
                        <Info size={18} className="mt-0.5 shrink-0 text-info" aria-hidden />

                        <div className="min-w-0 flex-1 text-sm text-ink-700">
                            <p className="mb-1.5 font-semibold text-ink-900">{title}</p>
                            {children}
                        </div>

                        <button
                            type="button"
                            onClick={dismiss}
                            aria-label="Cerrar aviso"
                            className="-mr-1 -mt-1 shrink-0 rounded-lg p-1.5 text-ink-400 transition-colors hover:bg-info/10 hover:text-ink-700"
                        >
                            <X size={15} />
                        </button>
                    </div>
                </motion.aside>
            )}
        </AnimatePresence>
    );
}

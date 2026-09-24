"use client";

import { useEffect, useState } from "react";
import { apiClient } from "../../utils/api";

type Status = "checking" | "online" | "offline";

const POLL_MS = 30000;

/** Indicador discreto del estado del backend. */
export default function ApiStatus() {
    const [status, setStatus] = useState<Status>("checking");

    useEffect(() => {
        let cancelled = false;

        const check = async () => {
            try {
                await apiClient.get("/healthz");
                if (!cancelled) setStatus("online");
            } catch {
                if (!cancelled) setStatus("offline");
            }
        };

        check();
        const id = setInterval(check, POLL_MS);
        return () => {
            cancelled = true;
            clearInterval(id);
        };
    }, []);

    const config = {
        checking: { dot: "bg-ink-300", text: "text-ink-500", label: "Verificando" },
        online: { dot: "bg-positive", text: "text-ink-600", label: "Conectado" },
        offline: { dot: "bg-critical", text: "text-critical", label: "Sin conexion" },
    }[status];

    return (
        <div
            className="flex shrink-0 items-center gap-2"
            title={`Estado del servicio: ${config.label}`}
        >
            <span className="relative flex h-2 w-2">
                {status === "online" && (
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-positive opacity-60" />
                )}
                <span className={`relative inline-flex h-2 w-2 rounded-full ${config.dot}`} />
            </span>
            <span className={`hidden text-xs font-medium sm:inline ${config.text}`}>
                {config.label}
            </span>
        </div>
    );
}

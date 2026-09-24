"use client";

import { CircleStop, Loader2, Search, X } from "lucide-react";
import { FormEvent, ReactNode } from "react";
import Input from "../Input";

export interface FilterField {
    name: string;
    label: string;
    type?: string;
    placeholder?: string;
    max?: string;
    options?: { value: string; label: string }[];
    hint?: string;
    /** Limpia lo tecleado antes de guardarlo (p. ej. solo dígitos). */
    sanitize?: (value: string) => string;
}

/** En Wolkvox el agent_id es la extensión del agente. */
export const AGENT_EXTENSION_FIELD: FilterField = {
    name: "agent_id",
    label: "Extensión del agente",
    placeholder: "Ej: 61048",
    sanitize: (value) => value.replace(/[^A-Za-z0-9]/g, ""),
};

interface FiltersProps {
    fields: FilterField[];
    values: any;
    onChange: (name: string, value: string) => void;
    onSubmit: (e: FormEvent) => void;
    onClear: () => void;
    loading?: boolean;
    /** Si se pasa, mientras carga aparece "Cancelar" para interrumpir la búsqueda. */
    onCancel?: () => void;
    children?: ReactNode;
}

export default function Filters({
    fields,
    values,
    onChange,
    onSubmit,
    onClear,
    loading = false,
    onCancel,
    children,
}: FiltersProps) {
    // Habilita "Limpiar" solo si hay algo que limpiar.
    const hasValues = fields.some((f) => {
        const v = values?.[f.name];
        return v !== undefined && v !== null && v !== "";
    });

    return (
        <form onSubmit={onSubmit} className="card mb-6 p-4 sm:p-5">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {fields.map((field) => (
                    <Input
                        key={field.name}
                        label={field.label}
                        value={values[field.name] || ""}
                        onChange={(val) => onChange(field.name, field.sanitize ? field.sanitize(val) : val)}
                        type={field.type}
                        placeholder={field.placeholder}
                        max={field.max}
                        options={field.options}
                        hint={field.hint}
                        disabled={loading}
                    />
                ))}
            </div>

            {children}

            <div className="mt-4 flex items-center gap-2 border-t border-hairline pt-4">
                <button type="submit" disabled={loading} className="btn btn-primary">
                    {loading ? (
                        <>
                            <Loader2 size={15} className="animate-spin" aria-hidden />
                            Buscando
                        </>
                    ) : (
                        <>
                            <Search size={15} aria-hidden />
                            Buscar
                        </>
                    )}
                </button>

                {loading && onCancel ? (
                    <button type="button" onClick={onCancel} className="btn btn-ghost text-critical">
                        <CircleStop size={15} aria-hidden />
                        Cancelar búsqueda
                    </button>
                ) : (
                    <button
                        type="button"
                        onClick={onClear}
                        disabled={loading || !hasValues}
                        className="btn btn-ghost"
                    >
                        <X size={15} aria-hidden />
                        Limpiar
                    </button>
                )}
            </div>
        </form>
    );
}

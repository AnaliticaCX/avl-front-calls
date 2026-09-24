"use client";

import { Check, type LucideIcon } from "lucide-react";

export interface ChipOption {
    value: string;
    label: string;
    icon?: LucideIcon;
}

interface ChipGroupProps {
    label: string;
    options: ChipOption[];
    /** Selección actual; vacía significa "todos". */
    value: string[];
    onChange: (value: string[]) => void;
    disabled?: boolean;
}

/** Selección múltiple en píldoras. Sin nada marcado se interpreta como "todos". */
export default function ChipGroup({ label, options, value, onChange, disabled = false }: ChipGroupProps) {
    const toggle = (v: string) =>
        onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);

    return (
        <fieldset disabled={disabled} className="min-w-0">
            <legend className="mb-2 flex items-center gap-2 text-sm font-medium text-ink-700">
                {label}
                <span className="text-xs font-normal text-ink-400">
                    {value.length === 0 ? "Todos" : `${value.length} seleccionado${value.length > 1 ? "s" : ""}`}
                </span>
            </legend>
            <div className="flex flex-wrap gap-2">
                {options.map(({ value: v, label: text, icon: Icon }) => {
                    const active = value.includes(v);
                    return (
                        <button
                            key={v}
                            type="button"
                            onClick={() => toggle(v)}
                            aria-pressed={active}
                            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[0.8125rem] font-medium transition-all duration-200 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 ${active
                                ? "border-accent-500 bg-accent-500 text-white shadow-[var(--shadow-accent)]"
                                : "border-hairline bg-surface text-ink-600 hover:border-accent-300 hover:bg-accent-50 hover:text-accent-700"
                                }`}
                        >
                            {active ? <Check size={13} aria-hidden /> : Icon && <Icon size={13} aria-hidden />}
                            {text}
                        </button>
                    );
                })}
            </div>
        </fieldset>
    );
}

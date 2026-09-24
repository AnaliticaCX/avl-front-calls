"use client";

import { ChevronDown } from "lucide-react";
import { useId } from "react";

interface InputProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    type?: string;
    options?: { value: string; label: string }[];
    required?: boolean;
    disabled?: boolean;
    max?: string;
    min?: string;
    error?: boolean;
    /** Texto de ayuda bajo el campo. */
    hint?: string;
}

export default function Input({
    label,
    value,
    onChange,
    placeholder = "",
    type = "text",
    options,
    required = false,
    disabled = false,
    max,
    min,
    error = false,
    hint,
}: InputProps) {
    const id = useId();
    const hintId = hint ? `${id}-hint` : undefined;
    const errorClasses = error
        ? "border-critical focus:border-critical focus:ring-critical/20"
        : "";

    return (
        <div className="flex flex-col gap-1.5">
            <label htmlFor={id} className="text-sm font-medium text-ink-700">
                {label}
                {required && (
                    <span className="ml-1 text-critical" aria-hidden>
                        *
                    </span>
                )}
            </label>

            {options ? (
                <div className="relative">
                    <select
                        id={id}
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        className={`input appearance-none pr-9 ${errorClasses}`}
                        required={required}
                        disabled={disabled}
                        aria-invalid={error || undefined}
                        aria-describedby={hintId}
                    >
                        <option value="">Seleccionar…</option>
                        {options.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                    <ChevronDown
                        size={16}
                        aria-hidden
                        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-400"
                    />
                </div>
            ) : (
                <input
                    id={id}
                    type={type}
                    placeholder={placeholder}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className={`input ${errorClasses}`}
                    required={required}
                    disabled={disabled}
                    max={max}
                    min={min}
                    aria-invalid={error || undefined}
                    aria-describedby={hintId}
                />
            )}

            {hint && (
                <p id={hintId} className="text-xs text-ink-400">
                    {hint}
                </p>
            )}
        </div>
    );
}

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
}: InputProps) {
    return (
        <div className="flex flex-col gap-1.5">
            <label className="block font-medium text-gray-700 text-sm">
                {label}
                {required && <span className="text-red-500 ml-1">*</span>}
            </label>
            {options ? (
                <div className="relative">
                    <select
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        className={`input appearance-none ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : ''}`}
                        required={required}
                        disabled={disabled}
                    >
                        <option value="">Seleccionar...</option>
                        {options.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
                </div>
            ) : (
                <input
                    type={type}
                    placeholder={placeholder}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className={`input ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : ''}`}
                    required={required}
                    disabled={disabled}
                    max={max}
                    min={min}
                />
            )}
        </div>
    );
}

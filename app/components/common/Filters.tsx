import Input from '../Input';

interface FilterField {
    name: string;
    label: string;
    type?: string;
    placeholder?: string;
    max?: string;
    options?: { value: string; label: string }[];
}

interface FiltersProps {
    fields: FilterField[];
    values: any;
    onChange: (name: string, value: string) => void;
    onSubmit: (e: React.FormEvent) => void;
    onClear: () => void;
    loading?: boolean;
    children?: React.ReactNode;
}

export default function Filters({
    fields,
    values,
    onChange,
    onSubmit,
    onClear,
    loading = false,
    children
}: FiltersProps) {
    return (
        <div className="card p-6 mb-8">
            <form onSubmit={onSubmit}>
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                    {fields.map((field) => (
                        <Input
                            key={field.name}
                            label={field.label}
                            value={values[field.name] || ''}
                            onChange={(val) => onChange(field.name, val)}
                            type={field.type}
                            placeholder={field.placeholder}
                            max={field.max}
                            options={field.options}
                        />
                    ))}
                </div>

                {children}

                <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
                    <button
                        type="submit"
                        disabled={loading}
                        className={`btn-primary ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        Buscar
                    </button>
                    <button
                        type="button"
                        onClick={onClear}
                        disabled={loading}
                        className={`btn-secondary ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        Limpiar Filtros
                    </button>
                </div>
            </form>
        </div>
    );
}

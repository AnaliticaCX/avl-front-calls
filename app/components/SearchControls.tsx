interface SearchControlsProps {
    sortOrder: 'desc' | 'asc';
    perPage: number;
    onSortChange: (order: 'desc' | 'asc') => void;
    onPerPageChange: (perPage: number) => void;
    sortLabel?: string;
    perPageOptions?: number[];
}

export default function SearchControls({
    sortOrder,
    perPage,
    onSortChange,
    onPerPageChange,
    sortLabel = "Ordenar resultados por fecha",
    perPageOptions = [10, 25, 50, 100, 500]
}: SearchControlsProps) {
    return (
        <div className="card p-6 mb-6">
            <div className="grid md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                    <label className="block font-medium text-gray-700 text-sm">
                        {sortLabel}
                    </label>
                    <div className="relative">
                        <select
                            value={sortOrder}
                            onChange={(e) => onSortChange(e.target.value as 'desc' | 'asc')}
                            className="input appearance-none"
                        >
                            <option value="desc">Más reciente primero</option>
                            <option value="asc">Más antigua primero</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </div>
                </div>
                <div className="flex flex-col gap-2">
                    <label className="block font-medium text-gray-700 text-sm">
                        Resultados por página
                    </label>
                    <div className="relative">
                        <select
                            value={perPage}
                            onChange={(e) => onPerPageChange(Number(e.target.value))}
                            className="input appearance-none"
                        >
                            {perPageOptions.map(option => (
                                <option key={option} value={option}>{option}</option>
                            ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

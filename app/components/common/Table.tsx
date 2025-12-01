interface Column {
    key: string;
    label: string;
    render?: (value: any, row: any) => React.ReactNode;
}

interface TableProps {
    columns: Column[];
    data: any[];
    onRowClick?: (row: any) => void;
}

export default function Table({ columns, data, onRowClick }: TableProps) {
    if (!data || data.length === 0) {
        return (
            <div className="card p-12 text-center flex flex-col items-center justify-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">
                    No se encontraron resultados
                </h3>
                <p className="text-gray-500 text-sm">
                    Intenta ajustar los filtros de búsqueda o prueba con otros términos.
                </p>
            </div>
        );
    }

    return (
        <div className="overflow-hidden rounded-xl border border-gray-200 shadow-sm bg-white">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            {columns.map((column) => (
                                <th
                                    key={column.key}
                                    className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider"
                                >
                                    {column.label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {data.map((row, index) => (
                            <tr
                                key={row.conn_id || index}
                                className={`group hover:bg-gray-50 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
                                onClick={() => onRowClick?.(row)}
                            >
                                {columns.map((column) => (
                                    <td key={column.key} className="px-6 py-4 whitespace-nowrap">
                                        {column.render ? column.render(row[column.key], row) : (
                                            <div className="text-sm text-gray-700 group-hover:text-gray-900">
                                                {row[column.key] || '-'}
                                            </div>
                                        )}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

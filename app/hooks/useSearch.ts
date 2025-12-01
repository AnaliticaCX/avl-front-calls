import { useCallback, useState } from 'react';
import { apiClient } from '../utils/api';

interface SearchResponse {
    status: string;
    total: number;
    page: number;
    per_page: number;
    total_pages: number;
    data: any[];
    detalle?: string | null;
}

export function useSearch<T = any>(endpoint: string) {
    const [results, setResults] = useState<SearchResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const search = useCallback(async (filters: Record<string, any>) => {
        const hasAnyFilter = Object.values(filters).some(val =>
            val !== '' && val !== null && val !== undefined
        );

        if (!hasAnyFilter) {
            throw new Error('Debes ingresar al menos un criterio de búsqueda');
        }

        setLoading(true);
        setError('');

        const data = await apiClient.get<SearchResponse>(endpoint, filters);

        if (data.status === 'error') {
            throw new Error(data.detalle || 'Error desconocido');
        }

        setResults(data);
        setLoading(false);

        return data;
    }, [endpoint]);

    const clear = useCallback(() => {
        setResults(null);
        setError('');
    }, []);

    return {
        results,
        loading,
        error,
        search,
        clear,
        setError
    };
}

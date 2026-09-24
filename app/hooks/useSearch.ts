import { useCallback, useState } from 'react';
import { apiClient, isAbortError } from '../utils/api';
import { useAbortable } from './useAbortable';

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
    const { begin, abort } = useAbortable();

    const search = useCallback(async (filters: Record<string, any>) => {
        const hasAnyFilter = Object.values(filters).some(val =>
            val !== '' && val !== null && val !== undefined
        );

        if (!hasAnyFilter) {
            setError('Debes ingresar al menos un criterio de búsqueda');
            return null;
        }

        const signal = begin();
        setLoading(true);
        setError('');

        try {
            const data = await apiClient.get<SearchResponse>(endpoint, filters, signal);
            if (data.status === 'error') {
                throw new Error(data.detalle || 'Error desconocido');
            }
            setResults(data);
            return data;
        } catch (err) {
            // Cancelada por el usuario o reemplazada por otra búsqueda: se conservan los resultados previos.
            if (isAbortError(err)) return null;
            setResults(null);
            setError(err instanceof Error ? err.message : 'Error desconocido');
            return null;
        } finally {
            // Si otra búsqueda la reemplazó, esa es la dueña del estado de carga.
            if (!signal.aborted) setLoading(false);
        }
    }, [endpoint, begin]);

    const cancel = useCallback(() => {
        abort();
        setLoading(false);
    }, [abort]);

    const clear = useCallback(() => {
        setResults(null);
        setError('');
    }, []);

    return {
        results,
        loading,
        error,
        search,
        cancel,
        clear,
        setError
    };
}

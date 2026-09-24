import { useCallback, useRef, useState } from 'react';
import { useSearch } from './useSearch';

/**
 * Búsqueda paginada en servidor: recuerda los últimos filtros para que cambiar
 * de página o de tamaño de página repita la misma consulta.
 */
export function usePagedSearch(endpoint: string, initialPerPage = 50) {
    const { results, loading, error, search, cancel, setError, clear } = useSearch(endpoint);
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(initialPerPage);
    const lastFilters = useRef<Record<string, any> | null>(null);

    const fetchPage = useCallback(
        (filters: Record<string, any>, nextPage: number, nextPerPage: number) => {
            setPage(nextPage);
            setPerPage(nextPerPage);
            return search({ ...filters, page: nextPage, per_page: nextPerPage });
        },
        [search]
    );

    /** Nueva búsqueda: siempre arranca en la primera página. */
    const run = useCallback(
        (filters: Record<string, any>) => {
            lastFilters.current = filters;
            return fetchPage(filters, 1, perPage);
        },
        [fetchPage, perPage]
    );

    const goToPage = useCallback(
        (nextPage: number) => {
            if (!lastFilters.current) return;
            fetchPage(lastFilters.current, nextPage, perPage);
        },
        [fetchPage, perPage]
    );

    const changePerPage = useCallback(
        (nextPerPage: number) => {
            if (!lastFilters.current) return;
            fetchPage(lastFilters.current, 1, nextPerPage);
        },
        [fetchPage]
    );

    const reset = useCallback(() => {
        lastFilters.current = null;
        setPage(1);
        clear();
    }, [clear]);

    const total = results?.total ?? 0;
    const totalPages = total ? Math.ceil(total / perPage) : 0;

    return {
        results,
        loading,
        error,
        setError,
        run,
        cancel,
        reset,
        paging: { page, perPage, total, totalPages, onPageChange: goToPage, onPerPageChange: changePerPage },
    };
}

export type Paging = ReturnType<typeof usePagedSearch>['paging'];

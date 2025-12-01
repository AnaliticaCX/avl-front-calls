import { useCallback, useState } from 'react';

interface UseTableStateOptions<T> {
    initialPerPage?: number;
    initialSortOrder?: 'desc' | 'asc';
}

interface UseTableStateReturn<T> {
    currentPage: number;
    perPage: number;
    sortOrder: 'desc' | 'asc';
    displayedResults: T[];
    allResults: T[] | null;
    setCurrentPage: (page: number) => void;
    setPerPage: (perPage: number) => void;
    setSortOrder: (order: 'desc' | 'asc') => void;
    setAllResults: (results: T[]) => void;
    handlePageChange: (page: number) => void;
    handlePerPageChange: (newPerPage: number) => void;
    handleSortChange: (order: 'desc' | 'asc', sortFn: (a: T, b: T, order: 'desc' | 'asc') => number) => void;
}

export function useTableState<T>({
    initialPerPage = 25,
    initialSortOrder = 'desc'
}: UseTableStateOptions<T> = {}): UseTableStateReturn<T> {
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(initialPerPage);
    const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>(initialSortOrder);
    const [displayedResults, setDisplayedResults] = useState<T[]>([]);
    const [allResults, setAllResultsState] = useState<T[] | null>(null);

    const setAllResults = useCallback((results: T[]) => {
        setAllResultsState(results);
        setCurrentPage(1);
        setDisplayedResults(results.slice(0, perPage));
    }, [perPage]);

    const handlePageChange = useCallback((page: number) => {
        setCurrentPage(page);
        if (allResults) {
            const startIdx = (page - 1) * perPage;
            const endIdx = startIdx + perPage;
            setDisplayedResults(allResults.slice(startIdx, endIdx));
        }
    }, [allResults, perPage]);

    const handlePerPageChange = useCallback((newPerPage: number) => {
        setPerPage(newPerPage);
        setCurrentPage(1);
        if (allResults) {
            setDisplayedResults(allResults.slice(0, newPerPage));
        }
    }, [allResults]);

    const handleSortChange = useCallback((
        order: 'desc' | 'asc',
        sortFn: (a: T, b: T, order: 'desc' | 'asc') => number
    ) => {
        setSortOrder(order);
        if (!allResults) return;

        const sorted = [...allResults].sort((a, b) => sortFn(a, b, order));
        setAllResultsState(sorted);
        setCurrentPage(1);
        setDisplayedResults(sorted.slice(0, perPage));
    }, [allResults, perPage]);

    return {
        currentPage,
        perPage,
        sortOrder,
        displayedResults,
        allResults,
        setCurrentPage,
        setPerPage,
        setSortOrder,
        setAllResults,
        handlePageChange,
        handlePerPageChange,
        handleSortChange
    };
}

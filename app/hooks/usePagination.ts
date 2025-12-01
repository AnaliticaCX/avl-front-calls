import { useCallback, useState } from 'react';

export function usePagination(total?: number, perPage: number = 50) {
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(perPage);

    const totalPages = total ? Math.ceil(total / itemsPerPage) : 0;

    const handlePageChange = useCallback((page: number) => {
        setCurrentPage(page);
    }, []);

    const handlePerPageChange = useCallback((newPerPage: number) => {
        setItemsPerPage(newPerPage);
        setCurrentPage(1);
    }, []);

    const reset = useCallback(() => {
        setCurrentPage(1);
    }, []);

    return {
        currentPage,
        itemsPerPage,
        totalPages,
        handlePageChange,
        handlePerPageChange,
        reset
    };
}

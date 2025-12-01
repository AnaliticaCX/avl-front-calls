import { useCallback, useState } from 'react';

export function useFilters<T extends Record<string, any>>(initialValues: T) {
    const [filters, setFilters] = useState<T>(initialValues);

    const updateFilter = useCallback((name: string, value: any) => {
        setFilters(prev => ({
            ...prev,
            [name]: value
        }));
    }, []);

    const updateFilters = useCallback((newFilters: Partial<T>) => {
        setFilters(prev => ({
            ...prev,
            ...newFilters
        }));
    }, []);

    const clearFilters = useCallback(() => {
        setFilters(initialValues);
    }, [initialValues]);

    const hasAnyFilter = useCallback(() => {
        return Object.values(filters).some(val =>
            val !== '' && val !== null && val !== undefined
        );
    }, [filters]);

    return {
        filters,
        updateFilter,
        updateFilters,
        clearFilters,
        hasAnyFilter
    };
}

export const formatDate = (date: string | Date): string => {
    return new Date(date).toLocaleDateString();
};

export const formatDateTime = (date: string | Date): string => {
    return new Date(date).toLocaleString();
};

export const formatTime = (date: string | Date): string => {
    return new Date(date).toLocaleTimeString();
};

export const getTodayString = (): string => {
    return new Date().toISOString().split('T')[0];
};

export const formatCurrency = (value: number | string | null | undefined): string => {
    if (value === null || value === undefined || value === '') return '-';
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (Number.isNaN(num)) return '-';
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        maximumFractionDigits: 0,
    }).format(num);
};

const DATE_FMT = new Intl.DateTimeFormat('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
const TIME_FMT = new Intl.DateTimeFormat('es-CO', { hour: 'numeric', minute: '2-digit', second: '2-digit' });

// Intl lanza RangeError con fechas inválidas; se devuelve el valor crudo en su lugar.
const safeFormat = (fmt: Intl.DateTimeFormat, date: string | Date): string => {
    const d = new Date(date);
    return Number.isNaN(d.getTime()) ? String(date) : fmt.format(d);
};

export const formatDate = (date: string | Date): string => safeFormat(DATE_FMT, date);

export const formatTime = (date: string | Date): string => safeFormat(TIME_FMT, date);

export const formatDateTime = (date: string | Date): string => `${formatDate(date)}, ${formatTime(date)}`;

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

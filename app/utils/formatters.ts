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

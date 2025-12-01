export const validateEmail = (email: string): boolean => {
    if (!email) return true;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
};

export const validateDateRange = (
    startDate?: string,
    endDate?: string
): { isValid: boolean; error?: string } => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);

        if (start > end) {
            return {
                isValid: false,
                error: 'La fecha de inicio no puede ser posterior a la fecha de fin',
            };
        }

        if (start > today || end > today) {
            return {
                isValid: false,
                error: 'Las fechas no pueden ser futuras',
            };
        }
    }

    if (startDate && !endDate) {
        const start = new Date(startDate);
        if (start > today) {
            return {
                isValid: false,
                error: 'La fecha de inicio no puede ser futura',
            };
        }
    }

    if (!startDate && endDate) {
        const end = new Date(endDate);
        if (end > today) {
            return {
                isValid: false,
                error: 'La fecha de fin no puede ser futura',
            };
        }
    }

    return { isValid: true };
};

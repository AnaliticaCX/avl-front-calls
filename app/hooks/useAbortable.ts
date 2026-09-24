import { useCallback, useEffect, useRef } from 'react';

/**
 * Un AbortController por operación: empezar una nueva cancela la anterior, y
 * desmontar el componente cancela la que esté en curso.
 */
export function useAbortable() {
    const controller = useRef<AbortController | null>(null);

    useEffect(() => () => controller.current?.abort(), []);

    const begin = useCallback(() => {
        controller.current?.abort();
        controller.current = new AbortController();
        return controller.current.signal;
    }, []);

    const abort = useCallback(() => {
        controller.current?.abort();
        controller.current = null;
    }, []);

    return { begin, abort };
}

const AUTH_TOKEN_KEY = 'app_auth_token';
const AUTH_PERFIL_KEY = 'app_auth_perfil';

/**
 * Perfil del token. `general` abre los módulos de consulta; `asistente` abre solo el
 * asistente de recaudo. Los tokens guardados antes de que existiera el perfil no lo
 * tienen y se tratan como `general`, que es lo que eran.
 */
export type Perfil = 'general' | 'asistente';

export function saveAuthToken(token: string): void {
    if (typeof window !== 'undefined') {
        localStorage.setItem(AUTH_TOKEN_KEY, token);
    }
}

export function getAuthToken(): string | null {
    if (typeof window !== 'undefined') {
        return localStorage.getItem(AUTH_TOKEN_KEY);
    }
    return null;
}

export function saveAuthPerfil(perfil: Perfil): void {
    if (typeof window !== 'undefined') {
        localStorage.setItem(AUTH_PERFIL_KEY, perfil);
    }
}

export function getAuthPerfil(): Perfil {
    if (typeof window !== 'undefined' && localStorage.getItem(AUTH_PERFIL_KEY) === 'asistente') {
        return 'asistente';
    }
    return 'general';
}

export function removeAuthToken(): void {
    if (typeof window !== 'undefined') {
        localStorage.removeItem(AUTH_TOKEN_KEY);
        localStorage.removeItem(AUTH_PERFIL_KEY);
    }
}

export function isAuthenticated(): boolean {
    return getAuthToken() !== null;
}

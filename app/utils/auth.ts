const AUTH_TOKEN_KEY = 'app_auth_token';

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

export function removeAuthToken(): void {
    if (typeof window !== 'undefined') {
        localStorage.removeItem(AUTH_TOKEN_KEY);
    }
}

export function isAuthenticated(): boolean {
    return getAuthToken() !== null;
}

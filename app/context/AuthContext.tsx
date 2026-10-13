'use client';

import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { apiClient } from '../utils/api';
import {
    getAuthPerfil,
    isAuthenticated,
    Perfil,
    removeAuthToken,
    saveAuthPerfil,
    saveAuthToken,
} from '../utils/auth';

interface AuthContextType {
    authenticated: boolean;
    perfil: Perfil;
    /** Guarda el token, averigua su perfil y lo devuelve para decidir a dónde entrar. */
    login: (token: string) => Promise<Perfil>;
    logout: () => void;
}

/**
 * Un token es del asistente si el backend lo acepta en /api/asistente/acceso. Cualquier
 * otra respuesta (401 o red caída) lo deja como general, que es como entraba antes todo
 * token: el login nunca validó contra el backend y no se cambia eso aquí.
 */
async function resolverPerfil(): Promise<Perfil> {
    try {
        await apiClient.get('/api/asistente/acceso');
        return 'asistente';
    } catch {
        return 'general';
    }
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [authenticated, setAuthenticated] = useState(false);
    const [perfil, setPerfil] = useState<Perfil>('general');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setAuthenticated(isAuthenticated());
        setPerfil(getAuthPerfil());
        setLoading(false);
    }, []);

    const login = async (token: string): Promise<Perfil> => {
        saveAuthToken(token);
        const nuevo = await resolverPerfil();
        saveAuthPerfil(nuevo);
        setPerfil(nuevo);
        setAuthenticated(true);
        return nuevo;
    };

    const logout = () => {
        removeAuthToken();
        setPerfil('general');
        setAuthenticated(false);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-ink-100 border-t-accent-500 mx-auto"></div>
                    <p className="mt-4 text-ink-500 font-medium">Cargando...</p>
                </div>
            </div>
        );
    }

    return (
        <AuthContext.Provider value={{ authenticated, perfil, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth debe usarse dentro de un AuthProvider');
    }
    return context;
}

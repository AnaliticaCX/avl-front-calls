'use client';

import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { isAuthenticated, removeAuthToken, saveAuthToken } from '../utils/auth';

interface AuthContextType {
    authenticated: boolean;
    login: (token: string) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [authenticated, setAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setAuthenticated(isAuthenticated());
        setLoading(false);
    }, []);

    const login = (token: string) => {
        saveAuthToken(token);
        setAuthenticated(true);
    };

    const logout = () => {
        removeAuthToken();
        setAuthenticated(false);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-[#375a6f] mx-auto"></div>
                    <p className="mt-4 text-gray-500 font-medium">Cargando...</p>
                </div>
            </div>
        );
    }

    return (
        <AuthContext.Provider value={{ authenticated, login, logout }}>
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

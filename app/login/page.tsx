'use client';

import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
    const [token, setToken] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const { login } = useAuth();

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        if (!token.trim()) {
            setError('Por favor ingresa un token de acceso');
            return;
        }

        setLoading(true);
        setError('');

        try {
            login(token);
            router.push('/');
        } catch (err) {
            setError('Error al procesar el token. Inténtalo nuevamente.');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-vertical flex items-center justify-center px-6 py-12">
            <div className="max-w-md w-full">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-lg mb-4">
                        <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">
                        Acceso
                    </h1>
                </div>

                <div className="bg-white rounded-2xl shadow-2xl p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="token" className="block text-sm font-semibold text-gray-900 mb-2">
                                Token
                            </label>
                            <input
                                id="token"
                                type="password"
                                value={token}
                                onChange={(e) => setToken(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                                placeholder="Ingresa tu token"
                                disabled={loading}
                                autoComplete="off"
                            />
                        </div>

                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full btn-primary py-3"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Verificando...
                                </span>
                            ) : (
                                'Acceder'
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

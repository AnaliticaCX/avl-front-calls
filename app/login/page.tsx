'use client';

import { motion } from 'framer-motion';
import { AlertCircle, ArrowRight, KeyRound, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import Logo from '../components/brand/Logo';
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
            setError('Ingresa tu token de acceso para continuar');
            return;
        }

        setLoading(true);
        setError('');

        try {
            login(token);
            router.push('/');
        } catch {
            setError('No pudimos validar el token. Intentalo nuevamente.');
            setLoading(false);
        }
    };

    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-ink-950 px-6 py-12">
            {/* Ambiente: halos de marca */}
            <div aria-hidden className="pointer-events-none absolute inset-0">
                <div className="absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-accent-500/10 blur-3xl" />
                <div className="absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-ink-500/20 blur-3xl" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="relative w-full max-w-sm"
            >
                <div className="mb-8 flex flex-col items-center text-center">
                    <Logo size={40} variant="onDark" />
                    <p className="mt-4 text-sm text-ink-300">
                        Consulta de historicos, quemadores y RUAF
                    </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm sm:p-8">
                    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                        <div>
                            <label
                                htmlFor="token"
                                className="mb-2 block text-sm font-medium text-ink-200"
                            >
                                Token de acceso
                            </label>
                            <div className="relative">
                                <KeyRound
                                    size={16}
                                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400"
                                    aria-hidden
                                />
                                <input
                                    id="token"
                                    type="password"
                                    value={token}
                                    onChange={(e) => {
                                        setToken(e.target.value);
                                        if (error) setError('');
                                    }}
                                    className="w-full rounded-lg border border-white/10 bg-ink-950/50 py-2.5 pl-9 pr-3 text-sm text-white outline-none transition-colors placeholder:text-ink-500 focus:border-accent-500 focus:ring-2 focus:ring-accent-500/25"
                                    placeholder="Pega tu token aqui"
                                    disabled={loading}
                                    autoComplete="off"
                                    autoFocus
                                    aria-invalid={Boolean(error)}
                                    aria-describedby={error ? 'token-error' : undefined}
                                />
                            </div>
                        </div>

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -4 }}
                                animate={{ opacity: 1, y: 0 }}
                                id="token-error"
                                role="alert"
                                className="flex items-start gap-2 rounded-lg border border-critical/20 bg-critical/10 px-3 py-2.5 text-sm text-critical/60"
                            >
                                <AlertCircle size={15} className="mt-0.5 shrink-0" aria-hidden />
                                <span>{error}</span>
                            </motion.div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn btn-primary w-full py-2.5"
                        >
                            {loading ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" aria-hidden />
                                    Verificando
                                </>
                            ) : (
                                <>
                                    Acceder
                                    <ArrowRight size={16} aria-hidden />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                <p className="mt-6 text-center text-xs text-ink-500">
                    Organizate &middot; Plataforma interna de consulta
                </p>
            </motion.div>
        </div>
    );
}

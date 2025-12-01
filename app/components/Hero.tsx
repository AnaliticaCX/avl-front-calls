"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { apiClient } from "../utils/api";

export default function Hero() {
    const [dbStatus, setDbStatus] = useState<'connected' | 'disconnected'>('disconnected');

    useEffect(() => {
        const checkStatus = async () => {
            try {
                await apiClient.get('/health');
                setDbStatus('connected');
            } catch (error) {
                setDbStatus('disconnected');
            }
        };
        checkStatus();
        const interval = setInterval(checkStatus, 5000);
        return () => clearInterval(interval);
    }, []);

    return (
        <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden bg-background-warm pt-24 pb-12">
            {/* Background Elements */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(55,90,111,0.05),transparent_70%)]" />
                <div className="absolute top-20 right-0 w-96 h-96 bg-brand-blue/5 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-brand-green/10 rounded-full blur-3xl" />
            </div>

            <div className="container-custom relative z-10 grid lg:grid-cols-2 gap-16 items-center">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-left space-y-6"
                >
                    {/* Status Badge - Now integrated in layout */}
                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border shadow-sm ${dbStatus === 'connected'
                        ? 'bg-white border-gray-200'
                        : 'bg-red-50 border-red-100'
                        }`}>
                        <span className={`w-2 h-2 rounded-full ${dbStatus === 'connected' ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                            }`} />
                        <span className={`text-sm font-medium ${dbStatus === 'connected' ? 'text-gray-700' : 'text-red-700'
                            }`}>
                            Estado: {dbStatus === 'connected' ? 'Conectado' : 'Desconectado'}
                        </span>
                    </div>

                    <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-[1.1]">
                        Consulta tu{" "}
                        <span className="text-[#375a6f] font-extrabold whitespace-nowrap drop-shadow-sm">
                            Histórico
                        </span>
                        <br />
                        de Comunicaciones
                    </h1>

                    <p className="text-xl text-text-body leading-relaxed max-w-xl">
                        Accede de forma rápida y segura a todas las conversaciones, llamadas y mensajes de tu empresa. Una herramienta centralizada para el control total.
                    </p>

                    <div className="flex flex-wrap gap-4 pt-2">
                        <Link href="/chats" className="btn-primary group">
                            Consultar Chats
                            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                        </Link>
                        <Link href="/calls" className="btn-secondary">
                            Ver Llamadas
                        </Link>
                        <Link href="/sms" className="btn-secondary">
                            Ver SMS
                        </Link>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="relative hidden lg:flex items-center justify-center"
                >
                    <div className="relative w-full max-w-lg">
                        <div className="relative z-10 bg-white rounded-2xl shadow-2xl border border-gray-200 p-2 transform hover:scale-[1.02] transition-transform duration-500">
                            {/* Abstract representation of the dashboard UI */}
                            <div className="bg-gray-50 rounded-xl overflow-hidden aspect-[4/3] relative flex flex-col">
                                {/* Header Mockup */}
                                <div className="h-12 bg-white border-b border-gray-200 flex items-center px-4 justify-between shrink-0">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-red-400" />
                                        <div className="w-3 h-3 rounded-full bg-yellow-400" />
                                        <div className="w-3 h-3 rounded-full bg-green-400" />
                                    </div>
                                    <div className="w-24 h-2 bg-gray-100 rounded-full" />
                                </div>

                                <div className="flex flex-1 overflow-hidden">
                                    {/* Sidebar Mockup */}
                                    <div className="w-16 bg-white border-r border-gray-200 flex flex-col items-center py-4 gap-4 shrink-0">
                                        <div className="w-8 h-8 bg-blue-100 rounded-lg" />
                                        <div className="w-8 h-8 bg-gray-50 rounded-lg" />
                                        <div className="w-8 h-8 bg-gray-50 rounded-lg" />
                                        <div className="w-8 h-8 bg-gray-50 rounded-lg" />
                                    </div>

                                    {/* Main Content Mockup */}
                                    <div className="flex-1 p-4 space-y-3 overflow-hidden">
                                        {/* Search Bar Mockup */}
                                        <div className="flex gap-2 mb-4">
                                            <div className="flex-1 h-8 bg-white border border-gray-200 rounded-lg shadow-sm" />
                                            <div className="w-20 h-8 bg-blue-500 rounded-lg shadow-sm opacity-80" />
                                        </div>

                                        {/* Content Cards/Rows */}
                                        {[1, 2, 3].map((i) => (
                                            <div key={i} className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gray-100 shrink-0" />
                                                <div className="flex-1 space-y-1.5">
                                                    <div className="w-1/3 h-2 bg-gray-200 rounded-full" />
                                                    <div className="w-2/3 h-2 bg-gray-100 rounded-full" />
                                                </div>
                                                <div className="w-12 h-6 bg-green-50 rounded-full border border-green-100" />
                                            </div>
                                        ))}

                                        {/* Faint rows at bottom to imply more content */}
                                        <div className="bg-white/50 p-3 rounded-lg border border-gray-100 flex items-center gap-3 opacity-60">
                                            <div className="w-8 h-8 rounded-full bg-gray-100 shrink-0" />
                                            <div className="flex-1 space-y-1.5">
                                                <div className="w-1/4 h-2 bg-gray-200 rounded-full" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}

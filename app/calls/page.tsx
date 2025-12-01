"use client";

import Link from "next/link";
import PageHeader from "../components/common/PageHeader";

export default function CallsLandingPage() {
    const modules = [
        {
            title: "Reporte CDR",
            description: "Reporte general de llamadas del sistema",
            href: "/calls/general",
            icon: (
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
            )
        },
        {
            title: "Detalle Llamadas",
            description: "Detalle de llamadas conectadas",
            href: "/calls/detalle_llamadas",
            icon: (
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
            )
        },
        {
            title: "Detalle Llamadas No Conectadas",
            description: "Llamadas no contestadas o abandonadas",
            href: "/calls/detalle_llamadas_no_conectadas",
            icon: (
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3" />
                </svg>
            )
        },
        {
            title: "Detalle Llamadas IVR",
            description: "Interacciones con el sistema IVR",
            href: "/calls/ivr",
            icon: (
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
            )
        },
        {
            title: "Detalle Tipificación",
            description: "Detalle de tipificación de llamadas",
            href: "/calls/detalle_tipificacion",
            icon: (
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="2" fill="none" />
                    <path d="M8 10h8M8 14h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <circle cx="8" cy="8" r="1.5" fill="currentColor" />
                </svg>
            )
        }
    ];

    return (
        <div className="max-w-7xl mx-auto">
            <PageHeader
                title="Módulo de Llamadas"
                description="Accede a los diferentes reportes y análisis de llamadas del sistema"
            />

            <div className="grid md:grid-cols-2 gap-6">
                {modules.map((module) => (
                    <Link
                        key={module.href}
                        href={module.href}
                        className="card p-6 hover:shadow-lg transition-all group"
                    >
                        <div className="flex items-start gap-4">
                            <div className="text-primary group-hover:text-secondary transition-colors">
                                {module.icon}
                            </div>
                            <div className="flex-1">
                                <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-secondary transition-colors">
                                    {module.title}
                                </h3>
                                <p className="text-gray-600">
                                    {module.description}
                                </p>
                            </div>
                            <svg className="w-6 h-6 text-gray-400 group-hover:text-secondary group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}

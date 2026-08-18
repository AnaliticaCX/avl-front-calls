"use client";

import Link from "next/link";
import PageHeader from "../components/common/PageHeader";

export default function QuemadoresLandingPage() {
    const modules = [
        {
            title: "Paz y Salvo",
            description: "Consulta gestiones, acuerdos de pago y valores pagados por obligación",
            href: "/quemadores/paz_salvo",
            icon: (
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            )
        },
        {
            title: "Levantamiento DOSR",
            description: "Estado del proceso jurídico: radicación, orden y levantamiento de medidas",
            href: "/quemadores/levantamiento_dosr",
            icon: (
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21h18M5 21V7l8-4v18M13 21V11l6 3v7M9 9v.01M9 12v.01M9 15v.01" />
                </svg>
            )
        },
        {
            title: "Asignación Jurídica",
            description: "Cartera ejecutada asignada a jurídico, con cliente, acreedor y valores",
            href: "/quemadores/asignacion_juridica",
            icon: (
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
            )
        },
    ];

    return (
        <div className="max-w-7xl mx-auto">
            <PageHeader
                title="Módulo de Quemadores"
                description="Accede a los reportes de cartera quemada: paz y salvo, levantamiento DOSR y asignación jurídica"
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

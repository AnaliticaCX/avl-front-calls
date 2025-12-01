"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

interface BackToCallsPanelProps {
    className?: string;
}

export default function BackToCallsPanel({ className = "" }: BackToCallsPanelProps) {
    const router = useRouter();

    const handleBack = () => {
        router.push("/calls");
    };

    return (
        <button
            onClick={handleBack}
            className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-primary hover:text-primary transition-all duration-200 shadow-sm hover:shadow-md ${className}`}
            type="button"
        >
            <ArrowLeft size={18} />
            <span>Volver al panel de llamadas</span>
        </button>
    );
}

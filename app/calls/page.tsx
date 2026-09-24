"use client";

import ModuleGrid from "../components/common/ModuleGrid";
import PageContainer from "../components/common/PageContainer";
import PageHeader from "../components/common/PageHeader";
import { NAV_SECTIONS } from "../config/navigation";

const CALLS_ITEM = NAV_SECTIONS.find((s) => s.id === "historicos")!.items.find(
    (i) => i.href === "/calls"
)!;

export default function CallsLandingPage() {
    return (
        <PageContainer>
            <PageHeader
                title="Llamadas"
                description="Reporte CDR, detalle de llamadas conectadas y no conectadas, tránsito por IVR y tipificación de la gestión."
                icon={CALLS_ITEM.icon}
            />
            <ModuleGrid items={CALLS_ITEM.children ?? []} />
        </PageContainer>
    );
}

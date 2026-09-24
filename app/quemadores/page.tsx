"use client";

import ModuleGrid from "../components/common/ModuleGrid";
import PageContainer from "../components/common/PageContainer";
import PageHeader from "../components/common/PageHeader";
import { NAV_SECTIONS } from "../config/navigation";

const SECTION = NAV_SECTIONS.find((s) => s.id === "quemadores")!;

export default function QuemadoresLandingPage() {
    return (
        <PageContainer>
            <PageHeader
                title="Quemadores"
                description="Reportes de cartera quemada: estado de paz y salvo y datos de contacto por obligación."
                icon={SECTION.icon}
            />
            <ModuleGrid items={SECTION.items} />
        </PageContainer>
    );
}

"use client";

import { BookUser, Handshake, Mail, MapPin, Phone, Shapes, Smartphone, User, Users } from "lucide-react";
import { useState } from "react";
import { ExportButton, loanStatusTone, Stack, StatusPill, Tag } from "../../components/common/cells";
import ChipGroup, { type ChipOption } from "../../components/common/ChipGroup";
import Filters from "../../components/common/Filters";
import PageHeader from "../../components/common/PageHeader";
import SearchResults from "../../components/common/SearchResults";
import { useFilters } from "../../hooks/useFilters";
import { useSearch } from "../../hooks/useSearch";
import { ContactoRecord } from "../../types/quemadores";
import { downloadXLSX } from "../../utils/download";
import { getTodayString } from "../../utils/formatters";

interface ContactosFilters {
    loan_numbers: string;
}

const CHANNEL_OPTIONS: ChipOption[] = [
    { value: "celular", label: "Celular", icon: Smartphone },
    { value: "fijo", label: "Teléfono fijo", icon: Phone },
    { value: "email", label: "Email", icon: Mail },
    { value: "direccion", label: "Dirección", icon: MapPin },
];

const RELATION_OPTIONS: ChipOption[] = [
    { value: "cliente", label: "Cliente", icon: User },
    { value: "deudor_solidario", label: "Deudor solidario", icon: Handshake },
    { value: "referencias", label: "Referencias", icon: Users },
    { value: "otros", label: "Otros (vendedor, beneficiario…)", icon: Shapes },
];

/** CEL/TEL/EMA (y variantes largas) → canal legible con su icono. */
function channelOf(type?: string | null, value?: string | null) {
    const t = (type ?? "").trim().toUpperCase();
    if (t.startsWith("EMA") || t.startsWith("CORREO") || t.includes("MAIL") || value?.includes("@")) {
        return { label: "Email", icon: Mail };
    }
    if (t.startsWith("CEL")) return { label: "Celular", icon: Smartphone };
    if (t.startsWith("TEL") || t.startsWith("FIJO")) return { label: "Fijo", icon: Phone };
    if (t.startsWith("DIR")) return { label: "Dirección", icon: MapPin };
    return { label: type || "—", icon: Phone };
}

function ContactValue({ type, value }: { type?: string; value?: string }) {
    if (!value) return <span className="text-ink-300">—</span>;
    const Icon = channelOf(type, value).icon;
    return (
        <span className="inline-flex items-center gap-2 text-ink-700">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-50 text-accent-600">
                <Icon size={12} aria-hidden />
            </span>
            <span className="truncate">{value}</span>
        </span>
    );
}

export default function ContactosPage() {
    const { results, loading, error, search, setError, cancel, clear } = useSearch('/api/quemadores/contactos/search');
    const { filters, updateFilter, clearFilters } = useFilters<ContactosFilters>({
        loan_numbers: '',
    });

    const [channels, setChannels] = useState<string[]>([]);
    const [relations, setRelations] = useState<string[]>([]);

    const filterFields = [
        { name: 'loan_numbers', label: 'Obligaciones', placeholder: 'Ej: 12345, 67890 (separadas por coma)' },
    ];

    const runSearch = (nextChannels = channels, nextRelations = relations) => {
        search({
            loan_numbers: filters.loan_numbers,
            contact_types: nextChannels.join(','),
            relations: nextRelations.join(','),
        });
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!filters.loan_numbers.trim()) {
            setError('Debes ingresar al menos una obligación.');
            return;
        }

        runSearch();
    };

    // Con resultados en pantalla, cambiar un filtro vuelve a consultar al momento.
    const refineIfSearched = (nextChannels: string[], nextRelations: string[]) => {
        if (results && filters.loan_numbers.trim()) runSearch(nextChannels, nextRelations);
    };

    const handleClear = () => {
        clearFilters();
        clear();
        setChannels([]);
        setRelations([]);
    };

    const handleExportXLSX = () => {
        const rows = (results?.data ?? []) as ContactoRecord[];
        if (rows.length === 0) return;
        downloadXLSX(rows, `contactos_${getTodayString()}.xlsx`, 'Contactos');
    };

    const columns = [
        {
            key: 'obligacion_id',
            label: 'Obligación',
            render: (value: any, row: any) => <Stack strong mono primary={value} secondary={row.client_name} />
        },
        {
            key: 'client_name_contact',
            label: 'Contacto',
            maxWidth: '16rem',
            render: (value: any, row: any) => <Stack primary={value} secondary={row.client_type_contact} />
        },
        {
            key: 'contact_type',
            label: 'Tipo',
            render: (value: any, row: any) => <Tag value={channelOf(value, row.contact_information).label} />
        },
        {
            key: 'contact_information',
            label: 'Dato de contacto',
            render: (value: any, row: any) => <ContactValue type={row.contact_type} value={value} />
        },
        { key: 'obligacion_status', label: 'Estado obligación', render: (value: any) => <StatusPill value={value} tone={loanStatusTone(String(value))} /> },
    ];

    return (
        <div className="mx-auto w-full max-w-[1800px] px-4 py-6 sm:px-6 lg:px-8">
            <PageHeader
                icon={BookUser}
                title="Contactos"
                description="Consulta los teléfonos y correos asociados a una obligación."
            />

            <Filters
                fields={filterFields}
                values={filters}
                onChange={(name, value) => updateFilter(name, value)}
                onSubmit={handleSearch}
                onClear={handleClear}
                loading={loading}
                onCancel={cancel}
            >
                <div className="mt-5 grid gap-5 border-t border-hairline pt-4 md:grid-cols-2">
                    <ChipGroup
                        label="Tipo de dato"
                        options={CHANNEL_OPTIONS}
                        value={channels}
                        disabled={loading}
                        onChange={(next) => {
                            setChannels(next);
                            refineIfSearched(next, relations);
                        }}
                    />
                    <ChipGroup
                        label="Relación con la obligación"
                        options={RELATION_OPTIONS}
                        value={relations}
                        disabled={loading}
                        onChange={(next) => {
                            setRelations(next);
                            refineIfSearched(channels, next);
                        }}
                    />
                </div>
            </Filters>

            <SearchResults
                columns={columns}
                results={results}
                loading={loading}
                onCancel={cancel}
                error={error}
                itemName="contacto"
                getRowId={(row, i) => `${row.obligacion_id ?? ''}-${row.contact_information ?? ''}-${i}`}
                actions={<ExportButton onClick={handleExportXLSX} />}
                emptyMessage="No hay contactos registrados para las obligaciones ingresadas."
            />
        </div>
    );
}

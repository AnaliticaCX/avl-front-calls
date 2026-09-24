"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Download, Mail, X } from "lucide-react";
import { useEffect, useState } from "react";
import { DateTimeCell, ExportButton, RowAction, Stack, Tag } from "../components/common/cells";
import Filters from "../components/common/Filters";
import InfoCallout from "../components/common/InfoCallout";
import InlineAlert from "../components/common/InlineAlert";
import PageHeader from "../components/common/PageHeader";
import SearchResults from "../components/common/SearchResults";
import { useFilters } from "../hooks/useFilters";
import { usePagedSearch } from "../hooks/usePagedSearch";
import { Cdr9Record } from "../types/cdr";
import { downloadEmailPDF, downloadPDF, downloadXLSX, PdfColumn } from "../utils/download";
import { formatDate, formatDateTime, getTodayString } from "../utils/formatters";
import { validateDateRange as validateDateRangeUtil } from "../utils/validators";

interface EmailFilters {
    sent_from: string;
    sent_to: string;
    subject: string;
    channel: string;
    start_date: string;
    end_date: string;
    order_by: string;
}

const EXPORT_COLUMNS: PdfColumn[] = [
    { key: "date", label: "Fecha" },
    { key: "sent_from", label: "Remitente" },
    { key: "sent_to", label: "Destinatario" },
    { key: "subject", label: "Asunto" },
    { key: "channel", label: "Canal" },
    { key: "body", label: "Cuerpo" },
];

export default function EmailReportPage() {
    const [dateRangeError, setDateRangeError] = useState("");
    const [selectedEmail, setSelectedEmail] = useState<Cdr9Record | null>(null);
    const { results, loading, error, setError, cancel, run, reset, paging } = usePagedSearch('/api/mails/detalle_correos/search');
    const { filters, updateFilter, clearFilters } = useFilters<EmailFilters>({
        sent_from: '',
        sent_to: '',
        subject: '',
        channel: '',
        start_date: '',
        end_date: '',
        order_by: 'desc'
    });

    const filterFields = [
        { name: 'sent_from', label: 'Remitente (De)', placeholder: 'correo@dominio.com' },
        { name: 'sent_to', label: 'Destinatario (Para)', placeholder: 'correo@dominio.com' },
        { name: 'subject', label: 'Asunto', placeholder: 'Texto del asunto' },
        { name: 'channel', label: 'Canal', placeholder: 'Ej: email-route-61321' },
        { name: 'start_date', label: 'Fecha Inicio', type: 'date', max: getTodayString() },
        { name: 'end_date', label: 'Fecha Fin', type: 'date', max: getTodayString() }
    ];

    const validateDateRange = (inicio?: string, fin?: string) => {
        const result = validateDateRangeUtil(inicio ?? filters.start_date, fin ?? filters.end_date);
        setDateRangeError(result.error || "");
        return result.isValid;
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const hasAnyField = filters.sent_from || filters.sent_to || filters.subject ||
            filters.channel || filters.start_date || filters.end_date;
        if (!hasAnyField) {
            setError('Debes ingresar al menos un criterio de búsqueda.');
            return;
        }

        if (!validateDateRange()) {
            setError('Por favor corrige los errores en el formulario antes de buscar');
            return;
        }

        run({ ...filters });
    };

    const handleClear = () => {
        clearFilters();
        reset();
        setDateRangeError('');
    };

    const handleExportXLSX = () => {
        const rows = (results?.data ?? []) as Cdr9Record[];
        if (rows.length === 0) return;
        downloadXLSX(rows, `correos_${getTodayString()}.xlsx`, 'Correos');
    };

    const handleExportPDF = () => {
        const rows = (results?.data ?? []) as Cdr9Record[];
        if (rows.length === 0) return;
        downloadPDF(rows as Record<string, any>[], EXPORT_COLUMNS, {
            title: 'Detalle de Correos',
            subtitle: 'Reporte del visor histórico de comunicaciones',
            filename: `correos_${getTodayString()}`
        });
    };

    const columns = [
        {
            key: 'subject',
            label: 'Asunto',
            maxWidth: '22rem',
            render: (value: any, row: any) => (
                <Stack strong primary={value || '(Sin asunto)'} secondary={row.sent_from} />
            )
        },
        { key: 'date', label: 'Fecha', render: (value: any) => <DateTimeCell value={value} /> },
        { key: 'sent_to', label: 'Destinatario', maxWidth: '16rem' },
        { key: 'channel', label: 'Canal', render: (value: any) => <Tag value={value} /> },
        { key: 'sent_from', label: 'Remitente', secondary: true },
        {
            key: 'ingested_at',
            label: 'Ingestado',
            secondary: true,
            render: (value: any) => (value ? formatDateTime(value) : '—')
        },
        {
            key: 'actions',
            label: 'Acciones',
            render: (_: any, row: any) => (
                <RowAction label="Abrir correo" onClick={() => setSelectedEmail(row as Cdr9Record)} />
            )
        }
    ];

    return (
        <div className="mx-auto w-full max-w-[1800px] px-4 py-6 sm:px-6 lg:px-8">
            <PageHeader
                icon={Mail}
                title="Detalle de Correos"
                description="Consulta los correos del canal por remitente, destinatario, asunto, canal o rango de fechas."
            />

            <InfoCallout id="emails" title="¿Cómo buscar?">
                <ul className="space-y-1 list-disc list-inside">
                    <li>Puedes combinar <strong>todos los criterios</strong> (remitente, destinatario, asunto, canal, fechas)</li>
                    <li>Todos los campos son <strong>opcionales</strong>, pero al menos uno debe tener valor</li>
                    <li><strong>Remitente / Destinatario:</strong> admiten coincidencias parciales del correo</li>
                    <li><strong>Fecha inicio:</strong> busca desde esa fecha hasta hoy</li>
                    <li><strong>Fecha fin:</strong> busca todo lo registrado hasta esa fecha</li>
                    <li>Las fechas no pueden ser <strong>futuras</strong></li>
                    <li>Puedes descargar los resultados en <strong>Excel</strong> o <strong>PDF</strong></li>
                </ul>
            </InfoCallout>

            <Filters
                fields={filterFields}
                values={filters}
                onChange={(name, value) => {
                    updateFilter(name, value);
                    if (name === 'start_date' || name === 'end_date') {
                        validateDateRange(
                            name === 'start_date' ? value : undefined,
                            name === 'end_date' ? value : undefined
                        );
                    }
                }}
                onSubmit={handleSearch}
                onClear={handleClear}
                loading={loading}
                onCancel={cancel}
            />

            {dateRangeError && <InlineAlert>{dateRangeError}</InlineAlert>}

            <SearchResults
                columns={columns}
                results={results}
                loading={loading}
                onCancel={cancel}
                error={error}
                paging={paging}
                itemName="correo"
                actions={
                    <>
                        <ExportButton onClick={handleExportXLSX} />
                        <ExportButton format="pdf" onClick={handleExportPDF} />
                    </>
                }
                emptyMessage="No hay correos que coincidan con los criterios de búsqueda."
            />

            <EmailModal email={selectedEmail} onClose={() => setSelectedEmail(null)} />
        </div>
    );
}

function EmailModal({ email, onClose }: { email: Cdr9Record | null; onClose: () => void }) {
    useEffect(() => {
        if (!email) return;
        const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [email, onClose]);

    return (
        <AnimatePresence>
            {email && (
                <motion.div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/40 p-4 backdrop-blur-sm"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                >
                    <motion.div
                        role="dialog"
                        aria-modal="true"
                        aria-label={email.subject || "Correo"}
                        className="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-surface shadow-[var(--shadow-lifted)]"
                        initial={{ opacity: 0, y: 16, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.98 }}
                        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-start justify-between gap-4 border-b border-hairline px-6 py-5">
                            <div className="flex min-w-0 items-start gap-3">
                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-50 text-accent-600">
                                    <Mail size={18} aria-hidden />
                                </span>
                                <div className="min-w-0">
                                    <h3 className="truncate text-lg font-semibold text-ink-900">
                                        {email.subject || '(Sin asunto)'}
                                    </h3>
                                    <p className="mt-0.5 text-sm text-ink-400">
                                        {email.date ? formatDate(email.date) : '—'}
                                        {email.channel ? ` · ${email.channel}` : ''}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink-400 transition-colors hover:bg-ink-50 hover:text-ink-700"
                                aria-label="Cerrar"
                                type="button"
                            >
                                <X size={18} aria-hidden />
                            </button>
                        </div>

                        <div className="overflow-y-auto px-6 py-5">
                            <dl className="mb-5 grid gap-4 rounded-xl bg-surface-sunken p-4 text-sm sm:grid-cols-3">
                                {[
                                    ['De', email.sent_from],
                                    ['Para', email.sent_to],
                                    ['Ingestado', email.ingested_at ? formatDateTime(email.ingested_at) : null],
                                ].map(([label, value]) => (
                                    <div key={label as string} className="min-w-0">
                                        <dt className="mb-0.5 text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-ink-400">{label}</dt>
                                        <dd className="break-words text-ink-700">{value || '—'}</dd>
                                    </div>
                                ))}
                            </dl>

                            {email.body ? (
                                <iframe
                                    srcDoc={`<meta charset="utf-8">${email.body}`}
                                    sandbox="allow-same-origin"
                                    className="w-full rounded-xl border border-hairline bg-white"
                                    style={{ minHeight: '320px', height: '420px' }}
                                    title="Cuerpo del correo"
                                />
                            ) : (
                                <p className="rounded-xl border border-dashed border-hairline p-8 text-center text-sm text-ink-400">
                                    Este correo no tiene contenido
                                </p>
                            )}
                        </div>

                        <div className="flex justify-end gap-2 border-t border-hairline bg-surface-sunken/60 px-6 py-4">
                            <button type="button" onClick={onClose} className="btn btn-ghost">
                                Cerrar
                            </button>
                            <button
                                type="button"
                                onClick={() => downloadEmailPDF(email, `correo_${email.date ?? Date.now()}`)}
                                className="btn btn-primary"
                            >
                                <Download size={15} aria-hidden />
                                Descargar PDF
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

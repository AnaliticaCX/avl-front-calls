import * as XLSX from 'xlsx';
import type { Cdr9Record } from '../types/cdr';
import type { Avalista, EstadoCuentaResponse, EstadoCuentaRow } from '../types/quemadores';
import { formatCurrency } from './formatters';

export const downloadJSON = (data: any, filename: string): void => {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
};

export const downloadXLSX = (data: any[], filename: string, sheetName: string = 'Datos'): void => {
    // Crear un nuevo libro de trabajo
    const wb = XLSX.utils.book_new();

    // Convertir los datos a una hoja de cálculo
    const ws = XLSX.utils.json_to_sheet(data);

    // Añadir la hoja al libro
    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    // Generar el archivo y descargarlo
    XLSX.writeFile(wb, filename);
};

export interface PdfColumn {
    key: string;
    label: string;
}

const escapeHtml = (value: any): string => {
    if (value === null || value === undefined || value === '') return '-';
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/\n/g, '<br/>');
};

/**
 * Genera un PDF a partir de un conjunto de filas usando el diálogo de
 * impresión del navegador ("Guardar como PDF"). No requiere dependencias
 * externas.
 */
export const downloadPDF = (
    rows: Record<string, any>[],
    columns: PdfColumn[],
    options: { title: string; subtitle?: string; filename?: string }
): void => {
    const { title, subtitle, filename } = options;

    const headerCells = columns
        .map((col) => `<th>${escapeHtml(col.label)}</th>`)
        .join('');

    const bodyRows = rows
        .map((row) => {
            const cells = columns
                .map((col) => `<td>${escapeHtml(row[col.key])}</td>`)
                .join('');
            return `<tr>${cells}</tr>`;
        })
        .join('');

    const generatedAt = new Date().toLocaleString();
    const docTitle = filename || title;

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(docTitle)}</title>
<style>
    * { box-sizing: border-box; }
    body { font-family: Arial, Helvetica, sans-serif; color: #1f2937; margin: 24px; }
    h1 { font-size: 20px; margin: 0 0 4px; color: #375a6f; }
    .subtitle { font-size: 12px; color: #6b7280; margin: 0 0 4px; }
    .meta { font-size: 11px; color: #9ca3af; margin: 0 0 16px; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    thead { display: table-header-group; }
    th { background: #375a6f; color: #fff; text-align: left; padding: 6px 8px; }
    td { border: 1px solid #e5e7eb; padding: 6px 8px; vertical-align: top; word-break: break-word; }
    tr:nth-child(even) td { background: #f9fafb; }
    @page { size: landscape; margin: 14mm; }
</style>
</head>
<body>
    <h1>${escapeHtml(title)}</h1>
    ${subtitle ? `<p class="subtitle">${escapeHtml(subtitle)}</p>` : ''}
    <p class="meta">Generado: ${escapeHtml(generatedAt)} &middot; ${rows.length} registro(s)</p>
    <table>
        <thead><tr>${headerCells}</tr></thead>
        <tbody>${bodyRows}</tbody>
    </table>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const blobUrl = URL.createObjectURL(blob);
    const printWindow = window.open(blobUrl, '_blank');
    if (!printWindow) {
        URL.revokeObjectURL(blobUrl);
        alert('No se pudo abrir la ventana de impresión. Habilita las ventanas emergentes para descargar el PDF.');
        return;
    }
    printWindow.onload = () => {
        printWindow.focus();
        printWindow.print();
        URL.revokeObjectURL(blobUrl);
    };
};

const formatDMY = (value: string): string => {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${dd}/${mm}/${d.getFullYear()}`;
};

const MESES = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

// Se lee año/mes del texto ISO directamente para no depender de la zona horaria del navegador.
const mesAnioEjecucion = (fecha: string | null): { mes: string; anio: string } => {
    const m = fecha?.match(/^(\d{4})-(\d{2})/);
    if (!m) return { mes: '[sin fecha de ejecución]', anio: '[sin fecha de ejecución]' };
    return { mes: MESES[Number(m[2]) - 1], anio: m[1] };
};

interface AvalistaTemplate {
    empresa: string;
    email: string;
    /** Logo real extraído de la plantilla original (public/estado_cuenta/). */
    logo: string;
    intro: string;
    antesTabla: (obligacion: string, mes: string, anio: string) => string;
    despuesTabla: (totalPagado: string, diasMora: number | null) => string;
}

// El texto legal de cada avalista se identifica por loan.business_type en el backend
// (ver app/services/quemadores/estado_cuenta_service.py). Solo existe la plantilla
// "ejecutado" (aval) de Moviaval — nunca la de compra de cartera/subrogación — y el
// mismo rol de garante para Avalogic, aunque su business_type diga "Venta Cartera".
// Decisión de negocio confirmada con el usuario el 2026-09-23.
const ESTADO_CUENTA_TEMPLATES: Record<Avalista, AvalistaTemplate> = {
    Resfin: {
        empresa: 'RESPALDO FINANCIERO S.A.S',
        email: 'servicioalcliente@resfin.com.co',
        logo: '/estado_cuenta/resfin.png',
        intro:
            'Resfin S.A.S. (en adelante Resfin) es una sociedad que se dedica principalmente a ' +
            'avalar títulos valores otorgados dentro del territorio nacional que garantizan el pago ' +
            'de créditos de consumo. Como es de su conocimiento, en virtud del contrato de crédito ' +
            'celebrado entre usted y Créditos Orbe S.A.S. (en adelante Crediorbe), Resfin avaló el ' +
            'pagaré otorgado por usted a Crediorbe garantizando así el pago de la obligación.',
        antesTabla: (obligacion, mes, anio) =>
            'Por el incumplimiento en los pagos y la altura de la mora en la obligación con número de crédito ' +
            `${obligacion}, Crediorbe efectuó el cobro a Resfin y esta última procedió con el pago del crédito, ` +
            'motivo por el cual adquirió la calidad de acreedor mediante la figura de la subrogación legal, ' +
            `en el mes de ${mes} del año ${anio}.`,
        despuesTabla: (total) => `
            <p>En la imagen se evidencia que el valor total de los pagos efectuados totalizan la suma de <strong>${total}</strong>.</p>
            <p>La anterior imagen ilustra el saldo de la deuda a la fecha con sus respectivos conceptos.</p>
        `,
    },
    Moviaval: {
        empresa: 'Moviaval S.A.S.',
        email: 'servicioalcliente@moviaval.com',
        logo: '/estado_cuenta/moviaval.png',
        intro:
            'Moviaval S.A.S. es una sociedad cuya actividad principal consiste en la prestación de ' +
            'avales sobre títulos valores suscritos en el territorio nacional, destinados a respaldar ' +
            'obligaciones derivadas de créditos de consumo. En tal sentido, y con ocasión del contrato ' +
            'de crédito celebrado entre usted y Créditos Orbe S.A.S. (en adelante, "Crediorbe"), ' +
            'Moviaval otorgó el aval del pagaré suscrito por usted a favor de dicha entidad, ' +
            'garantizando el cumplimiento de la obligación crediticia asumida.',
        antesTabla: (obligacion, mes, anio) =>
            'Ante el incumplimiento en el pago de las cuotas, y la altura de la mora en la obligación con ' +
            `número de crédito ${obligacion}, Crediorbe hizo efectivo el cobro del aval, en el mes ${mes} ` +
            `del año ${anio}, este último procedió a cancelar el saldo adeudado. Debido a dicho pago, ` +
            'Moviaval adquirió la condición de acreedor de la obligación, por ministerio de la subrogación legal.',
        despuesTabla: (total, diasMora) => `
            <p>En la imagen se evidencia que el valor total de los pagos efectuados totalizan la suma de <strong>${total}</strong>.</p>
            <p>La imagen anterior refleja el valor total a cancelar a la fecha de expedición del
            presente estado de cuenta, registrándose un período de mora de <strong>${diasMora ?? 0}</strong> días.</p>
        `,
    },
    Avalogic: {
        empresa: 'Avalogic S.A.S.',
        email: 'servicioalcliente@avalogicsas.com',
        logo: '/estado_cuenta/avalogic.png',
        // Pendiente: la plantilla que se recibió para Avalogic reutilizaba el texto
        // legal de Resfin sin corregirlo. Se deja este marcador hasta que llegue el
        // texto definitivo — no se debe enviar a un cliente con este párrafo.
        intro:
            '[PENDIENTE — falta el texto legal definitivo de Avalogic. No enviar este documento ' +
            'a un cliente hasta reemplazar este párrafo.]',
        antesTabla: () => '',
        despuesTabla: (total) => `
            <p>En la imagen se evidencia que el valor total de los pagos efectuados totalizan la suma de <strong>${total}</strong>.</p>
        `,
    },
};

const ESTADO_CUENTA_COLUMNS: { key: keyof EstadoCuentaRow; label: string }[] = [
    { key: 'fecha_pago', label: 'FECHA DE PAGO' },
    { key: 'capital_pagado', label: 'CAPITAL PAGADO' },
    { key: 'interes_corriente', label: 'INTERÉS CORRIENTE' },
    { key: 'interes_mora', label: 'INTERÉS DE MORA' },
    { key: 'gastos_cobranza', label: 'GASTOS DE COBRANZA' },
    { key: 'aval', label: 'AVAL' },
    { key: 'seguros', label: 'SEGUROS' },
    { key: 'total_pagado', label: 'TOTAL PAGADO' },
];

/**
 * Genera el PDF del estado de cuenta con la plantilla legal del avalista
 * (Resfin / Moviaval / Avalogic) que ya viene resuelta desde el backend.
 */
export const downloadEstadoCuentaPDF = (data: EstadoCuentaResponse): void => {
    const template = ESTADO_CUENTA_TEMPLATES[data.avalista];

    const headerRow = ESTADO_CUENTA_COLUMNS.map((c) => `<th>${c.label}</th>`).join('');
    const bodyRows = data.pagos
        .map((row) => {
            const cells = ESTADO_CUENTA_COLUMNS.map((c) => {
                const raw = row[c.key];
                const text = c.key === 'fecha_pago' ? formatDMY(String(raw)) : formatCurrency(raw as number);
                return `<td>${text}</td>`;
            }).join('');
            return `<tr>${cells}</tr>`;
        })
        .join('');

    const totalPagadoFmt = formatCurrency(data.total_pagado as number);
    const { mes, anio } = mesAnioEjecucion(data.fecha_ejecucion);
    const antesTabla = template.antesTabla(data.obligacion, mes, anio);
    const fechaEmision = new Date().toLocaleDateString('es-CO', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8" />
<title>Estado de cuenta - ${escapeHtmlRaw(data.obligacion)}</title>
<style>
    * { box-sizing: border-box; }
    body { font-family: Arial, Helvetica, sans-serif; color: #1f2937; margin: 32px; font-size: 12px; line-height: 1.6; }
    .letterhead { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .logo { height: 56px; width: auto; max-width: 220px; object-fit: contain; }
    .empresa { font-size: 16px; font-weight: bold; color: #375a6f; }
    h1 { font-size: 16px; text-align: center; margin: 0 0 20px; }
    p { margin: 0 0 12px; }
    table { width: 100%; border-collapse: collapse; font-size: 10px; margin-bottom: 16px; }
    th { background: #375a6f; color: #fff; padding: 6px 4px; text-align: center; }
    td { border: 1px solid #e5e7eb; padding: 5px 4px; text-align: center; }
    tr:nth-child(even) td { background: #f9fafb; }
    .cierre { margin-top: 24px; }
    @page { size: portrait; margin: 16mm; }
</style>
</head>
<body>
    <div class="letterhead">
        <div>Medellín, ${fechaEmision}</div>
        <img class="logo" src="${window.location.origin}${template.logo}" alt="${escapeHtmlRaw(template.empresa)}" />
    </div>
    <h1>ESTADO DE CUENTA</h1>
    <p>${escapeHtmlRaw(template.intro)}</p>
    ${antesTabla ? `<p>${escapeHtmlRaw(antesTabla)}</p>` : ''}
    <table>
        <thead><tr>${headerRow}</tr></thead>
        <tbody>${bodyRows}</tbody>
    </table>
    ${template.despuesTabla(totalPagadoFmt, data.dias_mora)}
    <div class="cierre">
        <p>Cordialmente,</p>
        <p>Servicio al cliente<br/>${escapeHtmlRaw(template.empresa)}<br/>${escapeHtmlRaw(template.email)}</p>
    </div>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const blobUrl = URL.createObjectURL(blob);

    const printWindow = window.open(blobUrl, '_blank');
    if (!printWindow) {
        URL.revokeObjectURL(blobUrl);
        alert('No se pudo abrir la ventana de impresión. Habilita las ventanas emergentes para descargar el PDF.');
        return;
    }

    printWindow.onload = () => {
        printWindow.focus();
        printWindow.print();
        URL.revokeObjectURL(blobUrl);
    };
};

const escapeHtmlRaw = (value: any): string => {
    if (value === null || value === undefined || value === '') return '';
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
};

export const downloadEmailPDF = (email: Cdr9Record, filename?: string): void => {
    const subject = email.subject || '(Sin asunto)';
    const docFilename = filename || `correo_${Date.now()}`;

    const field = (val: string | null | undefined) =>
        escapeHtmlRaw(val) || '<span style="color:#9ca3af">—</span>';

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8" />
<title>${escapeHtmlRaw(subject)}</title>
<style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, Helvetica, sans-serif; color: #1f2937; padding: 36px; }
    .email-header { border-bottom: 2px solid #375a6f; padding-bottom: 18px; margin-bottom: 22px; }
    .subject { font-size: 20px; font-weight: bold; color: #375a6f; margin-bottom: 14px; }
    .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 24px; }
    .meta-label { font-size: 9px; font-weight: bold; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 2px; }
    .meta-value { font-size: 12px; color: #111827; }
    .body-label { font-size: 9px; font-weight: bold; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; }
    .body-content { font-size: 12px; color: #374151; line-height: 1.7; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 4px; padding: 16px; white-space: pre-wrap; word-break: break-word; }
    .footer { margin-top: 28px; font-size: 9px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 8px; }
    @page { size: portrait; margin: 18mm; }
</style>
</head>
<body>
    <div class="email-header">
        <div class="subject">${field(email.subject) || '(Sin asunto)'}</div>
        <div class="meta-grid">
            <div>
                <span class="meta-label">De</span>
                <span class="meta-value">${field(email.sent_from)}</span>
            </div>
            <div>
                <span class="meta-label">Para</span>
                <span class="meta-value">${field(email.sent_to)}</span>
            </div>
            <div>
                <span class="meta-label">Fecha</span>
                <span class="meta-value">${field(email.date)}</span>
            </div>
            <div>
                <span class="meta-label">Canal</span>
                <span class="meta-value">${field(email.channel)}</span>
            </div>
            ${email.ingested_at ? `<div>
                <span class="meta-label">Ingestado</span>
                <span class="meta-value">${field(email.ingested_at)}</span>
            </div>` : ''}
        </div>
    </div>
    <div>
        <div class="body-label">Cuerpo del correo</div>
        <div class="body-content">${email.body || '<span style="color:#9ca3af">(Sin contenido)</span>'}</div>
    </div>
    <div class="footer">Generado: ${new Date().toLocaleString()} &nbsp;·&nbsp; ${escapeHtmlRaw(docFilename)}</div>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const blobUrl = URL.createObjectURL(blob);

    const printWindow = window.open(blobUrl, '_blank');
    if (!printWindow) {
        URL.revokeObjectURL(blobUrl);
        alert('No se pudo abrir la ventana de impresión. Habilita las ventanas emergentes para descargar el PDF.');
        return;
    }

    printWindow.onload = () => {
        printWindow.focus();
        printWindow.print();
        URL.revokeObjectURL(blobUrl);
    };
};

import * as XLSX from 'xlsx';
import type { Cdr9Record } from '../types/cdr';

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

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        alert('No se pudo abrir la ventana de impresión. Habilita las ventanas emergentes para descargar el PDF.');
        return;
    }
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();

    printWindow.onload = () => {
        printWindow.focus();
        printWindow.print();
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
        <div class="body-content">${escapeHtmlRaw(email.body) || '<span style="color:#9ca3af">(Sin contenido)</span>'}</div>
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

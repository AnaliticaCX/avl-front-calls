import * as XLSX from 'xlsx';
import type { Cdr9Record } from '../types/cdr';
import type { EstadoCuentaResponse } from '../types/quemadores';
import { construirDocumento, ESTADO_CUENTA_COLUMNS, filasTabla, nombreArchivo } from './estadoCuentaDocumento';

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

/**
 * Genera el PDF del estado de cuenta con la plantilla legal que corresponde al avalista y al
 * tipo de documento (aval o compra de cartera), ya resueltos desde el backend.
 */
export const downloadEstadoCuentaPDF = (data: EstadoCuentaResponse): void => {
    const doc = construirDocumento(data);
    const { filas, totales } = filasTabla(data);

    const headerRow = ESTADO_CUENTA_COLUMNS.map((c) => `<th>${c.label}</th>`).join('');
    const bodyRows = filas.map((cells) => `<tr>${cells.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('');
    const totalsRow = totales.map((c) => `<td><strong>${c}</strong></td>`).join('');

    const posTabla = doc.posTabla
        .map((bloque) =>
            // El hueco del liquidador de Optimus solo existe en el Word.
            bloque.tipo === 'liquidador'
                ? ''
                : `<p>${bloque.segmentos
                      .map((s) => (s.b ? `<strong>${escapeHtmlRaw(s.t)}</strong>` : escapeHtmlRaw(s.t)))
                      .join('')}</p>`
        )
        .join('');
    const [saludo, ...firma] = doc.cierre;

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8" />
<title>${escapeHtmlRaw(nombreArchivo(data))}</title>
<style>
    * { box-sizing: border-box; }
    body { font-family: Arial, Helvetica, sans-serif; color: #1f2937; margin: 32px; font-size: 12px; line-height: 1.6; }
    .letterhead { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .logo { height: 56px; width: auto; max-width: 220px; object-fit: contain; }
    h1 { font-size: 16px; text-align: center; margin: 0 0 6px; }
    .periodo { text-align: center; font-size: 11px; color: #6b7280; margin: 0 0 20px; }
    p { margin: 0 0 12px; text-align: justify; }
    table { width: 100%; border-collapse: collapse; font-size: 10px; margin-bottom: 16px; }
    th { background: #375a6f; color: #fff; padding: 6px 4px; text-align: center; }
    td { border: 1px solid #e5e7eb; padding: 5px 4px; text-align: center; }
    tr:nth-child(even) td { background: #f9fafb; }
    tfoot td { background: #375a6f; color: #fff; font-weight: bold; }
    .dias-mora { display: inline-block; border: 1px solid #375a6f; border-radius: 4px;
        overflow: hidden; margin: 4px 0 16px; min-width: 110px; text-align: center; }
    .dias-mora-label { background: #375a6f; color: #fff; font-weight: bold; padding: 6px 10px; font-size: 10px; }
    .dias-mora-value { padding: 10px; font-size: 16px; font-weight: bold; }
    .cierre { margin-top: 24px; }
    .cierre p { text-align: left; }
    .pie { margin-top: 12px; text-align: center; }
    .pie p { text-align: center; margin: 0; }
    @page { size: portrait; margin: 16mm; }
</style>
</head>
<body>
    <div class="letterhead">
        <div>${escapeHtmlRaw(doc.ciudad)}, ${escapeHtmlRaw(doc.fecha)}</div>
        <img class="logo" src="${window.location.origin}${doc.logo}" alt="${escapeHtmlRaw(doc.empresa)}" />
    </div>
    <h1>ESTADO DE CUENTA</h1>
    <p class="periodo">${escapeHtmlRaw(doc.periodo)}</p>
    ${doc.parrafos.map((p) => `<p>${escapeHtmlRaw(p)}</p>`).join('')}
    <table>
        <thead><tr>${headerRow}</tr></thead>
        <tbody>${bodyRows}</tbody>
        <tfoot><tr>${totalsRow}</tr></tfoot>
    </table>
    ${posTabla}
    ${
        doc.diasMora !== null
            ? `<div class="dias-mora">
        <div class="dias-mora-label">Días de Mora</div>
        <div class="dias-mora-value">${escapeHtmlRaw(doc.diasMora)}</div>
    </div>`
            : ''
    }
    <div class="cierre">
        <p>${escapeHtmlRaw(saludo)}</p>
        <p>${firma.map((l) => escapeHtmlRaw(l)).join('<br/>')}</p>
    </div>
    ${doc.pie.length ? `<div class="pie">${doc.pie.map((l) => `<p>${escapeHtmlRaw(l)}</p>`).join('')}</div>` : ''}
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

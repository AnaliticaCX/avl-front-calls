import * as XLSX from 'xlsx';

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

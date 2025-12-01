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

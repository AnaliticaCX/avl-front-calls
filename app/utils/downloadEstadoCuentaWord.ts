import type { EstadoCuentaResponse } from '../types/quemadores';
import {
    construirDocumento,
    ESTADO_CUENTA_COLUMNS,
    filasTabla,
    nombreArchivo,
    type Segmento,
} from './estadoCuentaDocumento';

const AZUL = '375A6F';
const ALTO_LOGO_PX = 56;

interface Logo {
    data: ArrayBuffer;
    ancho: number;
    alto: number;
}

/** Descarga el logo y lo escala a una altura fija conservando la proporción. */
const cargarLogo = async (ruta: string): Promise<Logo | null> => {
    try {
        const respuesta = await fetch(ruta);
        if (!respuesta.ok) return null;
        const data = await respuesta.arrayBuffer();
        const dimensiones = await new Promise<{ w: number; h: number }>((resolve, reject) => {
            const url = URL.createObjectURL(new Blob([data], { type: 'image/png' }));
            const img = new Image();
            img.onload = () => {
                URL.revokeObjectURL(url);
                resolve({ w: img.naturalWidth, h: img.naturalHeight });
            };
            img.onerror = () => {
                URL.revokeObjectURL(url);
                reject(new Error('logo ilegible'));
            };
            img.src = url;
        });
        return { data, ancho: Math.round((dimensiones.w / dimensiones.h) * ALTO_LOGO_PX), alto: ALTO_LOGO_PX };
    } catch {
        // Un logo que no carga no debe impedir bajar el documento: queda el nombre de la empresa.
        return null;
    }
};

/**
 * Genera el estado de cuenta en Word (.docx) para completarlo a mano: el liquidador de
 * Optimus no se puede obtener del lake y se pega en el hueco resaltado del documento.
 */
export const downloadEstadoCuentaWord = async (data: EstadoCuentaResponse): Promise<void> => {
    const {
        AlignmentType,
        BorderStyle,
        Document,
        ImageRun,
        Packer,
        Paragraph,
        ShadingType,
        Table,
        TableCell,
        TableRow,
        TextRun,
        WidthType,
    } = await import('docx');

    const doc = construirDocumento(data);
    const { filas, totales } = filasTabla(data);
    const logo = await cargarLogo(doc.logo);

    const sinBorde = { style: BorderStyle.NONE, size: 0, color: 'auto' };
    const sinBordes = { top: sinBorde, bottom: sinBorde, left: sinBorde, right: sinBorde };
    const linea = { style: BorderStyle.SINGLE, size: 4, color: 'D1D5DB' };
    const conBordes = { top: linea, bottom: linea, left: linea, right: linea };

    const parrafo = (segmentos: Segmento[]) =>
        new Paragraph({
            spacing: { after: 160 },
            alignment: AlignmentType.JUSTIFIED,
            children: segmentos.map((s) => new TextRun({ text: s.t, bold: s.b })),
        });

    const celda = (valor: string, opciones: { encabezado?: boolean; negrilla?: boolean } = {}) =>
        new TableCell({
            borders: conBordes,
            shading: opciones.encabezado ? { type: ShadingType.CLEAR, fill: AZUL, color: 'auto' } : undefined,
            children: [
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                        new TextRun({
                            text: valor,
                            size: 16,
                            bold: opciones.encabezado || opciones.negrilla,
                            color: opciones.encabezado ? 'FFFFFF' : undefined,
                        }),
                    ],
                }),
            ],
        });

    const tabla = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
            new TableRow({
                tableHeader: true,
                children: ESTADO_CUENTA_COLUMNS.map((c) => celda(c.label, { encabezado: true })),
            }),
            ...filas.map((fila) => new TableRow({ children: fila.map((v) => celda(v)) })),
            new TableRow({ children: totales.map((v) => celda(v, { negrilla: true })) }),
        ],
    });

    const encabezado = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: { ...sinBordes, insideHorizontal: sinBorde, insideVertical: sinBorde },
        rows: [
            new TableRow({
                children: [
                    new TableCell({
                        width: { size: 60, type: WidthType.PERCENTAGE },
                        borders: sinBordes,
                        children: [new Paragraph({ children: [new TextRun(`${doc.ciudad}, ${doc.fecha}`)] })],
                    }),
                    new TableCell({
                        width: { size: 40, type: WidthType.PERCENTAGE },
                        borders: sinBordes,
                        children: [
                            new Paragraph({
                                alignment: AlignmentType.RIGHT,
                                children: logo
                                    ? [
                                          new ImageRun({
                                              type: 'png',
                                              data: logo.data,
                                              transformation: { width: logo.ancho, height: logo.alto },
                                          }),
                                      ]
                                    : [new TextRun({ text: doc.empresa, bold: true })],
                            }),
                        ],
                    }),
                ],
            }),
        ],
    });

    const posTabla = doc.posTabla.map((bloque) =>
        bloque.tipo === 'liquidador'
            ? new Paragraph({
                  alignment: AlignmentType.CENTER,
                  spacing: { before: 160, after: 160 },
                  children: [
                      new TextRun({
                          text: '[Pegar aquí la imagen del liquidador de Optimus]',
                          bold: true,
                          highlight: 'yellow',
                      }),
                  ],
              })
            : parrafo(bloque.segmentos)
    );

    const [saludo, ...firma] = doc.cierre;
    const cierre = [
        new Paragraph({ spacing: { before: 240, after: 160 }, children: [new TextRun(saludo)] }),
        ...firma.map((texto) => new Paragraph({ children: [new TextRun(texto)] })),
    ];
    const pie = doc.pie.map(
        (texto, i) =>
            new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: i === 0 ? 240 : 0 },
                children: [new TextRun(texto)],
            })
    );

    const documento = new Document({
        title: nombreArchivo(data),
        styles: { default: { document: { run: { font: 'Arial', size: 22 } } } },
        sections: [
            {
                properties: { page: { margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 } } },
                children: [
                    encabezado,
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { before: 360, after: 80 },
                        children: [new TextRun({ text: 'ESTADO DE CUENTA', bold: true, size: 28 })],
                    }),
                    ...(doc.periodo
                        ? [
                              new Paragraph({
                                  alignment: AlignmentType.CENTER,
                                  spacing: { after: 240 },
                                  children: [new TextRun({ text: doc.periodo, size: 18, color: '6B7280' })],
                              }),
                          ]
                        : []),
                    ...doc.parrafos.map((p) => parrafo([{ t: p }])),
                    tabla,
                    new Paragraph({ spacing: { after: 160 }, children: [] }),
                    ...posTabla,
                    ...(doc.diasMora !== null
                        ? [parrafo([{ t: `Días de mora: ${doc.diasMora}`, b: true }])]
                        : []),
                    ...cierre,
                    ...pie,
                ],
            },
        ],
    });

    const blob = await Packer.toBlob(documento);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${nombreArchivo(data)}.docx`;
    a.click();
    URL.revokeObjectURL(url);
};

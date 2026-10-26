import type {
    Avalista,
    EstadoCuentaOtraFuenteRow,
    EstadoCuentaResponse,
    EstadoCuentaRow,
} from '../types/quemadores';
import { formatCurrency } from './formatters';

/** Fragmento de texto de un párrafo; `b` lo marca en negrilla. */
export interface Segmento {
    t: string;
    b?: boolean;
}

/**
 * Bloque posterior a la tabla. `liquidador` marca el lugar donde se pega a mano la imagen del
 * liquidador de Optimus (dato que no se puede obtener del lake): solo se muestra en el Word.
 */
export type BloquePosTabla = { tipo: 'parrafo'; segmentos: Segmento[] } | { tipo: 'liquidador' };

export interface EstadoCuentaDocumento {
    empresa: string;
    /** Logo extraído de la plantilla original (public/estado_cuenta/). */
    logo: string;
    ciudad: string;
    fecha: string;
    /** Solo con año fiscal; vacío para el histórico. */
    periodo: string;
    parrafos: string[];
    posTabla: BloquePosTabla[];
    /** Recuadro "Días de Mora" que cierra algunas plantillas. */
    diasMora: number | null;
    cierre: string[];
    /** Datos de contacto centrados al pie (solo la plantilla de Resfin). */
    pie: string[];
}

export const ESTADO_CUENTA_COLUMNS: { key: keyof EstadoCuentaRow; label: string }[] = [
    { key: 'fecha_pago', label: 'FECHA DE PAGO' },
    { key: 'capital_pagado', label: 'CAPITAL PAGADO' },
    { key: 'interes_corriente', label: 'INTERÉS CORRIENTE' },
    { key: 'interes_mora', label: 'INTERÉS DE MORA' },
    { key: 'gastos_cobranza', label: 'GASTOS DE COBRANZA' },
    { key: 'aval', label: 'AVAL' },
    { key: 'seguros', label: 'SEGUROS' },
    { key: 'total_pagado', label: 'TOTAL PAGADO' },
];

export const sumEstadoCuentaColumn = (pagos: EstadoCuentaRow[], key: keyof EstadoCuentaRow): number =>
    pagos.reduce((acc, row) => acc + Number(row[key] ?? 0), 0);

export const formatDMY = (value: string): string => {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${dd}/${mm}/${d.getFullYear()}`;
};

// fecha_corte/periodo_desde vienen como "YYYY-MM-DD" sin hora: new Date() los
// interpreta como UTC y en Colombia (UTC-5) se corren un día hacia atrás.
const formatIsoDateDMY = (iso: string): string => {
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
};

const MESES = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

const SIN_FECHA = '[sin fecha]';

// Se lee año/mes del texto ISO directamente para no depender de la zona horaria del navegador.
const mesAnio = (fecha: string | null): { mes: string; anio: string } => {
    const m = fecha?.match(/^(\d{4})-(\d{2})/);
    if (!m) return { mes: SIN_FECHA, anio: SIN_FECHA };
    return { mes: MESES[Number(m[2]) - 1], anio: m[1] };
};

const fechaLarga = (fecha: Date): string =>
    `${fecha.getDate()} de ${MESES[fecha.getMonth()]} del ${fecha.getFullYear()}`;

const parrafo = (...segmentos: Segmento[]): BloquePosTabla => ({ tipo: 'parrafo', segmentos });

const totalPagadoParrafo = (total: string): BloquePosTabla =>
    parrafo(
        { t: 'En la imagen se evidencia que el valor total de los pagos efectuados totalizan la suma de ' },
        { t: total, b: true },
        { t: '.' }
    );

const diasMoraParrafo = (diasMora: number): BloquePosTabla =>
    parrafo(
        {
            t:
                'La imagen anterior refleja el valor total a cancelar a la fecha de expedición del ' +
                'presente estado de cuenta, registrándose un período de mora de ',
        },
        { t: String(diasMora), b: true },
        { t: ' días.' }
    );

interface Contexto {
    total: string;
    diasMora: number;
    /** Mes/año de la subrogación por ejecución del aval. */
    ejecucion: { mes: string; anio: string };
    /** Mes/año en que el avalista actual adquirió la cartera. */
    adquisicion: { mes: string; anio: string };
    obligacion: string;
}

interface Plantilla {
    empresa: string;
    logo: string;
    ciudad: string;
    parrafos: (c: Contexto) => string[];
    posTabla: (c: Contexto) => BloquePosTabla[];
    mostrarDiasMora: boolean;
    cierre: string[];
    pie?: string[];
}

const PIE_RESFIN = ['Carrera 30 7 AA 207 – Ed. Torre SCAGLIA', 'Medellín – Antioquia', 'Teléfono 310 4329 400'];

const cierreServicioAlCliente = (empresa: string, email: string): string[] => [
    'Cordialmente,',
    'Servicio al cliente',
    empresa,
    email,
];

const introAval = (nombre: string): string =>
    `${nombre} S.A.S. (en adelante ${nombre}) es una sociedad que se dedica principalmente a avalar ` +
    'títulos valores otorgados dentro del territorio nacional que garantizan el pago de créditos de ' +
    'consumo. Como es de su conocimiento, en virtud del contrato de crédito celebrado entre usted y ' +
    `Créditos Orbe S.A.S. (en adelante Crediorbe), ${nombre} avaló el pagaré otorgado por usted a ` +
    'Crediorbe garantizando así el pago de la obligación.';

const subrogacionAval = (nombre: string, obligacion: string, mes: string, anio: string): string =>
    `Por el incumplimiento en los pagos y la altura de la mora en la obligación con número de crédito ${obligacion}, ` +
    `Crediorbe efectuó el cobro a ${nombre} y esta última procedió con el pago del crédito, motivo por el ` +
    'cual adquirió la calidad de acreedor mediante la figura de la subrogación legal, ' +
    `en el mes de ${mes} del año ${anio}.`;

const introCompraCartera = (nombre: string, obligacion: string): string =>
    `${nombre} S.A.S. (en adelante, ${nombre}) es una sociedad dedicada a la compraventa de cartera. ` +
    `En virtud del contrato celebrado para tal fin, ${nombre} adquirió de Créditos Orbe S.A.S. ` +
    `(CrediOrbe by Galgo) la obligación crediticia con número de crédito ${obligacion}, originada en el ` +
    'pagaré suscrito para la financiación de la motocicleta.';

const subrogacionCompraCartera = (nombre: string, mes: string, anio: string): string =>
    `En consecuencia, y conforme a la figura de la subrogación legal, ${nombre} asumió la calidad de ` +
    `acreedor desde el mes de ${mes} de ${anio}.`;

const posTablaResfin = (c: Contexto): BloquePosTabla[] => [
    totalPagadoParrafo(c.total),
    { tipo: 'liquidador' },
    parrafo({ t: 'La anterior imagen ilustra el saldo de la deuda a la fecha con sus respectivos conceptos.' }),
];

const posTablaConDiasMora = (c: Contexto): BloquePosTabla[] => [
    totalPagadoParrafo(c.total),
    { tipo: 'liquidador' },
    diasMoraParrafo(c.diasMora),
];

// Una plantilla por avalista y tipo de documento. Aval: el avalista pagó la obligación a
// Crediorbe (subrogación por ejecución). Compra de cartera: la obligación pasó de un
// avalista a otro. Avalogic (que en los documentos se presenta como Organízate) solo tiene
// compra de cartera. Textos tomados de los formatos que se vienen emitiendo (confirmado con el
// usuario el 2026-10-08); la compra de cartera de Resfin replica la de Moviaval con los datos de Resfin.
const PLANTILLAS: Record<string, Plantilla> = {
    'Resfin:aval': {
        empresa: 'RESPALDO FINANCIERO S.A.S',
        logo: '/estado_cuenta/resfin.png',
        ciudad: 'Medellín',
        parrafos: (c) => [
            introAval('Resfin'),
            subrogacionAval('Resfin', c.obligacion, c.ejecucion.mes, c.ejecucion.anio),
        ],
        posTabla: posTablaResfin,
        mostrarDiasMora: false,
        cierre: cierreServicioAlCliente('Resfin', 'administracion@resfin.com.co'),
        pie: PIE_RESFIN,
    },
    'Resfin:compra': {
        empresa: 'RESPALDO FINANCIERO S.A.S',
        logo: '/estado_cuenta/resfin.png',
        ciudad: 'Medellín',
        parrafos: (c) => [
            introCompraCartera('Resfin', c.obligacion),
            subrogacionCompraCartera('Resfin', c.adquisicion.mes, c.adquisicion.anio),
        ],
        posTabla: posTablaResfin,
        mostrarDiasMora: false,
        cierre: cierreServicioAlCliente('Resfin', 'administracion@resfin.com.co'),
        pie: PIE_RESFIN,
    },
    'Moviaval:aval': {
        empresa: 'Moviaval S.A.S.',
        logo: '/estado_cuenta/moviaval.png',
        ciudad: 'Medellín',
        parrafos: (c) => [introAval('Moviaval'), subrogacionAval('Moviaval', c.obligacion, c.ejecucion.mes, c.ejecucion.anio)],
        posTabla: posTablaConDiasMora,
        mostrarDiasMora: true,
        cierre: cierreServicioAlCliente('Moviaval S.A.S.', 'servicioalcliente@moviaval.com'),
    },
    'Moviaval:compra': {
        empresa: 'Moviaval S.A.S.',
        logo: '/estado_cuenta/moviaval.png',
        ciudad: 'Pereira',
        parrafos: (c) => [
            introCompraCartera('Moviaval', c.obligacion),
            subrogacionCompraCartera('Moviaval', c.adquisicion.mes, c.adquisicion.anio),
        ],
        posTabla: posTablaConDiasMora,
        mostrarDiasMora: true,
        cierre: cierreServicioAlCliente('Moviaval S.A.S.', 'servicioalcliente@moviaval.com'),
    },
    'Avalogic:compra': {
        empresa: 'Organízate S.A.S.',
        logo: '/estado_cuenta/organizate.png',
        ciudad: 'Pereira',
        parrafos: (c) => [
            introCompraCartera('Organízate', c.obligacion),
            subrogacionCompraCartera('Organízate', c.adquisicion.mes, c.adquisicion.anio),
        ],
        posTabla: posTablaConDiasMora,
        mostrarDiasMora: true,
        cierre: cierreServicioAlCliente('Organízate S.A.S.', 'servicioalcliente@avalogicsas.com'),
    },
};

/** Avalogic (Organízate) solo emite compra de cartera, aunque el historial no muestre el avalista anterior. */
const esCompraCartera = (avalista: Avalista, data: EstadoCuentaResponse): boolean =>
    avalista === 'Avalogic' || data.compra_cartera;

export const plantillaDe = (data: EstadoCuentaResponse): Plantilla =>
    PLANTILLAS[`${data.avalista}:${esCompraCartera(data.avalista, data) ? 'compra' : 'aval'}`];

const periodoTexto = (data: EstadoCuentaResponse): string => {
    if (data.fecha_corte) {
        const desde = formatIsoDateDMY(data.periodo_desde ?? data.fecha_corte);
        return `Período: año fiscal ${data.fecha_corte.slice(0, 4)} (${desde} — ${formatIsoDateDMY(data.fecha_corte)})`;
    }
    // Sin año fiscal es el histórico: no se escribe en el documento.
    return '';
};

/** Arma el contenido del estado de cuenta que comparten el PDF y el Word. */
export const construirDocumento = (data: EstadoCuentaResponse): EstadoCuentaDocumento => {
    const plantilla = plantillaDe(data);
    const ejecucion = mesAnio(data.fecha_ejecucion);
    const diasMora = data.dias_mora ?? 0;
    const contexto: Contexto = {
        total: formatCurrency(data.total_pagado as number),
        diasMora,
        obligacion: String(data.obligacion),
        ejecucion,
        // Sin historial de adquisición se cae a la fecha de ejecución del aval.
        adquisicion: data.fecha_adquisicion ? mesAnio(data.fecha_adquisicion) : ejecucion,
    };

    return {
        empresa: plantilla.empresa,
        logo: plantilla.logo,
        ciudad: plantilla.ciudad,
        fecha: fechaLarga(new Date()),
        periodo: periodoTexto(data),
        parrafos: plantilla.parrafos(contexto),
        posTabla: plantilla.posTabla(contexto),
        diasMora: plantilla.mostrarDiasMora ? diasMora : null,
        cierre: plantilla.cierre,
        pie: plantilla.pie ?? [],
    };
};

const COLUMNAS_DESGLOSE = ESTADO_CUENTA_COLUMNS.filter(
    (c) => c.key !== 'fecha_pago' && c.key !== 'total_pagado'
).map((c) => c.key);

/** Diferencia máxima (en pesos) que se atribuye a redondeo y no a un valor sin clasificar. */
const MAX_AJUSTE_REDONDEO = 5;

/**
 * Se muestra en pesos enteros: redondear las columnas por separado puede dejar la suma de la
 * fila $1 distinta del total pagado. Esa diferencia se suma a la columna de mayor valor; si es
 * grande no es redondeo y se deja tal cual para no esconder un valor sin clasificar.
 */
const pagosEnPesos = <T extends EstadoCuentaRow>(pagos: T[]): T[] =>
    pagos.map((row) => {
        const ajustada = { ...row } as Record<string, unknown>;
        COLUMNAS_DESGLOSE.forEach((k) => {
            ajustada[k] = Math.round(Number(row[k] ?? 0));
        });
        const total = Math.round(Number(row.total_pagado ?? 0));
        ajustada.total_pagado = total;
        const diferencia = total - COLUMNAS_DESGLOSE.reduce((acc, k) => acc + (ajustada[k] as number), 0);
        if (diferencia !== 0 && Math.abs(diferencia) <= MAX_AJUSTE_REDONDEO) {
            const mayor = COLUMNAS_DESGLOSE.reduce((a, b) =>
                Math.abs(ajustada[b] as number) > Math.abs(ajustada[a] as number) ? b : a
            );
            ajustada[mayor] = (ajustada[mayor] as number) + diferencia;
        }
        return ajustada as unknown as T;
    });

/** Fila de la tabla ya formateada; la última es la de totales. */
export const filasTabla = (data: EstadoCuentaResponse): { filas: string[][]; totales: string[] } => {
    const pagos = pagosEnPesos(data.pagos);
    return {
        filas: pagos.map((row) =>
            ESTADO_CUENTA_COLUMNS.map((c) =>
                c.key === 'fecha_pago' ? formatDMY(String(row[c.key])) : formatCurrency(row[c.key] as number)
            )
        ),
        totales: ESTADO_CUENTA_COLUMNS.map((c, i) =>
            i === 0 ? 'TOTALES' : formatCurrency(sumEstadoCuentaColumn(pagos, c.key))
        ),
    };
};

/** Columnas de la tabla de otras fuentes: la de pagos con la fuente después de la fecha. */
export const OTRAS_FUENTES_COLUMNS: { key: keyof EstadoCuentaOtraFuenteRow; label: string }[] = [
    ESTADO_CUENTA_COLUMNS[0],
    { key: 'fuente', label: 'FUENTE' },
    ...ESTADO_CUENTA_COLUMNS.slice(1),
];

export const TITULO_OTRAS_FUENTES = 'APLICACIONES POR OTRAS FUENTES';
export const NOTA_OTRAS_FUENTES =
    'Aplicaciones por descuentos. No corresponden a pagos recibidos y no están incluidas en el total pagado.';

/** Tabla de aplicaciones por otras fuentes ya formateada; vacía si no hay ninguna. */
export const filasOtrasFuentes = (data: EstadoCuentaResponse): { filas: string[][]; totales: string[] } => {
    const otras = pagosEnPesos(data.otras_fuentes ?? []);
    const formato = (row: EstadoCuentaOtraFuenteRow, c: (typeof OTRAS_FUENTES_COLUMNS)[number]) => {
        if (c.key === 'fecha_pago') return formatDMY(String(row[c.key]));
        if (c.key === 'fuente') return row.fuente;
        return formatCurrency(row[c.key] as number);
    };
    return {
        filas: otras.map((row) => OTRAS_FUENTES_COLUMNS.map((c) => formato(row, c))),
        totales: OTRAS_FUENTES_COLUMNS.map((c, i) => {
            if (i === 0) return 'TOTALES';
            if (c.key === 'fuente') return '';
            return formatCurrency(sumEstadoCuentaColumn(otras, c.key as keyof EstadoCuentaRow));
        }),
    };
};

export const nombreArchivo =(data: EstadoCuentaResponse): string => `Estado de cuenta - ${data.obligacion}`;

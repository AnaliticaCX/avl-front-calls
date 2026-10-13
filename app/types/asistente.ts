export type SeccionResumen = 'resumen' | 'percentil' | 'top_recaudo' | 'sin_acuerdo';

export interface ResumenLinea {
    orden: number;
    etiqueta: string | null;
    celula: string | null;
    unidad: string | null;
    valor: number | null;
    fecha_base: string | null;
    base_mes: number | null;
    ratio_mes: number | null;
}

export interface ResumenResponse {
    status: string;
    fecha_corte: string;
    /** Último día con pagos aplicados en gold. */
    datos_hasta: string | null;
    /** Día en que corrió la última carga de gold. */
    ultima_carga: string | null;
    secciones: Record<SeccionResumen, ResumenLinea[]>;
}

export interface ConsultaEjecutada {
    sql: string;
    proposito: string;
    filas: number | null;
    error: string | null;
    segundos: number;
}

export interface RespuestaAsistente {
    texto: string;
    /** ok | incompleta | rechazada */
    estado: string;
    modelo: string;
    vueltas: number;
    consultas: ConsultaEjecutada[];
    uso: Record<string, number>;
}

export interface Trabajo {
    id: string;
    /** pendiente | procesando | listo | error */
    estado: string;
    creado: string;
    actualizado: string;
    pregunta: string;
    respuesta: RespuestaAsistente | null;
    error: string | null;
}

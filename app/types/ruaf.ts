export interface RuafEstado {
    disponible: boolean;
    procesando: boolean;
    total: number;
    procesadas: number;
    pendientes: number;
    exitosas: number;
    tiempo_estimado_minutos: number;
    actualizado: string;
}

export interface CorridaHistorial {
    fecha: string;
    timestamp: string;
    total: number;
    exitosas: number;
    sin_resultado: number;
    errores: number;
    pct_exito: number;
}

export interface RuafHistorial {
    corridas: CorridaHistorial[];
}

export interface RuafAccionResponse {
    ok: boolean;
    mensaje: string;
    error: string | null;
}

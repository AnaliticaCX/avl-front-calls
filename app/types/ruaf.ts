export interface RuafEstado {
    disponible: boolean;
    procesando: boolean;
    total: number;
    procesadas: number;
    pendientes: number;
    exitosas: number;
    sin_resultado?: number;
    errores?: number;
    tiempo_estimado_minutos: number;
    actualizado: string;
    /** false = el EC2 no tiene salida a RUAF (túnel/Tailscale caído); null/undefined = no reportado */
    salida_ok?: boolean | null;
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

export interface RuafSubidaUrlResponse {
    upload_url: string;
    s3_key: string;
}

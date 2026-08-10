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

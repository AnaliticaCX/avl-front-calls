export interface PazSalvoRecord {
    tipo_documento: string | null;
    documento: string | null;
    nombre_cliente: string | null;
    obligacion: string | null;
    email: string | null;
    linea: string | null;
    placa: string | null;
    chasis: string | null;
    modelo: string | null;
    color: string | null;
    motor: string | null;
    estado_obligacion: string | null;
    resultado_gestion: string | null;
    fecha_gestion: string | null;
    fecha_vencimiento: string | null;
    valor_acuerdo: number | string | null;
    valor_pagado_acuerdo: number | string | null;
    diferencia: number | string | null;
    observacion_gestion: string | null;
    cumple_condiciones: string | null;
}

export interface PazSalvoResponse {
    status: string;
    total: number;
    data: PazSalvoRecord[];
}





export interface ContactoRecord {
    solicitud_id: string | null;
    obligacion_id: string | null;
    client_name: string | null;
    client_type_contact: string | null;
    client_name_contact: string | null;
    contact_type: string | null;
    contact_information: string | null;
    obligacion_status: string | null;
    ingest_date: string | null;
}

export interface ContactosResponse {
    status: string;
    total: number;
    data: ContactoRecord[];
}

export type Avalista = "Resfin" | "Moviaval" | "Avalogic";

export interface EstadoCuentaRow {
    fecha_pago: string;
    capital_pagado: number | string;
    interes_corriente: number | string;
    interes_mora: number | string;
    gastos_cobranza: number | string;
    aval: number | string;
    seguros: number | string;
    total_pagado: number | string;
}

export interface EstadoCuentaResponse {
    status: string;
    avalista: Avalista;
    obligacion: string;
    estado_obligacion: string | null;
    documento_tipo: string | null;
    documento: string | null;
    nombre_cliente: string | null;
    saldo_actual: number | string | null;
    dias_mora: number | null;
    fecha_ejecucion: string | null;
    pagos: EstadoCuentaRow[];
    total_pagado: number | string;
}

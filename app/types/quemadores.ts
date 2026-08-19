export interface PazSalvoRecord {
    tipo_documento: string | null;
    documento: string | null;
    nombre_cliente: string | null;
    obligacion: string | null;
    email: string | null;
    linea: string | null;
    placa: string | null;
    estado_obligacion: string | null;
    resultado_gestion: string | null;
    fecha_gestion: string | null;
    fecha_vencimiento: string | null;
    valor_acuerdo: number | string | null;
    valor_pagado_acuerdo: number | string | null;
    diferencia: number | string | null;
}

export interface PazSalvoResponse {
    status: string;
    total: number;
    data: PazSalvoRecord[];
}

export interface LevantamientoRecord {
    OBLIGACION: string | null;
    ABOGADO: string | null;
    FECHA_RADICACION: string | null;
    FECHA_ORDEN: string | null;
    FECHA_LEVANTAMIENTO: string | null;
    ESTADO: string | null;
}

export interface LevantamientoResponse {
    status: string;
    total: number;
    data: LevantamientoRecord[];
}

export interface AsignacionJuridicaRecord {
    obligacion: string | null;
    cedula: string | null;
    nombre_cliente: string | null;
    acreedor: string | null;
    ciudad_correspondida: string | null;
    departamento: string | null;
    otro_si: string | null;
    fecha_ejecucion_aval: string | null;
    placa: string | null;
    direccion: string | null;
    valor_desembolso: number | string | null;
    valor_ejecutado_aval: number | string | null;
    correo: string | null;
    marca: string | null;
    referencia: string | null;
    dni_codeudor: string | null;
    nombre_codeudor: string | null;
    producto: string | null;
}

export interface AsignacionJuridicaResponse {
    status: string;
    total: number;
    page: number;
    per_page: number;
    total_pages: number;
    data: AsignacionJuridicaRecord[];
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

export interface CdrCallsRecord {
    conn_id: string;
    agent_id: string | null;
    agent_name: string | null;
    date: string;
    origin: string | null;
    destiny: string | null;
    duration: string | null;
    duration_sec: number | null;
    waiting_sec: number | null;
    channel: string | null;
    customer_id: string | null;
    state: string | null;
    call_id: string | null;
    campaign: string | null;
    telephone: string | null;
    recording: string | null;
    queue: string | null;
    ani: string | null;
    recording_sec: number | null;
    ingest_date: string | null;
}

export interface CdrCallsResponse {
    status: string;
    data: CdrCallsRecord[] | null;
    detalle: string | null;
    total: number;
    next_cursor?: string | null;
    has_more?: boolean;
    page?: number;
}

export interface CdrDetail {
    conn_id: string;
    agent_name: string;
    customer_phone: string;
    call_data: any;
    ingest_date?: string;
}

export interface Cdr1Record {
    conn_id: string;
    agent_name: string | null;
    date: string | null;
    destiny: string | null;
    telephone: string | null;
    cost: string | null;
    time_seg: string | null;
    time_min: string | null;
    cod_act: string | null;
    description_cod_act: string | null;
    cod_act_2: string | null;
    description_cod_act_2: string | null;
    type_interaction: string | null;
    customer_id: string | null;
    hang_up: string | null;
    campaign_id: string | null;
    skill_id: string | null;
    skill_name: string | null;
    agent_id: string | null;
    comment: string | null;
    ingest_date: string | null;
}

export interface Cdr5Record {
    conn_id: string;
    agent_name: string | null;
    date: string | null;
    destiny: string | null;
    telephone: string | null;
    ring_time: string | null;
    result: string | null;
    type_interaction: string | null;
    customer_id: string | null;
    campaign_id: string | null;
    agent_id: string | null;
    ingest_date: string | null;
}

export interface Cdr5Response {
    status: string;
    data: Cdr5Record[] | null;
    detalle: string | null;
    total: number;
    next_cursor?: string | null;
    has_more?: boolean;
    page?: number;
}

export interface DiagramRecord {
    rp_id: number;
    conn_id: string;
    rp_name: string | null;
    cod_opc_menu: string | null;
    dn_transfer: string | null;
    date: string | null;
    result: string | null;
    ani: string | null;
    time: string | null;
    customer_id: string | null;
    ingest_date: string | null;
}


export interface TipificationRecord {
    conn_id: string;
    agent_id: string | null;
    agent_name: string | null;
    agent_dni: string | null;
    skill_id: string | null;
    date: string | null;
    cod_act: string | null;
    description_cod_act: string | null;
    cod_act_2: string | null;
    description_cod_act_2: string | null;
    comments: string | null;
    type_interaction: string | null;
    telephone: string | null;
    destiny: string | null;
    time: string | null;
    hang_up: string | null;
    customer_id: string | null;
    campaign_id: number | null;
    ingest_date: string | null;
}

export interface Cdr9Record {
    channel: string | null;
    date: string | null;
    sent_from: string | null;
    sent_to: string | null;
    subject: string | null;
    body: string | null;
    ingested_at: string | null;
}

export interface Cdr9Response {
    status: string;
    data: Cdr9Record[] | null;
    detalle: string | null;
    total: number;
    page?: number;
    per_page?: number;
    total_pages?: number;
}

export interface DetailedCdrResponse {
    status: string;
    header: CdrCallsRecord;
    details: {
        cdr1: Cdr1Record[];
        cdr5: Cdr5Record[];
        diagram: DiagramRecord[];
        tipification: TipificationRecord[];
    };
}

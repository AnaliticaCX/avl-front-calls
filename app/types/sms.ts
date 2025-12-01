export interface SMSMessage {
    conn_id: string;
    agent_id: string | null;
    agent_name: string | null;
    date: string;
    destiny: string | null;
    telephone: string | null;
    message: string | null;
    channel: string | null;
    customer_id: string | null;
    ingest_date: string | null;
}

export interface SMSSearchParams {
    from_number?: string;
    to_number?: string;
    start_date?: string;
    end_date?: string;
    page?: number;
    page_size?: number;
}

export interface SmsSearchResponse {
    status: string;
    data: SMSMessage[] | null;
    detalle: string | null;
    total: number;
    next_cursor?: string | null;
    has_more?: boolean;
}

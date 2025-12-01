export interface Chat {
    id_conversation: string;
    first_name: string | null;
    last_name: string | null;
    phone: string | null;
    email: string | null;
    channel: string | null;
    duration: number | null;
    timestamp: string;
    reason: string | null;
    sentiment: string | null;
    agent_first_name: string | null;
    agent_last_name: string | null;
}

export interface ChatDetail {
    conversation_info: {
        id_conversation: string;
        timestamp: string;
        duration: number | null;
        channel: string | null;
        reason: string | null;
        sentiment: string | null;
    };
    customer_info: {
        first_name: string | null;
        last_name: string | null;
        phone: string | null;
        email: string | null;
    };
    agent_info: {
        agent_first_name: string | null;
        agent_last_name: string | null;
    };
    messages: ChatMessage[];
}

export interface ChatMessage {
    id_message: string;
    sender: string;
    message: string;
    date: string;
}

export interface ChatSearchParams {
    conn_id?: string;
    customer_name?: string;
    phone?: string;
    email?: string;
    start_date?: string;
    end_date?: string;
    page?: number;
    page_size?: number;
}

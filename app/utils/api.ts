import { env } from '../config/env';
import { getAuthToken } from './auth';

export interface ApiResponse<T> {
    status?: string;
    data?: T;
    detalle?: string;
    total?: number;
}

class ApiClient {
    private baseUrl: string;

    constructor() {
        this.baseUrl = env.API_URL;
    }

    private async request<T>(
        endpoint: string,
        options?: RequestInit
    ): Promise<T> {
        const url = `${this.baseUrl}${endpoint}`;
        const token = getAuthToken();

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };

        if (token) {
            headers['X-Auth-Token'] = token;
        }

        if (options?.headers) {
            Object.assign(headers, options.headers);
        }

        const response = await fetch(url, {
            ...options,
            headers,
        });

        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('Token de autenticación inválido o expirado');
            }
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        return response.json();
    }

    async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
        const queryString = params
            ? '?' + new URLSearchParams(
                Object.entries(params)
                    .filter(([_, value]) => value !== null && value !== undefined && value !== '')
                    .map(([key, value]) => [key, String(value)])
            ).toString()
            : '';

        return this.request<T>(`${endpoint}${queryString}`);
    }

    async post<T>(endpoint: string, body: Record<string, any>): Promise<T> {
        return this.request<T>(endpoint, {
            method: 'POST',
            body: JSON.stringify(body)
        });
    }
}

export const apiClient = new ApiClient();

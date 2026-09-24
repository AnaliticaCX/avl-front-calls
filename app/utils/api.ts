import { env } from '../config/env';
import { getAuthToken } from './auth';

export interface ApiResponse<T> {
    status?: string;
    data?: T;
    detalle?: string;
    total?: number;
}

/** Mensaje legible de un error de la API: `detail` de FastAPI (texto o lista de 422) o `detalle`. */
function errorDetail(body: any): string | null {
    const detail = body?.detail ?? body?.detalle ?? body?.message;
    if (Array.isArray(detail)) {
        return detail.map((d) => `${(d.loc ?? []).slice(-1)[0] ?? 'campo'}: ${d.msg}`).join('; ');
    }
    return typeof detail === 'string' && detail ? detail : null;
}

export const isAbortError = (err: unknown): boolean =>
    err instanceof DOMException && err.name === 'AbortError';

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
            headers['Authorization'] = `Bearer ${token}`;
        }

        if (options?.headers) {
            Object.assign(headers, options.headers);
        }

        try {
            const response = await fetch(url, {
                ...options,
                headers,
            });

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('Token de autenticación inválido o expirado');
                }

                let errorMessage = `Error ${response.status}: ${response.statusText}`;
                try {
                    errorMessage = errorDetail(await response.json()) ?? errorMessage;
                } catch {
                    // sin cuerpo JSON, se usa el mensaje por defecto
                }
                throw new Error(errorMessage);
            }

            // Parse JSON response
            const text = await response.text();
            if (!text) {
                console.warn('Empty response from:', url);
                return {} as T;
            }

            try {
                return JSON.parse(text);
            } catch (parseError) {
                console.error('JSON parse error:', parseError, 'Text:', text);
                throw new Error('Error al parsear la respuesta del servidor');
            }
        } catch (error) {
            if (isAbortError(error)) throw error;
            // fetch rechaza con TypeError ("Failed to fetch") si el servidor no responde o CORS lo bloquea.
            if (error instanceof TypeError) {
                throw new Error(`No se pudo conectar con el servidor (${this.baseUrl}). Verifica que el backend esté en marcha.`);
            }
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Error de red o servidor no disponible');
        }
    }

    async get<T>(endpoint: string, params?: Record<string, any>, signal?: AbortSignal): Promise<T> {
        const queryString = params
            ? '?' + new URLSearchParams(
                Object.entries(params)
                    .filter(([_, value]) => value !== null && value !== undefined && value !== '')
                    .map(([key, value]) => [key, String(value)])
            ).toString()
            : '';

        return this.request<T>(`${endpoint}${queryString}`, { signal });
    }

    async post<T>(endpoint: string, body?: Record<string, any>, signal?: AbortSignal): Promise<T> {
        return this.request<T>(endpoint, {
            method: 'POST',
            body: body !== undefined ? JSON.stringify(body) : undefined,
            signal,
        });
    }

    /** Sube con XHR (fetch no expone el progreso de subida); `onProgress` recibe 0–100. */
    putToSignedUrl(
        url: string,
        file: File,
        contentType: string,
        { onProgress, signal }: { onProgress?: (pct: number) => void; signal?: AbortSignal } = {}
    ): Promise<void> {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            const abort = () => xhr.abort();
            xhr.open('PUT', url);
            // La URL prefirmada de S3 ya lleva la firma en los query params: mandarle
            // el header Authorization de la API la invalidaría.
            xhr.setRequestHeader('Content-Type', contentType);
            xhr.upload.onprogress = (e) => {
                if (e.lengthComputable) onProgress?.(Math.round((e.loaded / e.total) * 100));
            };
            xhr.onload = () => {
                signal?.removeEventListener('abort', abort);
                if (xhr.status >= 200 && xhr.status < 300) resolve();
                else reject(new Error(`No se pudo subir el archivo a S3 (${xhr.status})`));
            };
            xhr.onerror = () => {
                signal?.removeEventListener('abort', abort);
                reject(new Error('No se pudo subir el archivo a S3 (error de red)'));
            };
            xhr.onabort = () => reject(new DOMException('Subida cancelada', 'AbortError'));
            if (signal?.aborted) return reject(new DOMException('Subida cancelada', 'AbortError'));
            signal?.addEventListener('abort', abort, { once: true });
            xhr.send(file);
        });
    }

    async getBlob(endpoint: string): Promise<Blob> {
        const token = getAuthToken();
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(`${this.baseUrl}${endpoint}`, { headers });
        if (!response.ok) {
            let errorMessage = `Error ${response.status}: ${response.statusText}`;
            try {
                errorMessage = errorDetail(await response.json()) ?? errorMessage;
            } catch {
                // sin cuerpo JSON, usar el mensaje por defecto
            }
            throw new Error(errorMessage);
        }
        return response.blob();
    }
}

export const apiClient = new ApiClient();

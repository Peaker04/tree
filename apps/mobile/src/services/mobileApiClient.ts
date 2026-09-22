import type { IAuthSessionManager } from './authSessionManager';
import type { ApiFailure, ApiSuccess } from '@novyx/contracts';

export class MobileApiError extends Error {
  status: number;
  code: string;
  details?: Record<string, unknown>;

  constructor(message: string, status: number, code = 'API_ERROR', details?: Record<string, unknown>) {
    super(message);
    this.name = 'MobileApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export interface RequestOptions {
  headers?: Record<string, string>;
  idempotencyKey?: string;
  skipAuth?: boolean;
}

export class MobileApiClient {
  private apiBaseUrl: string;
  private sessionManager: IAuthSessionManager;

  constructor(apiBaseUrl: string, sessionManager: IAuthSessionManager) {
    this.apiBaseUrl = apiBaseUrl.replace(/\/+$/, '');
    this.sessionManager = sessionManager;
  }

  async request<TResponse>(
    path: string,
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'GET',
    body?: unknown,
    options?: RequestOptions,
  ): Promise<TResponse> {
    return await this.executeWithRefresh<TResponse>(path, method, body, options, false);
  }

  private async executeWithRefresh<TResponse>(
    path: string,
    method: string,
    body?: unknown,
    options?: RequestOptions,
    isRetry = false,
  ): Promise<TResponse> {
    const url =
      path.startsWith('http://') || path.startsWith('https://')
        ? path
        : `${this.apiBaseUrl}${path.startsWith('/') ? '' : '/'}${path}`;

    const headers: Record<string, string> = {
      ...(options?.headers ?? {}),
    };

    if (body !== undefined && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    if (options?.idempotencyKey) {
      headers['Idempotency-Key'] = options.idempotencyKey;
    }

    if (!options?.skipAuth) {
      const session = await this.sessionManager.getSession();
      if (session?.accessToken) {
        headers['Authorization'] = `Bearer ${session.accessToken}`;
      }
    }

    let response: Response;
    try {
      response = await fetch(url, {
        method,
        headers,
        body: body !== undefined ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined,
      });
    } catch (err) {
      throw new MobileApiError(
        `Network connection failed: ${err instanceof Error ? err.message : String(err)}`,
        0,
        'NETWORK_ERROR',
      );
    }

    // Section 9: On HTTP 401, attempt at most ONE controlled refresh and retry once
    if (response.status === 401 && !options?.skipAuth && !isRetry) {
      try {
        await this.sessionManager.refreshSession();
        // Retry original request exactly once with new token
        return await this.executeWithRefresh<TResponse>(path, method, body, options, true);
      } catch (refreshErr) {
        throw new MobileApiError(
          `Authentication session expired and refresh failed: ${refreshErr instanceof Error ? refreshErr.message : String(refreshErr)}`,
          401,
          'UNAUTHORIZED',
        );
      }
    }

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status} ${response.statusText}`;
      let errorCode = 'HTTP_ERROR';
      let errorDetails: Record<string, unknown> | undefined;

      try {
        const errorJson = (await response.json()) as ApiFailure;
        if (errorJson?.error) {
          errorMessage = errorJson.error.message ?? errorMessage;
          errorCode = errorJson.error.code ?? errorCode;
          errorDetails = errorJson.error.details;
        }
      } catch {
        // use default HTTP error
      }

      throw new MobileApiError(errorMessage, response.status, errorCode, errorDetails);
    }

    if (response.status === 204) {
      return undefined as unknown as TResponse;
    }

    const json = await response.json();
    // Unwrap ApiSuccess if envelope is present
    if (json && typeof json === 'object' && 'data' in json) {
      return (json as ApiSuccess<TResponse>).data;
    }

    return json as TResponse;
  }

  async get<T>(path: string, options?: RequestOptions): Promise<T> {
    return await this.request<T>(path, 'GET', undefined, options);
  }

  async post<T>(path: string, body: unknown, options?: RequestOptions): Promise<T> {
    return await this.request<T>(path, 'POST', body, options);
  }

  async put<T>(path: string, body: unknown, options?: RequestOptions): Promise<T> {
    return await this.request<T>(path, 'PUT', body, options);
  }

  async patch<T>(path: string, body: unknown, options?: RequestOptions): Promise<T> {
    return await this.request<T>(path, 'PATCH', body, options);
  }

  async delete<T>(path: string, options?: RequestOptions): Promise<T> {
    return await this.request<T>(path, 'DELETE', undefined, options);
  }
}

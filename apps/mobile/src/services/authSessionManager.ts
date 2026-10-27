import type { AuthSession, LoginRequest, LoginResponse, RefreshTokenRequest } from '@novyx/contracts';
import { loadStoredAuthSession, saveAuthSession, clearAuthSession } from './authSessionStore';
import { fetchWithDevFallback } from './mobileApiClient';

export interface ISecureSessionStorage {
  loadSession(): Promise<AuthSession | null>;
  saveSession(session: AuthSession): Promise<void>;
  clearSession(): Promise<void>;
}

export class DefaultSecureSessionStorage implements ISecureSessionStorage {
  async loadSession(): Promise<AuthSession | null> {
    return await loadStoredAuthSession();
  }

  async saveSession(session: AuthSession): Promise<void> {
    await saveAuthSession(session);
  }

  async clearSession(): Promise<void> {
    await clearAuthSession();
  }
}

export class InMemorySecureSessionStorage implements ISecureSessionStorage {
  private session: AuthSession | null = null;

  async loadSession(): Promise<AuthSession | null> {
    return this.session;
  }

  async saveSession(session: AuthSession): Promise<void> {
    this.session = session;
  }

  async clearSession(): Promise<void> {
    this.session = null;
  }
}

export class AuthSessionError extends Error {
  code: 'UNAUTHENTICATED' | 'REFRESH_FAILED' | 'LOGIN_FAILED';
  status: number;

  constructor(message: string, code: 'UNAUTHENTICATED' | 'REFRESH_FAILED' | 'LOGIN_FAILED', status = 401) {
    super(message);
    this.name = 'AuthSessionError';
    this.code = code;
    this.status = status;
  }
}

export interface IAuthSessionManager {
  initialize?(): Promise<AuthSession | null>;
  getSession(): Promise<AuthSession | null>;
  getActiveSessionSync(): AuthSession | null;
  login(request: LoginRequest): Promise<AuthSession>;
  refreshSession(): Promise<AuthSession>;
  logout(): Promise<void>;
  clearLocalSession(): Promise<void>;
  setSession(session: AuthSession | null): Promise<void>;
}

export class AuthSessionManager implements IAuthSessionManager {
  private apiBaseUrl: string;
  private storage: ISecureSessionStorage;
  private activeSession: AuthSession | null = null;
  private initialized = false;
  private refreshFlightPromise: Promise<AuthSession> | null = null;

  constructor(apiBaseUrl: string, storage?: ISecureSessionStorage) {
    this.apiBaseUrl = apiBaseUrl.replace(/\/+$/, '');
    this.storage = storage ?? new DefaultSecureSessionStorage();
  }

  async initialize(): Promise<AuthSession | null> {
    if (!this.initialized) {
      this.activeSession = await this.storage.loadSession();
      this.initialized = true;
    }
    return this.activeSession;
  }

  getActiveSessionSync(): AuthSession | null {
    return this.activeSession;
  }

  async getSession(): Promise<AuthSession | null> {
    if (!this.initialized) {
      await this.initialize();
    }
    return this.activeSession;
  }

  async setSession(session: AuthSession | null): Promise<void> {
    this.activeSession = session;
    this.initialized = true;
    if (session) {
      await this.storage.saveSession(session);
    } else {
      await this.storage.clearSession();
    }
  }

  async login(request: LoginRequest): Promise<AuthSession> {
    let response: Response;
    try {
      response = await fetchWithDevFallback(this.apiBaseUrl, '/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });
    } catch (err) {
      throw new AuthSessionError(
        `Failed to connect to authentication server: ${err instanceof Error ? err.message : String(err)}`,
        'LOGIN_FAILED',
        0,
      );
    }

    if (!response.ok) {
      let message = `Login failed with HTTP ${response.status}`;
      try {
        const errorJson = (await response.json()) as { error?: { message?: string } };
        if (errorJson?.error?.message) {
          message = errorJson.error.message;
        }
      } catch {
        // use default message
      }
      throw new AuthSessionError(message, 'LOGIN_FAILED', response.status);
    }

    const json = (await response.json()) as LoginResponse;
    if (!json?.session || !json.session.accessToken || !json.session.refreshToken) {
      throw new AuthSessionError('Server returned malformed auth response', 'LOGIN_FAILED', 500);
    }

    // Preserve raw human role (staff, manager, admin) without coercion
    await this.setSession(json.session);
    return json.session;
  }

  /**
   * Section 10: Single-Flight Refresh
   * Concurrent 401s coalesce onto the same in-flight refresh promise.
   * Exactly one HTTP request is executed for the active credential family.
   */
  async refreshSession(): Promise<AuthSession> {
    if (this.refreshFlightPromise) {
      return await this.refreshFlightPromise;
    }

    this.refreshFlightPromise = (async () => {
      try {
        const currentSession = await this.getSession();
        if (!currentSession?.refreshToken) {
          throw new AuthSessionError('No refresh token available to rotate', 'UNAUTHENTICATED', 401);
        }

        const body: RefreshTokenRequest = {
          refreshToken: currentSession.refreshToken,
        };

        let response: Response;
        try {
          response = await fetchWithDevFallback(this.apiBaseUrl, '/v1/auth/refresh', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
          });
        } catch (netErr) {
          throw new AuthSessionError(
            `Network failure during session refresh: ${netErr instanceof Error ? netErr.message : String(netErr)}`,
            'REFRESH_FAILED',
            0,
          );
        }

        if (!response.ok) {
          // Refresh failed: session is expired, revoked, reused, or invalid
          let errorMsg = `Session refresh failed with HTTP ${response.status}`;
          try {
            const errPayload = (await response.json()) as { error?: { message?: string } };
            if (errPayload?.error?.message) {
              errorMsg = errPayload.error.message;
            }
          } catch {
            // retain default
          }

          // Invalidate local session
          await this.clearLocalSession();
          throw new AuthSessionError(errorMsg, 'REFRESH_FAILED', response.status);
        }

        const json = (await response.json()) as LoginResponse;
        if (!json?.session || !json.session.accessToken || !json.session.refreshToken) {
          await this.clearLocalSession();
          throw new AuthSessionError('Server returned malformed session refresh response', 'REFRESH_FAILED', 500);
        }

        // Atomically replace session in memory and SecureStore
        await this.setSession(json.session);
        return json.session;
      } finally {
        this.refreshFlightPromise = null;
      }
    })();

    return await this.refreshFlightPromise;
  }

  async logout(): Promise<void> {
    const session = await this.getSession();
    if (session?.accessToken) {
      try {
        await fetch(`${this.apiBaseUrl}/v1/auth/logout`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        });
      } catch {
        // Regardless of remote outcome, local session is cleared
      }
    }

    await this.clearLocalSession();
  }

  async clearLocalSession(): Promise<void> {
    this.activeSession = null;
    this.initialized = true;
    await this.storage.clearSession();
  }
}

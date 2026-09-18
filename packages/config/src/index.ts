export type AppEnvironment = 'development' | 'staging' | 'production';

export interface PublicRuntimeConfig {
  appEnv: AppEnvironment;
  apiBaseUrl: string;
}

const allowedAppEnvironments = new Set<AppEnvironment>(['development', 'staging', 'production']);

export function readPublicRuntimeConfig(source: Record<string, string | undefined>): PublicRuntimeConfig {
  const appEnv = source.EXPO_PUBLIC_APP_ENV;
  const apiBaseUrl = source.EXPO_PUBLIC_API_BASE_URL;
  const errors: string[] = [];

  if (!appEnv || !allowedAppEnvironments.has(appEnv as AppEnvironment)) {
    errors.push('EXPO_PUBLIC_APP_ENV must be development, staging, or production.');
  }

  if (!apiBaseUrl) {
    errors.push('EXPO_PUBLIC_API_BASE_URL is required.');
  } else {
    try {
      new URL(apiBaseUrl);
    } catch {
      errors.push('EXPO_PUBLIC_API_BASE_URL must be a valid absolute URL.');
    }
  }

  if (errors.length > 0) {
    throw new Error(`Invalid public runtime config: ${errors.join(' ')}`);
  }

  if (!apiBaseUrl) {
    throw new Error('Invalid public runtime config: EXPO_PUBLIC_API_BASE_URL is required.');
  }

  return {
    appEnv: appEnv as AppEnvironment,
    apiBaseUrl,
  };
}

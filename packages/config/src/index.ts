export type AppEnvironment = 'development' | 'staging' | 'production';

export interface PublicRuntimeConfig {
  appEnv: AppEnvironment;
  apiBaseUrl: string;
  dataSource: 'rest';
}

const allowedAppEnvironments = new Set<AppEnvironment>(['development', 'staging', 'production']);

export function readPublicRuntimeConfig(source: Record<string, string | undefined>): PublicRuntimeConfig {
  const appEnv = source.EXPO_PUBLIC_APP_ENV;
  const apiBaseUrl = source.EXPO_PUBLIC_API_BASE_URL ?? source.EXPO_PUBLIC_API_FUD ?? source.EXPO_PUBLIC_API_HOME;
  const apiBaseUrlSource = source.EXPO_PUBLIC_API_BASE_URL
    ? 'EXPO_PUBLIC_API_BASE_URL'
    : source.EXPO_PUBLIC_API_FUD
      ? 'EXPO_PUBLIC_API_FUD'
      : source.EXPO_PUBLIC_API_HOME
        ? 'EXPO_PUBLIC_API_HOME'
        : 'EXPO_PUBLIC_API_BASE_URL';
  const legacyDataSource = source.EXPO_PUBLIC_DATA_SOURCE;
  const errors: string[] = [];

  if (!appEnv || !allowedAppEnvironments.has(appEnv as AppEnvironment)) {
    errors.push('EXPO_PUBLIC_APP_ENV must be development, staging, or production.');
  }

  if (!apiBaseUrl) {
    errors.push('EXPO_PUBLIC_API_BASE_URL, EXPO_PUBLIC_API_FUD, or EXPO_PUBLIC_API_HOME is required.');
  } else {
    try {
      new URL(apiBaseUrl);
    } catch {
      errors.push(`${apiBaseUrlSource} must be a valid absolute URL.`);
    }
  }

  if (legacyDataSource && legacyDataSource !== 'rest') {
    errors.push('EXPO_PUBLIC_DATA_SOURCE=mock is no longer supported; mobile runtime is REST-only.');
  }

  if (errors.length > 0) {
    throw new Error(`Invalid public runtime config: ${errors.join(' ')}`);
  }

  if (!apiBaseUrl) {
    throw new Error('Invalid public runtime config: a public API URL is required.');
  }

  return {
    appEnv: appEnv as AppEnvironment,
    apiBaseUrl,
    dataSource: 'rest',
  };
}

export type AppEnvironment = 'development' | 'staging' | 'production';
export type DataSourceMode = 'mock' | 'rest';

export interface PublicRuntimeConfig {
  appEnv: AppEnvironment;
  apiBaseUrl: string;
  dataSource: DataSourceMode;
}

const allowedAppEnvironments = new Set<AppEnvironment>(['development', 'staging', 'production']);
const allowedDataSources = new Set<DataSourceMode>(['mock', 'rest']);

export function readPublicRuntimeConfig(source: Record<string, string | undefined>): PublicRuntimeConfig {
  const appEnv = source.EXPO_PUBLIC_APP_ENV;
  const apiBaseUrl = source.EXPO_PUBLIC_API_BASE_URL;
  const rawDataSource = source.EXPO_PUBLIC_DATA_SOURCE;
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

  let dataSource: DataSourceMode = 'rest';
  if (rawDataSource !== undefined && rawDataSource !== '') {
    if (allowedDataSources.has(rawDataSource as DataSourceMode)) {
      dataSource = rawDataSource as DataSourceMode;
    } else {
      errors.push('EXPO_PUBLIC_DATA_SOURCE must be mock or rest.');
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
    dataSource,
  };
}

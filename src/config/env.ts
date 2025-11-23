// src/config/env.ts

const ENV_CONFIG = {
  dev: {
    API_URL: __DEV__ 
      ? 'https://vsrwljl6-8080.uks1.devtunnels.ms/api'
      : 'https://vsrwljl6-8080.uks1.devtunnels.ms/api',
    ENABLE_LOGGING: true,
    API_TIMEOUT: 30000,
  },
  staging: {
    API_URL: 'https://staging-api.yourapp.com/api',
    ENABLE_LOGGING: true,
    API_TIMEOUT: 30000,
  },
  prod: {
    API_URL: 'https://api.yourapp.com/api',
    ENABLE_LOGGING: false,
    API_TIMEOUT: 15000,
  },
};

function getEnvVars() {
  // Prefer an explicit EXPO_PUBLIC_ENV (settable in EAS/eas.json or Expo Dashboard).
  // Fallback to NODE_ENV for convenience. Default to 'dev' if not provided.
  const raw = (process.env.EXPO_PUBLIC_ENV || process.env.NODE_ENV || 'dev').toString().toLowerCase();

  if (raw === 'prod' || raw === 'production') return ENV_CONFIG.prod;
  if (raw === 'staging' || raw === 'stage') return ENV_CONFIG.staging;
  return ENV_CONFIG.dev;
}

const ENV = getEnvVars();

// Backwards compatibility
export const API_BASE_URL = ENV.API_URL;

export default ENV;

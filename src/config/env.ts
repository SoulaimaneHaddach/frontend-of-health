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
  return ENV_CONFIG.dev;
}

const ENV = getEnvVars();

// Backwards compatibility
export const API_BASE_URL = ENV.API_URL;

export default ENV;

// src/config/env.ts
// Lightweight env accessor without external deps.
// You can override at runtime via: (globalThis as any).API_BASE_URL = 'http://10.0.2.2:8080/api'

const fromGlobal = (globalThis as any)?.API_BASE_URL;

export const API_BASE_URL: string =
  (typeof fromGlobal === 'string' && fromGlobal.trim()) ||
  'https://vsrwljl6-8080.uks1.devtunnels.ms/api';

export default { API_BASE_URL };

// frontend/config.js  (compat shim)
export const API_BASE =
  (typeof window !== 'undefined' && window.__API_BASE__) || '';

export const apiTimeout =
  (typeof window !== 'undefined' && Number(window.__API_TIMEOUT__)) || 15000;

export const retryAttempts =
  (typeof window !== 'undefined' && Number(window.__API_RETRY__)) || 2;

const CONFIG = {
  API_BASE_URL: API_BASE,
  API_BASE,
  apiTimeout,
  retryAttempts,
};

if (typeof window !== 'undefined') {
  window.CONFIG = window.CONFIG || CONFIG;        // legacy global
  window.RBCK = window.RBCK || {};
  window.RBCK.config = window.RBCK.config || {
    apiBase: API_BASE,
    apiTimeout,
    retryAttempts,
  };
}

export default CONFIG;
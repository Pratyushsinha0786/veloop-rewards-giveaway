import axios, { AxiosError } from 'axios';

// Get or generate persistent device ID in localStorage
function getDeviceId(): string {
  try {
    let deviceId = localStorage.getItem('veloop_device_id');
    if (!deviceId) {
      // crypto.randomUUID() fallback if older browser
      deviceId =
        typeof crypto.randomUUID === 'function'
          ? crypto.randomUUID()
          : 'device-' + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('veloop_device_id', deviceId);
    }
    return deviceId;
  } catch (_e) {
    return 'device-storage-unavailable';
  }
}

const baseURL = (import.meta as any).env?.VITE_API_URL || '/api';

export const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor: Attach JWT token and x-device-hash
apiClient.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem('veloop_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    config.headers['x-device-hash'] = getDeviceId();
  } catch (_e) {
    // ignore storage access issues
  }
  return config;
});

// Helper for human-readable error extraction
export function errorMessage(err: any): string {
  if (err instanceof AxiosError) {
    if (err.response?.data?.message) {
      return err.response.data.message;
    }
    if (err.code === 'ERR_NETWORK' || !err.response) {
      return "Can't reach the server.";
    }
  }
  return err?.message || 'Something went wrong. Please try again.';
}

export default apiClient;

import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

const api = axios.create({
  baseURL: BASE,
  withCredentials: true,  // sends httpOnly refresh-token cookie automatically
});

// ── Refresh-token queue ──────────────────────────────────────────────────────
// When multiple requests 401 at the same time, queue them and retry all once
// the token is refreshed — prevents multiple parallel refresh calls.
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  failedQueue = [];
};

// ── Request interceptor: attach auth token ──────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor: auto-refresh + structured errors ──────────────────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const res = error.response;
    const originalRequest = error.config;

    // ── Silent token refresh on 401 ─────────────────────────────────────────
    // Skip refresh for the refresh endpoint itself to avoid infinite loops
    if (
      res?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/refresh') &&
      !originalRequest.url?.includes('/auth/login')
    ) {
      if (isRefreshing) {
        // Queue this request; it will be retried once refresh succeeds
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        }).catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const storedRefreshToken = localStorage.getItem('refreshToken');
        // Sends both httpOnly cookie (withCredentials) AND body fallback for cross-domain stability
        const refreshRes = await axios.post(
          `${BASE}/auth/refresh`,
          { refreshToken: storedRefreshToken },
          { withCredentials: true }
        );
        const newAccessToken = refreshRes.data?.data?.accessToken;
        const newRefreshToken = refreshRes.data?.data?.refreshToken;

        if (!newAccessToken) throw new Error('No access token in refresh response');

        localStorage.setItem('token', newAccessToken);
        if (newRefreshToken) {
          localStorage.setItem('refreshToken', newRefreshToken);
        }

        // Reconnect socket with new token (lazy import to avoid circular dep)
        import('./socket').then(({ connectSocket, disconnectSocket }) => {
          disconnectSocket();
          connectSocket(newAccessToken);
        }).catch(() => {});

        processQueue(null, newAccessToken);
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        // Refresh itself failed → full logout
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        dispatchApiEvent('Your session has expired. Please log in again.', 'warning', 401);
        setTimeout(() => { window.location.href = '/auth'; }, 1500);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // ── Structured error handling for all other errors ───────────────────────
    if (res) {
      const status = res.status;
      const serverMessage = res.data?.message || res.data?.error || 'An unexpected error occurred.';
      const errors = res.data?.errors || [];

      // Attach validation info for 422 responses
      if (status === 422) {
        const fieldMap = {};
        errors.forEach((e) => {
          const f = e.field || 'general';
          fieldMap[f] = fieldMap[f] ? `${fieldMap[f]}; ${e.message}` : e.message;
        });
        error.validation = { errors, fieldMap };
      }

      let toastMsg = errors.length > 0 ? errors.map((e) => e.message).join(' • ') : serverMessage;
      
      // Clean up technical messages into friendly user-understandable language
      if (status === 429) {
        toastMsg = 'Too many requests. Please wait a moment before trying again.';
      } else if (status === 403 && (toastMsg.includes('Role') || toastMsg.includes('authorized'))) {
        toastMsg = 'Access restricted: You do not have permission for this section.';
      } else if (status === 404 && toastMsg.includes('Route')) {
        toastMsg = 'The requested section or resource could not be found.';
      } else if (status === 500) {
        toastMsg = 'Server experienced an error. Please try again in a few seconds.';
      }

      let toastType = 'error';
      if (status === 401 || status === 403 || status === 429) toastType = 'warning';
      if (status === 404) toastType = 'info';

      error.apiMessage = toastMsg;
      error.apiStatus = status;

      // Don't fire toast for 401 when we successfully refreshed (handled above)
      if (status !== 401) {
        dispatchApiEvent(toastMsg, toastType, status);
      }
    } else {
      dispatchApiEvent('Unable to connect to server. Please check your internet connection.', 'error', 0);
      error.apiMessage = 'Unable to connect to server.';
    }

    return Promise.reject(error);
  }
);

function dispatchApiEvent(message, type, status) {
  window.dispatchEvent(new CustomEvent('api-error', { detail: { message, type, status } }));
}

export default api;

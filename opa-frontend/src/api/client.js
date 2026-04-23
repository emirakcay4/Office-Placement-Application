import axios from 'axios';

// Get base URL from environment variables, fallback for local dev if missing
const baseURL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000/api';

const client = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Avoid infinite refresh loops if the refresh token itself fails
let isRefreshing = false;
let refreshSubscribers = [];

function subscribeTokenRefresh(cb) {
  refreshSubscribers.push(cb);
}

function onRefreshed(token) {
  refreshSubscribers.map(cb => cb(token));
  refreshSubscribers = [];
}

// ----------------------------------------------------------------------
// Request Interceptor: Attach JWT Access Token
// ----------------------------------------------------------------------
client.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ----------------------------------------------------------------------
// Response Interceptor: Handle 401 & Silent Refresh
// ----------------------------------------------------------------------
client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is 401, not a login attempt, and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry && originalRequest.url !== '/auth/login/') {
      if (isRefreshing) {
        // If already refreshing, wait for the new token and retry
        try {
          const token = await new Promise((resolve) => {
            subscribeTokenRefresh((newToken) => {
              resolve(newToken);
            });
          });
          originalRequest.headers['Authorization'] = `Bearer ${token}`;
          return client(originalRequest);
        } catch (err) {
          return Promise.reject(err);
        }
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refresh_token');

      // If no refresh token, bail out (user must log in again)
      if (!refreshToken) {
        isRefreshing = false;
        // Optionally trigger a custom event or redirect here, handled better via Context
        return Promise.reject(error);
      }

      try {
        // Try to get a new access token
        const response = await axios.post(`${baseURL}/auth/refresh/`, {
          refresh: refreshToken,
        });

        const newAccessToken = response.data.access;
        localStorage.setItem('access_token', newAccessToken);
        
        // Sometimes rotation gives a new refresh token too
        if (response.data.refresh) {
          localStorage.setItem('refresh_token', response.data.refresh);
        }

        client.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
        originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;

        onRefreshed(newAccessToken);
        isRefreshing = false;

        return client(originalRequest);
      } catch (refreshError) {
        // Refresh failed (e.g., token expired or revoked)
        isRefreshing = false;
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        
        // Dispatch custom event to tell AuthContext to clear state and redirect to /login
        window.dispatchEvent(new Event('auth:logout'));
        return Promise.reject(refreshError);
      }
    }

    // Return any other errors to the calling component
    return Promise.reject(error);
  }
);

export default client;

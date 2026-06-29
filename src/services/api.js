import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach JWT token to outgoing requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor to unwrap backend response format
api.interceptors.response.use(
  (response) => {
    // Safely unpack backend-wrapped payload
    return response.data && response.data.result !== undefined
      ? response.data.result
      : response.data;
  },
  (error) => {
    // Pass errors down to component handlers
    return Promise.reject(error);
  }
);

export default api;

import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

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

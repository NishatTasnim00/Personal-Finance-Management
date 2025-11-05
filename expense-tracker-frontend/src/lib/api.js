// src/lib/api.js
import axios from 'axios';
import { auth } from '@/lib/firebase';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
});

// Request Interceptor: Add Firebase Token
api.interceptors.request.use(
  (config) => {
    const user = auth.currentUser;
    if (user) {
      return user.getIdToken().then((token) => {
        config.headers.Authorization = `Bearer ${token}`;
        return config;
      });
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Extract data only
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'Network Error';

    return Promise.reject(new Error(message));
  }
);

export default api;
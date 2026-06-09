import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://rda-vzp4.onrender.com/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token and Branch ID headers
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('rda_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const activeBranchId = localStorage.getItem('rda_active_branch_id');
    if (activeBranchId) {
      config.headers['x-branch-id'] = activeBranchId;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle unauthorized access
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear storage and redirect to login if unauthorized
      localStorage.removeItem('rda_token');
      localStorage.removeItem('rda_user');
      localStorage.removeItem('rda_active_branch_id');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

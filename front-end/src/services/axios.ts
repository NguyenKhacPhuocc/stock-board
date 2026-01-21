import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
    // withCredentials: true, // Always include cookies
    timeout: 10000, // Request timeout in milliseconds
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add authorization header (if needed)
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle errors globally
api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        // Handle error globally, e.g., redirect to login if 401
        if (error.response && error.response.status === 401) {
            localStorage.removeItem('accessToken');
        }
        return Promise.reject(error);
    }
);

export default api;

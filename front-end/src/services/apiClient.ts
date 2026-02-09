/**
 * Usage:
 * import { apiClient } from '@/services/apiClient';
 * 
 * const data = await apiClient.get('/api/users');
 * const result = await apiClient.post('/api/orders', { ... });
 */

import api from './axios';

export const apiClient = {
    /**
     * GET request
     */
    get: async <T = unknown>(url: string, config?: Record<string, unknown>) => {
        const response = await api.get<T>(url, config);
        return response.data;
    },

    /**
     * POST request
     */
    post: async <T = unknown>(
        url: string,
        data?: unknown,
        config?: Record<string, unknown>
    ) => {
        const response = await api.post<T>(url, data, config);
        return response.data;
    },

    /**
     * PUT request
     */
    put: async <T = unknown>(
        url: string,
        data?: unknown,
        config?: Record<string, unknown>
    ) => {
        const response = await api.put<T>(url, data, config);
        return response.data;
    },

    /**
     * PATCH request
     */
    patch: async <T = unknown>(
        url: string,
        data?: unknown,
        config?: Record<string, unknown>
    ) => {
        const response = await api.patch<T>(url, data, config);
        return response.data;
    },

    /**
     * DELETE request
     */
    delete: async <T = unknown>(url: string, config?: Record<string, unknown>) => {
        const response = await api.delete<T>(url, config);
        return response.data;
    },
};

// Export the raw axios instance for advanced usage
export { default as api } from './axios';

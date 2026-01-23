import axios from 'axios';

/**
 * Configure axios for BSC API
 * Use proxy configured in vite.config.ts to avoid CORS
 */
const apiClient = axios.create({
    baseURL: '/api-bsc/datafeed',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const marketService = {
    /**
     * Fetch instruments by exchange
     * @param exchange - e.g. 'HOSE', 'HNX', 'UPCOM'
     */
    getInstruments: async (exchange: string = 'HOSE') => {
        try {
            const response = await apiClient.get('/instruments', {
                params: { exchange }
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching instruments:', error);
            throw error;
        }
    }
};

import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({
    baseURL: API_URL,
});

export const getPrice = async (marketHashName, currency = 'USD') => {
    try {
        const response = await api.get('/price', { params: { name: marketHashName, currency } });
        return response.data;
    } catch (error) {
        console.error('Error fetching price:', error);
        return null;
    }
};

export const getPortfolios = async (userId) => {
    try {
        const response = await api.get(`/portfolio/${userId}`);
        // Ensure we always return an array
        return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
        console.error('Error fetching portfolios:', error);
        return [];
    }
};

export const createPortfolio = async (userId, name) => {
    try {
        const response = await api.post(`/portfolio/${userId}`, { name });
        return response.data;
    } catch (error) {
        console.error('Error creating portfolio:', error);
        return null;
    }
};

export const renamePortfolio = async (userId, portfolioId, name) => {
    try {
        const response = await api.put(`/portfolio/${userId}/${portfolioId}`, { name });
        return response.data;
    } catch (error) {
        console.error('Error renaming portfolio:', error);
        return null;
    }
};

export const deletePortfolio = async (userId, portfolioId) => {
    try {
        const response = await api.delete(`/portfolio/${userId}/${portfolioId}`);
        return response.data;
    } catch (error) {
        console.error('Error deleting portfolio:', error);
        return null;
    }
};

// Update existing add function to support portfolioId
export const addItemToPortfolio = async (userId, portfolioId, item) => {
    try {
        const response = await api.post(`/portfolio/${userId}/${portfolioId}/add`, item);
        return response.data;
    } catch (error) {
        console.error('Error adding item:', error);
        throw error;
    }
};

export const deleteItem = async (userId, portfolioId, itemId) => {
    try {
        const response = await api.delete(`/portfolio/${userId}/${portfolioId}/items/${itemId}`);
        return response.data;
    } catch (error) {
        console.error('Error deleting item:', error);
        return null;
    }
};

// Legacy support (optional, can remove if we fully migrate)
export const getPortfolio = async (userId) => {
    // Return the first portfolio as default for now if needed (shim)
    const list = await getPortfolios(userId);
    return list[0] || { items: [] };
};

export const searchItems = async (query) => {
    try {
        const response = await api.get('/search', { params: { query } });
        return response.data;
    } catch (error) {
        console.error('Error searching items:', error);
        return { success: false, results: [] };
    }
};

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const fetchWikiCases = async () => {
    try {
        const response = await fetch(`${API_URL}/wiki/cases`);
        if (!response.ok) throw new Error('Failed to fetch cases');
        return await response.json();
    } catch (error) {
        console.error('Wiki API Error:', error);
        return [];
    }
};

export const fetchWikiCollection = async (id) => {
    try {
        const response = await fetch(`${API_URL}/wiki/collection/${id}`);
        if (!response.ok) throw new Error('Failed to fetch collection');
        return await response.json();
    } catch (error) {
        console.error('Wiki API Error:', error);
        return null;
    }
};

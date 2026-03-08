import fetch from 'node-fetch';
import { TRAVEL_API_CONFIG } from '../config/travelApi.js';

const { API_KEY, BASE_URL } = TRAVEL_API_CONFIG.VIATOR;

export const viatorService = {
    /**
     * Search for products (tours/activities)
     * @param {Object} criteria - { destinationId, currency, etc. }
     */
    searchProducts: async (criteria = {}) => {
        try {
            // If we don't have a destination ID, we might need to search for it first?
            // For now, assume criteria might contain raw text to find destination?
            // Viator API v2 usually requires Destination ID.
            // Let's implement a destination search if needed, or just a general product search if v2 allows.
            // Actually, /search/freetext is useful.

            const endpoint = `${BASE_URL}/search`;
            // Note: endpoint might differ based on version. Assuming v2 partner API.

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'Accept-Language': 'en-US',
                    'exp-api-key': API_KEY
                },
                body: JSON.stringify({
                    "filtering": criteria.filtering || {},
                    "sorting": { "sort": "QUALITY", "order": "DESCENDING" },
                    "pagination": { "start": 1, "count": 5 },
                    "currency": "USD"
                })
            });

            if (!response.ok) {
                const err = await response.text();
                console.error("Viator API Error:", err);
                throw new Error(`Viator API Error: ${response.statusText}`);
            }

            const data = await response.json();
            return data;

        } catch (error) {
            console.error('Viator Service Error:', error);
            return null; // Fail gracefully
        }
    }
};

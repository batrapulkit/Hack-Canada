import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import api from '@/api/client';

const AmadeusContext = createContext(null);

export function AmadeusProvider({ children }) {
    const { agency } = useAuth();
    const [amadeusConfig, setAmadeusConfig] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch Amadeus configuration
    useEffect(() => {
        const fetchConfig = async () => {
            if (!agency?.id) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const response = await api.get(`/integrations/gds?agency_id=${agency.id}`);
                setAmadeusConfig(response.data || null);
                setError(null);
            } catch (err) {
                console.error('[Amadeus] Failed to fetch config:', err);
                setError(err.message);
                setAmadeusConfig(null);
            } finally {
                setLoading(false);
            }
        };

        fetchConfig();
    }, [agency?.id]);

    // Check if Amadeus is properly configured
    const isConfigured = () => {
        return !!(amadeusConfig?.amadeus_client_id && amadeusConfig?.amadeus_client_secret);
    };

    // Refresh configuration (call after user saves new keys)
    const refreshConfig = async () => {
        if (!agency?.id) return;

        try {
            const response = await api.get(`/integrations/gds?agency_id=${agency.id}`);
            setAmadeusConfig(response.data || null);
            setError(null);
        } catch (err) {
            console.error('[Amadeus] Failed to refresh config:', err);
            setError(err.message);
        }
    };

    const value = {
        amadeusConfig,
        loading,
        error,
        isConfigured,
        refreshConfig
    };

    return <AmadeusContext.Provider value={value}>{children}</AmadeusContext.Provider>;
}

export function useAmadeus() {
    const context = useContext(AmadeusContext);
    if (!context) {
        throw new Error('useAmadeus must be used within AmadeusProvider');
    }
    return context;
}

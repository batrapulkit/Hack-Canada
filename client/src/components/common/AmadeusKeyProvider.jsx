
import React, { createContext, useContext, useState, useEffect } from 'react';
import AmadeusKeyMissingDialog from './AmadeusKeyMissingDialog';
import api from "@/api/client";

const AmadeusContext = createContext();

export const useAmadeusKeys = () => useContext(AmadeusContext);

export function AmadeusKeyProvider({ children }) {
    const [showKeyDialog, setShowKeyDialog] = useState(false);
    const [onSuccessCallback, setOnSuccessCallback] = useState(null);

    const triggerKeyDialog = (callback = null) => {
        if (callback) setOnSuccessCallback(() => callback);
        setShowKeyDialog(true);
    };

    // Global Interceptor Integration
    useEffect(() => {
        // We add an interceptor to catch 412 or specific error codes
        const interceptor = api.interceptors.response.use(
            (response) => response,
            (error) => {
                // Check if it's our specific error
                const isKeyError =
                    error.response?.data?.code === 'MISSING_GDS_KEYS' ||
                    (error.response?.status === 412 && error.response?.data?.error?.includes('Amadeus'));

                if (isKeyError) {
                    // Prevent multiple popups or loops
                    if (!showKeyDialog) {
                        triggerKeyDialog(() => {
                            // Optional: Retry the failed request?
                            // Implementing retry logic is complex for axios here, 
                            // simpler to just let user re-click or handle specific refresh.
                            // But we can reload page or just close.
                            window.location.reload(); // Simple brute force retry for now or just close
                        });
                    }
                    // Return a pending promise so the UI doesn't crash immediately? 
                    // No, usually best to let the error propagate but we handled the side effect.
                }
                return Promise.reject(error);
            }
        );

        return () => {
            api.interceptors.response.eject(interceptor);
        };
    }, []);

    return (
        <AmadeusContext.Provider value={{ triggerKeyDialog }}>
            {children}
            <AmadeusKeyMissingDialog
                open={showKeyDialog}
                onOpenChange={setShowKeyDialog}
                onSuccess={() => {
                    if (onSuccessCallback) onSuccessCallback();
                    setShowKeyDialog(false);
                }}
            />
        </AmadeusContext.Provider>
    );
}

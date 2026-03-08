export const TRAVEL_API_CONFIG = {
    VIATOR: {
        API_KEY: process.env.VITE_VIATOR_API_KEY || 'P00280974', // Fallback to provided key
        BASE_URL: 'https://api.viator.com/partner/products'
    },
    TRIP_COM: {
        AID: process.env.VITE_TRIP_COM_AID || '7450360',
        SID: process.env.VITE_TRIP_COM_SID || '283186583'
    },
    BOOKING: {
        AWIN_MID: process.env.VITE_BOOKING_AWIN_MID || '83599',
        AWIN_AFFID: process.env.VITE_BOOKING_AWIN_AFFID || '2696548'
    }
};

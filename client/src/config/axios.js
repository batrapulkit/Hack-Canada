import axios from 'axios';

const instance = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add a request interceptor to include the auth token if available (from Supabase session)
instance.interceptors.request.use(
    (config) => {
        // Dynamic lookup for Supabase token to avoid hardcoded project ID issues
        let token = null;

        // 1. Try standard Supabase key pattern
        const key = Object.keys(localStorage).find(k => k.startsWith('sb-') && k.endsWith('-auth-token'));
        if (key) {
            const session = localStorage.getItem(key);
            if (session) {
                try {
                    const parsed = JSON.parse(session);
                    if (parsed.access_token) token = parsed.access_token;
                } catch (e) { /* ignore parse error */ }
            }
        }

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default instance;

import rateLimit from 'express-rate-limit';

// General API Limiter: 100 requests per 15 minutes
// Good for general usage to prevent abuse
export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500, // Production: 500 requests per 15 minutes
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: {
        error: 'Too many requests, please try again later.'
    }
});

// Stricter Auth Limiter: 5 requests per hour
// Apply to login/register to prevent brute force
export const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 30, // Production: 30 login attempts per hour (prevents brute force but allows normal use)
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        error: 'Too many login attempts, please try again in an hour.'
    }
});

// AI Generation Limiter: 20 requests per hour
// Protects expensive AI tokens
export const aiLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 100, // Production: Protects expensive AI tokens while allowing normal usage
    message: {
        error: 'AI usage limit exceeded for this IP. Please try again later.'
    }
});

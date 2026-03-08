import 'dotenv/config'; // Must be first to ensure env vars are loaded before other imports
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import bodyParser from 'body-parser';

import itinerariesRoutes from './routes/itineraries.js';
import aiRoutes from './routes/ai.js';
import authRoutes from './routes/auth.js';
import clientsRoutes from './routes/clients.js';
import invoicesRoutes from './routes/invoices.js';
import couponsRoutes from './routes/coupons.js';
import leadsRoutes from './routes/leads.js';
import settingsRoutes from './routes/settings.js';
import suppliersRoutes from './routes/suppliers.js';
import bookingsRoutes from './routes/bookings.js';
import bookingRoutes from './routes/bookings.js';
import invoiceRoutes from './routes/invoices.js';
import quotesRoutes from './routes/quotes.js';
import analyticsRoutes from './routes/analytics.js';
import adminRoutes from './routes/adminRoutes.js';
import integrationsRoutes from './routes/integrationRoutes.js';
import amadeusRoutes from './routes/amadeus.js';
import resortsRoutes from './routes/resorts.js';
import aiCopilotRoutes from './routes/ai_copilot.js';
import reactivRoutes from './routes/reactiv.js';
import socialRoutes from './routes/social.js';
import { startPnrSync } from './cron/pnrSync.js';
import { startPaymentCron } from './cron/paymentReminders.js';

const app = express();

// Initialize Cron Jobs
startPnrSync();
startPaymentCron();

// DEBUG LOGGING
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const debugLogPath = path.join(__dirname, '../debug.log');

app.use((req, res, next) => {
  const msg = `[${new Date().toISOString()}] [REQUEST] ${req.method} ${req.url} Origin: ${req.headers.origin}\n`;
  try {
    fs.appendFileSync(debugLogPath, msg);
  } catch (e) {
    console.error("Failed to write to debug log", e);
  }
  next();
});

// -----------------------------------------------------
// CORS FIX
// -----------------------------------------------------
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      // Allow localhost (Dev)
      if (process.env.NODE_ENV === 'development' && origin.includes('localhost')) return callback(null, true);

      // Allow DigitalOcean domains (Staging/Prod)
      if (origin.includes('.ondigitalocean.app')) return callback(null, true);

      // Allow specific production domains
      if (origin === 'https://partners.triponic.com') return callback(null, true);

      // Allow configured CLIENT_URL
      if (process.env.CLIENT_URL && origin === process.env.CLIENT_URL) return callback(null, true);

      // BLOCK EVERYTHING ELSE
      console.warn(`[CORS Blocked] Origin: ${origin}`);
      return callback(new Error('Not allowed by CORS'), false);
    },
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
    methods: ["GET", "POST", "PATCH", "DELETE", "PUT"],
    exposedHeaders: ["Content-Type"]
  })
);

// -----------------------------------------------------
// Body parsing + Logger
// -----------------------------------------------------
app.use(bodyParser.json({ limit: "2mb" }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan("dev"));

// File logging removed for production (read-only filesystem)

// -----------------------------------------------------
// SECURITY MIDDLEWARE
// -----------------------------------------------------
import { apiLimiter, authLimiter, aiLimiter } from './middleware/rateLimiter.js';
import { authenticate } from './middleware/auth.js';
import publicRoutes from './routes/public.js';

// 1. PUBLIC ROUTES (No Auth Required)
app.use(express.static(path.join(__dirname, '../public'))); // Serve server-side assets
app.use('/api/auth', authRoutes);
app.use('/api/public', apiLimiter, publicRoutes);
app.use('/api/reactiv', apiLimiter, reactivRoutes);
app.use('/api/social', apiLimiter, socialRoutes);
// app.use('/api/resorts', resortsRoutes); // REVERTED
app.use('/api/health', apiLimiter, (req, res) => res.json({ ok: true, timestamp: new Date().toISOString() }));

// Legacy routes without /api prefix for backward compatibility
app.use('/auth', authRoutes);
app.use('/public', apiLimiter, publicRoutes);
app.use('/health', apiLimiter, (req, res) => res.json({ ok: true, timestamp: new Date().toISOString() }));

// 2. GLOBAL AUTHENTICATION BARRIER
// All routes below this line REQUIRE a valid JWT token
app.use((req, res, next) => {
  // Skip auth for public routes (with or without /api prefix)
  const path = req.path;
  if (path.startsWith('/auth') || path.startsWith('/api/auth') ||
    path.startsWith('/public') || path.startsWith('/api/public') ||
    path.startsWith('/health') || path.startsWith('/api/health')) {
    return next();
  }
  authenticate(req, res, next);
});

// 3. PROTECTED ROUTES (Auth Required)
// With /api prefix for local dev
app.use('/api/clients', apiLimiter, clientsRoutes);
app.use('/api/itineraries', apiLimiter, itinerariesRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/leads', apiLimiter, leadsRoutes);
app.use('/api/settings', apiLimiter, settingsRoutes);
app.use('/api/suppliers', apiLimiter, suppliersRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/quotes', apiLimiter, quotesRoutes);
app.use('/api/analytics', apiLimiter, analyticsRoutes);
app.use('/api/admin', apiLimiter, adminRoutes);
app.use('/api/coupons', apiLimiter, couponsRoutes);
app.use('/api/coupons', apiLimiter, couponsRoutes);
app.use('/api/integrations', integrationsRoutes);
app.use('/api/amadeus', apiLimiter, amadeusRoutes);
app.use('/api/resorts', apiLimiter, resortsRoutes);

// AI has its own specific limiter
app.use('/api/ai', aiLimiter, aiRoutes);
app.use('/api/copilot', aiLimiter, aiCopilotRoutes);

// Legacy routes without /api prefix for DigitalOcean (strips /api in production)
app.use('/clients', apiLimiter, clientsRoutes);
app.use('/itineraries', apiLimiter, itinerariesRoutes);
app.use('/invoices', apiLimiter, invoicesRoutes);
app.use('/leads', apiLimiter, leadsRoutes);
app.use('/settings', apiLimiter, settingsRoutes);
app.use('/suppliers', apiLimiter, suppliersRoutes);
app.use('/bookings', apiLimiter, bookingsRoutes);
app.use('/quotes', apiLimiter, quotesRoutes);
app.use('/analytics', apiLimiter, analyticsRoutes);
app.use('/admin', apiLimiter, adminRoutes);
app.use('/coupons', apiLimiter, couponsRoutes);
app.use('/amadeus', apiLimiter, amadeusRoutes);
app.use('/resorts', apiLimiter, resortsRoutes);
app.use('/ai', aiLimiter, aiRoutes);

// -----------------------------------------------------
// DO / FALLBACK HANDLERS remover (Deprecated)
// -----------------------------------------------------
// We are now explicitly defining /api routes above.
// The previous "routes.forEach" loop is removed to enforce strict ordering.

// -----------------------------------------------------
// SERVE STATIC FILES (Production / Fallback)
// -----------------------------------------------------
const clientBuildPath = path.join(__dirname, '../client/dist');
// Only serve static files for non-API routes
// Note: Since DigitalOcean strips /api, check for routes without the prefix
app.use((req, res, next) => {
  // Skip static files for API routes (auth, public, health, clients, etc.)
  if (req.path.startsWith('/auth') || req.path.startsWith('/public') ||
    req.path.startsWith('/health') || req.path.startsWith('/clients') ||
    req.path.startsWith('/itineraries') || req.path.startsWith('/ai') ||
    req.path.startsWith('/invoices') || req.path.startsWith('/leads') ||
    req.path.startsWith('/settings') || req.path.startsWith('/suppliers') ||
    req.path.startsWith('/bookings') || req.path.startsWith('/quotes') ||
    req.path.startsWith('/analytics') || req.path.startsWith('/admin') ||
    req.path.startsWith('/coupons') || req.path.startsWith('/amadeus')) {
    return next();
  }
  express.static(clientBuildPath)(req, res, next);
});

// Catch-all handler for SPA (exclude API routes)
app.use((req, res, next) => {
  // Skip if this is an API route (check without /api prefix since DO strips it)
  if (req.path.startsWith('/auth') || req.path.startsWith('/public') ||
    req.path.startsWith('/health') || req.path.startsWith('/clients') ||
    req.path.startsWith('/itineraries') || req.path.startsWith('/ai') ||
    req.path.startsWith('/invoices') || req.path.startsWith('/leads') ||
    req.path.startsWith('/settings') || req.path.startsWith('/suppliers') ||
    req.path.startsWith('/bookings') || req.path.startsWith('/quotes') ||
    req.path.startsWith('/analytics') || req.path.startsWith('/admin') ||
    req.path.startsWith('/coupons') || req.path.startsWith('/amadeus')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }

  const indexPath = path.join(clientBuildPath, 'index.html');
  if (!fs.existsSync(indexPath)) {
    console.error(`[SPA] index.html not found at ${indexPath}`);
    return res.status(404).send("App is building or maintenance mode. Please try again later.");
  }
  res.sendFile(indexPath);
});

// -----------------------------------------------------
// Global Error Handler
// -----------------------------------------------------
app.use((err, req, res, next) => {
  console.error("❌ Server Error:", err);
  res.status(500).json({
    error: "Internal Server Error",
    details: err.message || err
  });
});

// -----------------------------------------------------
// START SERVER
// -----------------------------------------------------
const PORT = process.env.PORT || 5000;

// Trust proxy - Required for DigitalOcean/Cloudflare reverse proxy
// This allows express-rate-limit to correctly identify users by IP
app.set('trust proxy', 1);

app.listen(PORT, () => {
  console.log(`🚀 Triponic B2B Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`🌐 Frontend allowed: ${process.env.CLIENT_URL}`);
});

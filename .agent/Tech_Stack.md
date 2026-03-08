# Triponic Tech Stack

## 🏗️ Architecture Overview

**Type**: Full-stack monorepo  
**Pattern**: Client-server with multi-tenant SaaS architecture  
**Deployment**: DigitalOcean (production)  
**Database**: Supabase (PostgreSQL + Auth + Storage)

---

## 🎨 Frontend Stack

### **Core Framework**
- **React** 19.2.0 - UI library
- **Vite** 7.2.2 - Build tool & dev server (ultra-fast HMR)
- **TypeScript** 5.9.3 - Type safety
- **React Router DOM** 7.9.6 - Client-side routing

### **State Management**
- **Zustand** 5.0.8 - Lightweight state management
- **React Query** (@tanstack/react-query 5.90.8) - Server state, caching, and data fetching
- **React Context API** - Auth, branding, and chat contexts

### **Styling & UI**
- **TailwindCSS** 4.1.17 - Utility-first CSS framework
- **Framer Motion** 12.23.24 - Animations and transitions
- **Radix UI** - Headless accessible components:
  - `@radix-ui/react-dialog` - Modals
  - `@radix-ui/react-dropdown-menu` - Dropdowns
  - `@radix-ui/react-select` - Custom selects
  - `@radix-ui/react-switch` - Toggle switches
  - `@radix-ui/react-tabs` - Tab navigation
  - `@radix-ui/react-scroll-area` - Custom scrollbars
  - `@radix-ui/react-alert-dialog` - Confirmation dialogs
  - `@radix-ui/react-separator` - Visual separators
  - `@radix-ui/react-slot` - Composition utility
- **Lucide React** 0.553.0 - Icon library (modern, tree-shakeable)
- **Class Variance Authority** 0.7.1 - Component variant management
- **Tailwind Merge** 3.4.0 - Smart class merging
- **clsx** 2.1.1 - Conditional className utility

### **UI Libraries & Components**
- **Sonner** 2.0.7 - Toast notifications (beautiful, accessible)
- **Recharts** 3.4.1 - Charts and data visualization

### **Data & API**
- **Axios** 1.13.2 - HTTP client
- **Supabase JS** 2.81.1 - Database client, auth, and real-time

### **Utilities**
- **date-fns** 4.1.0 - Date manipulation
- **marked** 17.0.1 - Markdown parser (for AI responses)
- **uuid** 13.0.0 - Unique ID generation
- **jsPDF** 3.0.4 - PDF generation (client-side)
- **jsPDF-AutoTable** 5.0.2 - Table support for PDFs
- **html2canvas** 1.4.1 - Screenshot/canvas rendering
- **xlsx** 0.18.5 - Excel file export/import
- **@dnd-kit/core** 6.3.1 - Drag-and-drop functionality

---

## ⚙️ Backend Stack

### **Runtime & Framework**
- **Node.js** ≥18.0.0 - JavaScript runtime
- **Express** 5.1.0 - Web framework
- **ES Modules** (type: "module") - Modern import/export syntax

### **Database & Auth**
- **Supabase** (@supabase/supabase-js 2.81.1)
  - PostgreSQL database
  - Row-level security (RLS)
  - Built-in authentication
  - Real-time subscriptions
  - File storage

### **AI & ML**
- **Google Generative AI** (@google/generative-ai 0.24.1)
  - Gemini Pro integration
  - Natural language itinerary generation
  - Conversational AI (Tono assistant)

### **Authentication & Security**
- **bcryptjs** 3.0.3 - Password hashing
- **jsonwebtoken** 9.0.2 - JWT token generation/validation
- **express-rate-limit** 8.2.1 - API rate limiting (DDoS protection)
- **cors** 2.8.5 - Cross-Origin Resource Sharing

### **File Processing**
- **Multer** 2.0.2 - Multipart form data / file uploads
- **PDFKit** 0.17.2 - Server-side PDF generation

### **Communication**
- **Nodemailer** 7.0.11 - Email sending (transactional emails, password resets)

### **Logging & Monitoring**
- **Morgan** 1.10.1 - HTTP request logger

### **Configuration**
- **dotenv** 16.4.5 - Environment variable management

---

## 🧪 Testing & Development

### **Testing**
- **Jest** 30.2.0 - JavaScript testing framework
- Test files:
  - `aiController.test.js`
  - `itineraryPricing.test.js`

### **Development Tools**
- **Nodemon** 3.1.11 - Auto-restart server on changes
- **ESLint** 9.39.1 - Code linting
- **TypeScript ESLint** 8.46.3 - TypeScript-specific linting
- **Vite HMR** - Hot Module Replacement (instant updates)

---

## 🚀 Deployment & Infrastructure

### **Hosting**
- **DigitalOcean** - Production server
- **Domain**: partners.triponic.com

### **CI/CD**
- **Git** - Version control
- **GitHub** - Code repository
- Auto-deploy on push (DigitalOcean App Platform)

### **Environment Variables** (Required)
```bash
# Server (.env in /server)
PORT=3001
NODE_ENV=production
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
JWT_SECRET=your_jwt_secret
GEMINI_API_KEY=your_gemini_api_key
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email
EMAIL_PASS=your_email_password
FRONTEND_URL=https://partners.triponic.com

# Client (.env in /client)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_URL=https://partners.triponic.com/api
```

---

## 📦 Integrations & External APIs

### **AI & Data**
- **Google Gemini API** - Itinerary generation, natural language processing
- (Potential future: OpenAI GPT-4 for premium tier)

### **Travel Data** (Mentioned on landing page)
- **Google Flights** - Flight search and pricing
- **Expedia API** - Hotel and package data
- **Trip.com API** - International travel options
- **Viator API** - Activities and tours

### **Payments** (Planned)
- **Stripe** - Subscription billing, invoicing

### **Communication** (In Progress)
- **WhatsApp Business API** - Client communication (50% built)
- **Nodemailer + SMTP** - Email notifications

### **Lead Capture**
- **Typeform** - Beta signup forms (external)

---

## 🗄️ Database Schema (Supabase PostgreSQL)

### **Core Tables**
- `users` - User authentication and profiles
- `agencies` - Multi-tenant agency data
- `clients` - Customer/lead information
- `itineraries` - Trip proposals and plans
- `invoices` - Billing and payments
- `quotes` - Price estimates
- `bookings` - Confirmed reservations
- `suppliers` - Vendor/partner directory
- `coupons` - Discount codes
- `leads` - Lead capture widget data
- `analytics` - Usage tracking

### **Security**
- **Row-Level Security (RLS)** - Tenant isolation
- **JWT-based auth** - Secure session management

---

## 🏛️ Project Structure

```
triponic-b2b/
├── client/                 # Frontend React app
│   ├── src/
│   │   ├── api/           # Axios API clients
│   │   ├── components/    # Reusable UI components
│   │   ├── contexts/      # React Context providers
│   │   ├── pages/         # Route pages
│   │   ├── App.jsx        # Main app component
│   │   └── main.jsx       # Entry point
│   ├── package.json
│   └── vite.config.js
│
├── server/                # Backend Node.js API
│   ├── src/
│   │   ├── config/        # Configuration files
│   │   │   ├── env.js
│   │   │   ├── gemini.js
│   │   │   └── supabase.js
│   │   ├── controllers/   # Request handlers
│   │   │   ├── authController.js
│   │   │   ├── aiController.js
│   │   │   ├── itineraryController.js
│   │   │   ├── clientController.js
│   │   │   ├── invoiceController.js
│   │   │   ├── quoteController.js
│   │   │   ├── bookingController.js
│   │   │   ├── supplierController.js
│   │   │   ├── leadController.js
│   │   │   ├── agencyController.js
│   │   │   ├── adminController.js
│   │   │   ├── analyticsController.js
│   │   │   ├── settingsController.js
│   │   │   ├── couponController.js
│   │   │   └── publicController.js
│   │   ├── middleware/    # Express middleware
│   │   │   ├── auth.js           # JWT verification
│   │   │   └── rateLimiter.js    # Rate limiting
│   │   ├── routes/        # API route definitions
│   │   │   ├── auth.js
│   │   │   ├── ai.js
│   │   │   ├── itineraries.js
│   │   │   ├── clients.js
│   │   │   ├── invoices.js
│   │   │   ├── quotes.js
│   │   │   ├── bookings.js
│   │   │   ├── suppliers.js
│   │   │   ├── leads.js
│   │   │   ├── agencies.js
│   │   │   ├── adminRoutes.js
│   │   │   ├── analytics.js
│   │   │   ├── settings.js
│   │   │   ├── coupons.js
│   │   │   └── public.js
│   │   ├── services/      # Business logic
│   │   │   ├── automationEngine.js
│   │   │   ├── emailService.js
│   │   │   ├── pdfService.js
│   │   │   ├── pricingService.js
│   │   │   └── stateMachine.js
│   │   ├── tests/         # Unit tests
│   │   └── index.js       # Server entry point
│   └── package.json
│
├── package.json           # Monorepo scripts
└── README.md
```

---

## 🔐 Security Features

- ✅ **JWT Authentication** - Secure token-based auth
- ✅ **bcrypt Password Hashing** - Industry-standard encryption
- ✅ **Rate Limiting** - Prevent brute-force attacks
- ✅ **CORS Configuration** - Controlled cross-origin requests
- ✅ **Row-Level Security (RLS)** - Database-level tenant isolation
- ✅ **Input Validation** - Sanitized user inputs
- ✅ **HTTPS** - Encrypted data transmission (production)
- ✅ **Environment Variables** - Secrets not in code

---

## 📊 Performance Optimizations

- ⚡ **Vite Build** - Lightning-fast dev server & optimized production builds
- ⚡ **React Query Caching** - Reduces redundant API calls
- ⚡ **Lazy Loading** - Code-splitting for faster initial load
- ⚡ **Supabase Edge Functions** - Serverless compute near users
- ⚡ **CDN-ready** - Static assets can be served via CDN
- ⚡ **Tree-shaking** - Removes unused code from bundles

---

## 🔄 Real-Time Features

- **Supabase Realtime** - WebSocket connections for:
  - Live booking updates
  - Real-time collaboration (multi-user agencies)
  - Notification system

---

## 🛣️ Roadmap Technologies (Planned)

### **Q1 2025**
- [ ] **WhatsApp Business API** - Complete integration (50% done)
- [ ] **Stripe API** - Payment processing & subscription management
- [ ] **Twilio SendGrid** - Scalable email delivery

### **Q2 2025**
- [ ] **Redis** - Caching layer for performance
- [ ] **Elasticsearch** - Advanced itinerary search
- [ ] **AWS S3** - File storage migration (if scaling beyond Supabase)

### **Q3 2025**
- [ ] **Docker** - Containerization for easier deployment
- [ ] **Kubernetes** - Orchestration (if horizontal scaling needed)
- [ ] **Datadog/Sentry** - Advanced monitoring & error tracking

---

## 💰 Cost Breakdown (Monthly)

| Service | Tier | Cost |
|---------|------|------|
| **Supabase** | Pro | $25/month |
| **DigitalOcean** | Basic Droplet | $12-$24/month |
| **Gemini API** | Pay-as-you-go | ~$50-$150/month (scales with usage) |
| **Domain** | - | $12/year (~$1/month) |
| **Email (SMTP)** | Free (Gmail) or SendGrid | $0-$15/month |
| **Total** | - | **~$90-$215/month** |

**At 100 agencies ($20K MRR)**: Infrastructure = ~1% of revenue ✅

---

## 🎯 Why This Stack?

### **Frontend: React + Vite + TailwindCSS**
- ✅ **Fast iteration** - Vite HMR is instant
- ✅ **Huge ecosystem** - Easy to find devs and libraries
- ✅ **Modern UX** - Framer Motion + Radix UI = polished feel

### **Backend: Node.js + Express**
- ✅ **Shared language** - JavaScript everywhere (easier for small teams)
- ✅ **Proven** - Fortune 500 companies run on Node.js
- ✅ **Fast prototyping** - NPM has a package for everything

### **Database: Supabase (PostgreSQL)**
- ✅ **Instant APIs** - Auto-generated REST & GraphQL endpoints
- ✅ **Built-in auth** - No need to build JWT logic from scratch
- ✅ **Real-time** - WebSockets out of the box
- ✅ **Cheap** - $25/month vs. $50-$200 for AWS RDS

### **AI: Google Gemini**
- ✅ **Cost-effective** - Cheaper than GPT-4 for long-context tasks
- ✅ **Fast** - Sub-second response times
- ✅ **Multimodal** - Can handle text + images (future: analyze travel photos)

---

## 🚀 Deployment Commands

### **Local Development**
```bash
# Install dependencies
npm install

# Run client (dev mode)
npm run dev:client

# Run server (dev mode)
npm run dev:server

# Run both simultaneously (use 2 terminals)
```

### **Production Build**
```bash
# Build client
npm run build:client

# Start production server
npm run start
```

### **Testing**
```bash
# Run tests
cd server && npm test
```

---

## 📚 Documentation & Resources

- **React**: https://react.dev
- **Vite**: https://vitejs.dev
- **TailwindCSS**: https://tailwindcss.com
- **Supabase**: https://supabase.com/docs
- **Gemini API**: https://ai.google.dev/docs
- **Radix UI**: https://www.radix-ui.com
- **Framer Motion**: https://www.framer.com/motion

---

## 🏆 Tech Stack Highlights for YC Application

**What makes this stack impressive**:

1. ✅ **Production-ready in 8 weeks** - Shows execution speed
2. ✅ **Modern, scalable architecture** - Can handle 10K+ agencies
3. ✅ **Low infrastructure cost** - <1% of revenue at scale
4. ✅ **AI-native** - Built around Gemini from day one
5. ✅ **Type-safe** - TypeScript reduces bugs
6. ✅ **Secure** - Rate limiting, RLS, JWT, bcrypt
7. ✅ **Multi-tenant** - Every agency has isolated data
8. ✅ **Real-time capable** - Supabase enables live features

**For your YC application video**: Show off the tech stack as proof of technical depth, not just an MVP.

---

**Last Updated**: December 29, 2024

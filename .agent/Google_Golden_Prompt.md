# Golden Prompt for Google AI Studio
## "Idea to Prototype" Submission - Triponic

---

# 🚀 THE GOLDEN PROMPT

```
You are an expert full-stack software architect and senior engineer with 15+ years of experience building production-grade SaaS applications. I need you to build a complete AI-powered B2B SaaS platform called "Triponic" - an operating system for small travel agencies that transforms client conversations into bookable trip proposals in 60 seconds.

## 🎯 BUSINESS CONTEXT

### The Problem
Small travel agencies (1-10 employees) are dying because they can't compete with online travel giants like Expedia. The core issue:
- Manual itinerary creation takes 15+ hours per proposal
- Clients expect responses within 24 hours
- Enterprise booking software costs $50,000/year (unaffordable)
- Agencies are stuck with Google Docs, Excel, and WhatsApp

### The Solution
An AI-native operating system that gives small agencies "enterprise superpowers":
- Generate professional itineraries in 60 seconds using AI
- Complete CRM to manage clients and preferences
- Automated invoicing and payment tracking
- White-label branding (clients never see "Triponic")
- Multi-tenant architecture (each agency has isolated data)

### Target Users
- Small independent travel agencies in the US
- 1-10 employees, often family-run businesses
- Women aged 35-60, tech-literate but not technical
- Specialize in international leisure travel (Europe, Asia, South America)

### Business Model
- SaaS subscription: $150-$600/month per agency
- Multi-tenant platform (Stripe/Shopify model)
- Target: 50,000 agencies in US alone
- TAM: $1.2B+ annual revenue potential

---

## 🏗️ TECHNICAL REQUIREMENTS

### Architecture
- **Type**: Full-stack monorepo application
- **Pattern**: Client-server with REST API
- **Database**: Supabase (PostgreSQL with built-in auth and real-time)
- **Deployment**: Single production server (DigitalOcean) serving both API and static frontend
- **Security**: Multi-tenant with row-level security, JWT authentication

### Tech Stack (MUST USE EXACTLY THIS)

**Frontend:**
- React 19.2.0 with Vite 7.2.2 (ultra-fast dev server)
- React Router DOM 7.9.6 for routing
- TailwindCSS 4.1.17 for styling
- Radix UI for accessible headless components (dialogs, dropdowns, selects, switches, tabs)
- Framer Motion 12.23.24 for animations
- React Query (@tanstack/react-query) for server state management
- Zustand for client state
- Axios for HTTP requests
- Lucide React for icons
- Sonner for toast notifications
- Recharts for analytics charts
- jsPDF + jsPDF-AutoTable for client-side PDF generation
- date-fns for date handling
- marked for markdown rendering (AI responses)

**Backend:**
- Node.js 18+ with Express 5.1.0
- ES Modules (type: "module")
- Supabase client (@supabase/supabase-js)
- Google Generative AI (@google/generative-ai) for Gemini integration
- bcryptjs for password hashing
- jsonwebtoken for JWT tokens
- express-rate-limit for API rate limiting
- cors for cross-origin requests
- Multer for file uploads
- PDFKit for server-side PDF generation
- Nodemailer for emails
- Morgan for logging
- dotenv for environment variables

**Database (Supabase PostgreSQL):**
- Users table (auth + profiles)
- Agencies table (multi-tenant isolation)
- Clients table (customer data)
- Itineraries table (trip proposals)
- Invoices table
- Quotes table
- Bookings table
- Suppliers table (vendor directory)
- Coupons table
- Leads table (from embedded widget)
- Analytics events table

**External Integrations:**
- Google Gemini API (primary AI engine)
- Supabase (database, auth, storage, real-time)
- Nodemailer + SMTP for emails
- (Future: WhatsApp Business API, Stripe)

---

## 🎨 APPLICATION STRUCTURE

### Monorepo Layout
```
triponic-b2b/
├── client/                 # React frontend
│   ├── src/
│   │   ├── api/           # Axios API clients
│   │   ├── components/    # Reusable components
│   │   │   ├── admin/     # Admin-specific components
│   │   │   ├── dashboard/ # Dashboard components
│   │   │   ├── landing/   # Landing page sections
│   │   │   ├── Layout.jsx # Main app layout with sidebar
│   │   │   └── ...
│   │   ├── contexts/
│   │   │   ├── AuthContext.jsx    # User auth state
│   │   │   ├── BrandingContext.jsx # Agency white-label
│   │   │   └── ChatContext.jsx     # AI chat state
│   │   ├── pages/
│   │   │   ├── Landing.jsx         # Public marketing page
│   │   │   ├── About.jsx           # About page
│   │   │   ├── Pricing.jsx         # Pricing page
│   │   │   ├── Login.jsx
│   │   │   ├── ForgotPassword.jsx
│   │   │   ├── ResetPassword.jsx
│   │   │   ├── Dashboard.jsx       # Agency dashboard
│   │   │   ├── Clients.jsx         # CRM client list
│   │   │   ├── ClientDetails.jsx   # Individual client
│   │   │   ├── Itineraries.jsx     # Itinerary library
│   │   │   ├── ItineraryDetails.jsx # Single itinerary
│   │   │   ├── Bookings.jsx
│   │   │   ├── Suppliers.jsx
│   │   │   ├── Quotes.jsx
│   │   │   ├── Finance.jsx         # Invoice management
│   │   │   ├── Settings.jsx        # Agency settings
│   │   │   ├── CRM.jsx             # Lead management
│   │   │   ├── PublicItineraryView.jsx # Share link view
│   │   │   ├── LeadCaptureWidget.jsx   # Embeddable widget
│   │   │   └── admin/              # Super admin pages
│   │   │       ├── Dashboard.jsx
│   │   │       ├── AgenciesList.jsx
│   │   │       ├── AgencyDetails.jsx
│   │   │       ├── Activity.jsx
│   │   │       ├── AdminLeads.jsx
│   │   │       └── AdminSettings.jsx
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
├── server/                # Express backend
│   ├── src/
│   │   ├── config/
│   │   │   ├── env.js         # Environment validation
│   │   │   ├── gemini.js      # Gemini AI setup
│   │   │   └── supabase.js    # Supabase client
│   │   ├── controllers/
│   │   │   ├── authController.js      # Login, signup, password reset
│   │   │   ├── aiController.js        # Gemini AI chat & itinerary generation
│   │   │   ├── itineraryController.js # CRUD for itineraries
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
│   │   ├── middleware/
│   │   │   ├── auth.js            # JWT verification
│   │   │   └── rateLimiter.js     # Rate limiting
│   │   ├── routes/
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
│   │   ├── services/
│   │   │   ├── automationEngine.js  # Workflow automation
│   │   │   ├── emailService.js      # Nodemailer wrapper
│   │   │   ├── pdfService.js        # PDF generation
│   │   │   ├── pricingService.js    # Price calculations
│   │   │   └── stateMachine.js      # Booking state flow
│   │   ├── tests/
│   │   │   ├── aiController.test.js
│   │   │   └── itineraryPricing.test.js
│   │   └── index.js               # Express server entry
│   └── package.json
│
└── package.json           # Monorepo root scripts
```

---

## 🎯 CORE FEATURES TO IMPLEMENT

### 1. AUTHENTICATION & MULTI-TENANCY

**Requirements:**
- User registration with email/password
- Secure login with JWT tokens (httpOnly cookies or localStorage)
- Password reset via email
- Role-based access: 'user' (travel agent), 'super_admin' (platform admin)
- Multi-tenant architecture: Each agency has isolated data (use Supabase RLS)
- Separate admin portal for super admins to manage all agencies

**Implementation Details:**
- Use bcryptjs to hash passwords (salt rounds: 10)
- JWT tokens valid for 7 days
- Store user profile with: name, email, role, agency_id
- Middleware to verify JWT on protected routes
- Protect routes based on role (e.g., /admin/* only for super_admin)

### 2. AI-POWERED ITINERARY GENERATION (CORE FEATURE)

**User Flow:**
1. Agent opens "New Itinerary" dialog or chats with "Tono AI"
2. Agent types natural language: "Create a 10-day Italy honeymoon for $8,000"
3. Tono AI asks clarifying questions:
   - "Which cities would they prefer?"
   - "Any specific interests? (food, art, adventure)"
   - "Travel dates or season?"
4. Agent provides answers
5. AI generates complete day-by-day itinerary with:
   - Suggested flights (with pricing estimates)
   - Hotel recommendations (3-4 star, budget-appropriate)
   - Daily activities (restaurants, tours, landmarks)
   - Transportation between cities
   - Total estimated cost breakdown

**Technical Implementation:**
- Use Google Gemini API (gemini-pro model)
- Conversational context maintained across messages
- AI prompt engineering:
  - System role: "You are Tono, an expert travel planner with 20 years of experience..."
  - Provide structured output format (JSON or markdown)
  - Include budget adherence rules
  - Suggest realistic pricing based on destination
- Store itinerary as structured data (JSON in database)
- Generate professional PDF proposal (white-labeled with agency branding)

**AI Prompt Template (for Gemini):**
```
You are Tono, a professional travel advisor with 20+ years of experience creating custom itineraries.

CLIENT REQUEST:
- Destination: {destination}
- Duration: {num_days} days
- Budget: ${budget}
- Travelers: {num_travelers} ({traveler_types})
- Interests: {interests}
- Special requests: {special_requests}

YOUR TASK:
Generate a detailed day-by-day itinerary that:
1. Stays within budget (allocate: 40% accommodation, 30% activities, 20% food, 10% transport)
2. Includes realistic hotel recommendations (3-4 star range)
3. Suggests 2-3 activities per day (mix of paid attractions and free experiences)
4. Recommends 1-2 restaurants per day (mix of mid-range and splurge meals)
5. Includes inter-city transportation if multi-city trip
6. Provides estimated costs for each item
7. Feels personal and exciting (not generic)

OUTPUT FORMAT (JSON):
{
  "trip_title": "10-Day Romantic Italy Honeymoon",
  "total_estimated_cost": 7850,
  "days": [
    {
      "day": 1,
      "location": "Rome",
      "accommodation": {
        "name": "Hotel Artemide",
        "description": "4-star boutique hotel near Termini Station",
        "cost_per_night": 180
      },
      "activities": [
        {
          "time": "Morning",
          "activity": "Colosseum & Roman Forum Tour",
          "description": "Skip-the-line guided tour...",
          "cost": 55,
          "duration": "3 hours"
        },
        ...
      ],
      "meals": [
        {
          "meal_type": "Lunch",
          "restaurant": "Trattoria da Enzo",
          "description": "Authentic Roman carbonara...",
          "est_cost": 40
        },
        ...
      ]
    },
    ...
  ],
  "flight_suggestions": {
    "outbound": "...",
    "return": "...",
    "estimated_cost": 1200
  },
  "notes": "Best time to visit: April-May or September-October for pleasant weather..."
}
```

### 3. CRM - CLIENT MANAGEMENT

**Features:**
- List all clients (searchable, filterable)
- Add new client with:
  - Name, email, phone
  - Preferences (destinations, budget range, travel style)
  - Tags (VIP, repeat customer, etc.)
  - Notes
- Client detail view showing:
  - All past itineraries
  - Booking history
  - Communication log
  - Lifetime value
- Track client lifecycle: Lead → Prospect → Active → Repeat Customer

**UI Components:**
- Data table with sorting, filtering, search
- "Add Client" dialog form
- Client detail page with tabs (Overview, Itineraries, Bookings, Notes)

### 4. ITINERARY LIBRARY & MANAGEMENT

**Features:**
- View all itineraries (grid or list view)
- Filter by: client, destination, status (draft, sent, booked)
- Search by destination or client name
- Duplicate existing itinerary (to reuse for similar requests)
- Edit itinerary:
  - Modify day-by-day plan
  - Adjust pricing
  - Add/remove activities
- Generate PDF proposal (white-labeled)
- Share link (public view without login)
- Track engagement: Has client opened the link?

**Itinerary Statuses:**
- Draft: Created but not sent
- Sent: PDF sent to client
- Under Review: Client viewing
- Booked: Client confirmed
- Archived: Old/rejected

### 5. INVOICE & PAYMENT TRACKING

**Features:**
- Create invoice linked to itinerary/booking
- Itemized billing:
  - Flights: $X
  - Hotels: $Y
  - Activities: $Z
  - Agency service fee: $W
  - Total: $TOTAL
- Payment status: Unpaid, Partial, Paid
- Payment method tracking (credit card, wire transfer, etc.)
- Send invoice via email
- Mark as paid with payment date

**Future Integration:** Stripe for online payments

### 6. BOOKING MANAGEMENT

**Features:**
- Track bookings linked to itineraries
- Booking details:
  - Confirmation numbers
  - Supplier/vendor
  - Booking date & travel date
  - Status (pending, confirmed, cancelled)
- Filter by status, date range
- Export bookings to Excel

### 7. SUPPLIER/VENDOR DIRECTORY

**Features:**
- List of trusted suppliers (hotels, tour operators, drivers, restaurants)
- Supplier details: Name, location, contact, category, notes
- Link suppliers to bookings
- Future: Two-sided marketplace (suppliers can be booked via platform)

### 8. ANALYTICS DASHBOARD

**Metrics to Display:**
- Total active clients
- Itineraries created this month
- Conversion rate (itineraries → bookings)
- Revenue this month
- Average booking value
- Hours saved (# of itineraries × 15 hours)
- Charts:
  - Revenue over time (line chart)
  - Itineraries by destination (bar chart)
  - Booking status breakdown (pie chart)

**Tech:** Use Recharts for visualization

### 9. AGENCY SETTINGS & WHITE-LABEL BRANDING

**Settings:**
- Agency profile:
  - Agency name
  - Logo upload
  - Primary color (for PDFs and emails)
  - Website URL
  - Contact information
- User management (for multi-user agencies):
  - Add/remove team members
  - Set permissions
- Email templates customization
- PDF footer customization

**White-Label Implementation:**
- Store branding in `agencies` table
- Use BrandingContext in React to apply agency colors/logo
- Generate PDFs with agency branding (no "Triponic" watermark)

### 10. PUBLIC FEATURES

**Landing Page (Marketing Site):**
- Hero section with value proposition:
  - "Small Agencies Need Enterprise Speed"
  - "AI-powered itineraries in 60 seconds"
- Social proof: "4 pilot partners • 46 spots left"
- Feature showcase with screenshots
- Pricing tiers
- Call-to-action: "Request Beta Access" (links to Typeform)
- Mobile-responsive design
- Modern aesthetics: Dark theme, gradients, animations

**Pricing Page:**
- 3 tiers: Starter ($150/mo), Professional ($300/mo), Agency ($600/mo)
- Feature comparison table
- FAQ section

**About Page:**
- Company story
- Team (if applicable)
- Mission and vision

**Public Itinerary View:**
- Shareable link: /view/:itinerary_id
- Beautiful read-only view of itinerary
- No login required
- Agency branding applied
- "Book with [Agency Name]" CTA

**Lead Capture Widget:**
- Embeddable iframe: /widget/:agency_id
- Simple form: Name, email, message
- Saves lead to database
- Sends email notification to agency

### 11. ADMIN PORTAL (Super Admin Only)

**Features:**
- Dashboard with platform-wide metrics:
  - Total agencies
  - Total users
  - Total itineraries generated
  - Revenue (if commission-based)
- Agencies list:
  - View all agencies
  - See usage stats per agency
  - Deactivate/activate agencies
- Agency detail view:
  - All users in agency
  - All itineraries created
  - Usage over time
- Activity log:
  - Track all major actions (signups, itineraries created, bookings)
- Leads management:
  - All leads from landing page + widgets
- Platform settings

---

## 🎨 UI/UX DESIGN REQUIREMENTS

### Design System
- **Color Palette:**
  - Primary: Amber/Orange (#F59E0B, #F97316) - warmth, travel, adventure
  - Secondary: Blue/Purple (#3B82F6, #8B5CF6) - trust, technology
  - Dark mode base: Slate 950 (#020617)
  - Accents: Emerald for success, Red for errors
- **Typography:**
  - Use system fonts or Google Fonts (Inter, Outfit)
  - Clear hierarchy: H1 (48-64px), H2 (36-48px), body (16-18px)
- **Components:**
  - Modern card-based layouts
  - Subtle shadows and depth
  - Smooth animations (Framer Motion)
  - Consistent spacing (Tailwind spacing scale)
  - Accessible (WCAG AA compliance)

### Key UI Patterns
- **Sidebar Navigation:** Fixed sidebar with logo, nav links, user profile at bottom
- **Data Tables:** Sortable columns, search, filters, pagination
- **Forms:** Clean labels, validation states, helpful error messages
- **Modals/Dialogs:** Radix UI Dialog for overlays
- **Toast Notifications:** Sonner for success/error feedback
- **Loading States:** Skeleton loaders, spinners
- **Empty States:** Friendly illustrations and CTAs

### Mobile Responsiveness
- Mobile-first approach
- Hamburger menu for navigation on mobile
- Touch-friendly buttons (min 44px)
- Responsive grids (Tailwind responsive utilities)

### Animations
- Page transitions (Framer Motion)
- Hover effects on buttons/cards
- Loading spinners
- Success checkmarks
- Smooth modal open/close

---

## 🔐 SECURITY REQUIREMENTS

### Authentication & Authorization
- ✅ JWT tokens with expiration (7 days)
- ✅ HttpOnly cookies OR localStorage (choose based on deployment)
- ✅ Password hashing with bcrypt (salt rounds: 10)
- ✅ Password strength validation (min 8 chars, 1 uppercase, 1 number)
- ✅ Rate limiting on login endpoint (max 5 attempts per 15 minutes)
- ✅ Email verification (optional, but recommended)
- ✅ CORS configuration (allow only production domain)

### Multi-Tenant Data Isolation
- ✅ Row-Level Security (RLS) in Supabase:
  - Users can only see data where `agency_id` matches their profile
  - Super admins can see all data
- ✅ Validate `agency_id` on every database query
- ✅ Never trust client-side agency_id - always get from authenticated user

### API Security
- ✅ Rate limiting (express-rate-limit):
  - Auth endpoints: 5 requests/15min per IP
  - AI endpoints: 20 requests/hour per user
  - General endpoints: 100 requests/15min per IP
- ✅ Input validation and sanitization
- ✅ SQL injection protection (use parameterized queries via Supabase)
- ✅ XSS protection (React auto-escapes, but be careful with dangerouslySetInnerHTML)

### Environment Variables (NEVER COMMIT)
```
# Server
PORT=3001
NODE_ENV=production
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJxxx
SUPABASE_SERVICE_ROLE_KEY=eyJxxx
JWT_SECRET=random_secret_key_here
GEMINI_API_KEY=AIzaXXX
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=noreply@triponic.com
EMAIL_PASS=app_password
FRONTEND_URL=https://partners.triponic.com

# Client
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxx
VITE_API_URL=https://partners.triponic.com/api
```

---

## 📊 DATABASE SCHEMA (Supabase PostgreSQL)

### Tables & Columns

**users** (extends Supabase auth.users)
```sql
- id (uuid, primary key)
- email (text, unique)
- password_hash (text) -- if using custom auth
- role (text: 'user' or 'super_admin')
- agency_id (uuid, foreign key to agencies)
- created_at (timestamp)
- updated_at (timestamp)
```

**agencies**
```sql
- id (uuid, primary key)
- name (text)
- logo_url (text)
- primary_color (text, e.g., '#F59E0B')
- website (text)
- contact_email (text)
- contact_phone (text)
- address (text)
- created_at (timestamp)
- subscription_tier (text: 'starter', 'professional', 'agency')
- is_active (boolean, default true)
```

**clients**
```sql
- id (uuid, primary key)
- agency_id (uuid, foreign key)
- name (text)
- email (text)
- phone (text)
- preferences (jsonb) -- {budget_range, preferred_destinations, travel_style, etc.}
- tags (text[])
- notes (text)
- lifecycle_stage (text: 'lead', 'prospect', 'active', 'repeat')
- created_at (timestamp)
- updated_at (timestamp)
```

**itineraries**
```sql
- id (uuid, primary key)
- agency_id (uuid, foreign key)
- client_id (uuid, foreign key)
- title (text)
- destination (text)
- num_days (integer)
- num_travelers (integer)
- budget (numeric)
- itinerary_data (jsonb) -- Full day-by-day plan from AI
- status (text: 'draft', 'sent', 'under_review', 'booked', 'archived')
- share_token (text, unique) -- For public sharing
- created_at (timestamp)
- updated_at (timestamp)
- sent_at (timestamp)
- viewed_at (timestamp)
```

**invoices**
```sql
- id (uuid, primary key)
- agency_id (uuid, foreign key)
- client_id (uuid, foreign key)
- itinerary_id (uuid, foreign key, nullable)
- invoice_number (text, unique)
- line_items (jsonb) -- [{description, amount}, ...]
- subtotal (numeric)
- tax (numeric)
- total (numeric)
- status (text: 'unpaid', 'partial', 'paid')
- payment_method (text)
- paid_at (timestamp)
- created_at (timestamp)
```

**quotes**
```sql
- id (uuid, primary key)
- agency_id (uuid, foreign key)
- client_id (uuid, foreign key)
- description (text)
- amount (numeric)
- valid_until (date)
- status (text: 'pending', 'accepted', 'rejected')
- created_at (timestamp)
```

**bookings**
```sql
- id (uuid, primary key)
- agency_id (uuid, foreign key)
- itinerary_id (uuid, foreign key)
- client_id (uuid, foreign key)
- booking_type (text: 'flight', 'hotel', 'activity', 'other')
- supplier_id (uuid, foreign key to suppliers, nullable)
- confirmation_number (text)
- booking_date (date)
- travel_date (date)
- status (text: 'pending', 'confirmed', 'cancelled')
- cost (numeric)
- notes (text)
- created_at (timestamp)
```

**suppliers**
```sql
- id (uuid, primary key)
- agency_id (uuid, foreign key)
- name (text)
- category (text: 'hotel', 'tour_operator', 'driver', 'restaurant', 'other')
- location (text)
- contact_name (text)
- contact_email (text)
- contact_phone (text)
- notes (text)
- created_at (timestamp)
```

**coupons**
```sql
- id (uuid, primary key)
- agency_id (uuid, foreign key)
- code (text, unique)
- discount_type (text: 'percentage', 'fixed')
- discount_value (numeric)
- valid_from (date)
- valid_until (date)
- max_uses (integer)
- times_used (integer, default 0)
- is_active (boolean)
- created_at (timestamp)
```

**leads**
```sql
- id (uuid, primary key)
- agency_id (uuid, foreign key, nullable) -- Null if from landing page
- source (text: 'landing_page', 'widget')
- name (text)
- email (text)
- message (text)
- metadata (jsonb) -- Any extra data
- status (text: 'new', 'contacted', 'converted', 'lost')
- created_at (timestamp)
```

**analytics_events**
```sql
- id (uuid, primary key)
- agency_id (uuid, foreign key, nullable)
- event_type (text: 'itinerary_created', 'booking_confirmed', 'login', etc.)
- event_data (jsonb)
- created_at (timestamp)
```

### Row-Level Security (RLS) Policies

**Example for itineraries table:**
```sql
-- Users can only see itineraries from their agency
CREATE POLICY "Users can view their agency's itineraries"
ON itineraries FOR SELECT
USING (agency_id = (SELECT agency_id FROM auth.users WHERE id = auth.uid()));

-- Super admins can see all
CREATE POLICY "Super admins can view all itineraries"
ON itineraries FOR SELECT
USING ((SELECT role FROM auth.users WHERE id = auth.uid()) = 'super_admin');
```

Apply similar policies to all tables.

---

## 🚀 IMPLEMENTATION STEPS

### Phase 1: Foundation (Week 1)
1. Set up monorepo structure
2. Initialize React + Vite frontend
3. Initialize Express backend
4. Set up Supabase project and database schema
5. Implement authentication (signup, login, JWT)
6. Create basic Layout component with sidebar
7. Implement protected routes

### Phase 2: Core AI Feature (Week 2)
1. Integrate Google Gemini API
2. Build AI chat interface ("Tono AI")
3. Implement itinerary generation logic
4. Store itinerary data in database
5. Create Itineraries list page
6. Create Itinerary detail page
7. Implement PDF generation (basic version)

### Phase 3: CRM & Data Management (Week 3)
1. Build Clients list page
2. Implement Add/Edit Client forms
3. Create Client detail page
4. Build Suppliers directory
5. Implement search and filtering
6. Create Bookings management page
7. Build Invoice creation and tracking

### Phase 4: White-Label & Settings (Week 4)
1. Implement Settings page
2. Build branding customization (logo, colors)
3. Apply branding to PDFs
4. Create BrandingContext for dynamic theming
5. Implement multi-user support (if time permits)

### Phase 5: Analytics & Admin (Week 5)
1. Build Analytics Dashboard
2. Implement charts with Recharts
3. Create Super Admin portal
4. Build Agencies management
5. Implement activity logging

### Phase 6: Public Pages & Polish (Week 6)
1. Design and build Landing page
2. Create Pricing page
3. Build About page
4. Implement Public Itinerary View
5. Create Lead Capture Widget
6. Implement email notifications
7. Add loading states, error handling
8. Mobile responsiveness testing

### Phase 7: Testing & Deployment (Week 7-8)
1. Write unit tests (Jest)
2. Manual testing of all flows
3. Security audit (check RLS, auth, rate limiting)
4. Set up production environment (DigitalOcean)
5. Configure environment variables
6. Deploy backend + frontend
7. Set up domain (partners.triponic.com)
8. SSL certificate
9. Final QA and bug fixes

---

## 🎯 SUCCESS CRITERIA

Your implementation should achieve the following:

### Functional Requirements ✅
- [ ] Users can sign up, log in, and reset passwords
- [ ] Agencies have isolated data (multi-tenancy works)
- [ ] AI generates realistic itineraries in under 60 seconds
- [ ] Itineraries can be edited, saved, and shared via public link
- [ ] PDFs are generated with agency branding
- [ ] CRM allows tracking clients and their preferences
- [ ] Invoices can be created and tracked
- [ ] Analytics dashboard shows key metrics
- [ ] Super admins can manage all agencies
- [ ] Landing page is professional and mobile-responsive
- [ ] Public itinerary view works without login

### Non-Functional Requirements ✅
- [ ] Load time: Homepage loads in <2 seconds
- [ ] Security: All API endpoints are protected (rate limited, auth required)
- [ ] Multi-tenant: No data leakage between agencies
- [ ] Responsive: Works on mobile, tablet, desktop
- [ ] Accessible: Keyboard navigation works, ARIA labels present
- [ ] Error handling: Graceful error messages (no crashes)
- [ ] Code quality: Clean, commented, organized by feature

### Performance Benchmarks ✅
- [ ] AI itinerary generation: <10 seconds for 10-day trip
- [ ] Database queries: <500ms for paginated lists
- [ ] PDF generation: <3 seconds for 10-day itinerary
- [ ] Page transitions: <300ms

---

## 📝 CODING BEST PRACTICES

1. **Component Structure:**
   - Keep components small and focused (max 200 lines)
   - Use functional components with hooks
   - Extract reusable logic into custom hooks
   - Use PropTypes or TypeScript for type safety

2. **State Management:**
   - Use React Query for server state (caching, refetching)
   - Use Zustand for global client state (UI state, modals)
   - Keep state as local as possible

3. **API Design:**
   - RESTful endpoints with clear naming
   - Consistent response format: `{ success: true, data: {...} }`
   - Error format: `{ success: false, error: "Message" }`
   - Use HTTP status codes correctly (200, 201, 400, 401, 403, 500)

4. **Code Organization:**
   - Group by feature, not by type
   - Use index.js for barrel exports
   - Keep business logic in controllers/services (not routes)

5. **Security:**
   - Never trust client input - validate everything
   - Always verify JWT on protected routes
   - Use RLS in database as backup defense
   - Log security events (failed logins, etc.)

6. **Error Handling:**
   - Use try-catch blocks in async functions
   - Return user-friendly error messages
   - Log detailed errors server-side
   - Show toast notifications for user actions

7. **Testing:**
   - Write tests for critical paths (auth, itinerary generation)
   - Mock external APIs (Gemini, email)
   - Test multi-tenant isolation

---

## 🎬 FINAL NOTES

This is a production-grade B2B SaaS application with real business value. Focus on:

1. **Speed**: Ship a working MVP fast (8 weeks max)
2. **AI Quality**: Gemini itineraries must feel personal and accurate
3. **Security**: Multi-tenancy MUST be bulletproof
4. **UX**: Beautiful, intuitive interface that wows users
5. **Scalability**: Code should handle 10,000+ agencies

**Start with Phase 1 and implement incrementally. Test each feature before moving to the next.**

Good luck building Triponic! 🚀

---

## ✨ SPECIAL INSTRUCTIONS FOR AI CODE GENERATION

When generating code:
- Use modern ES6+ syntax (async/await, arrow functions, destructuring)
- Add inline comments explaining complex logic
- Use meaningful variable names (no single-letter variables except loop iterators)
- Follow airbnb JavaScript style guide
- Ensure all generated code is production-ready (no TODOs or placeholders)
- Include error handling in every API call
- Make UI components fully accessible (ARIA labels, keyboard navigation)
- Generate complete files (not snippets) when possible
- If a feature is too complex, break it into smaller sub-tasks and tackle sequentially

**Remember**: This app is AI-native. The itinerary generation feature is the CORE DIFFERENTIATOR. Make it exceptional.
```

---

# 📄 How to Use This Prompt

## For Google AI Studio Submission:

1. **Copy the entire prompt** (the section between the triple backticks)
2. **Paste into Google AI Studio** (https://aistudio.google.com)
3. **Select Gemini 1.5 Pro** (or Gemini 2.0 when available)
4. **Submit and let it generate code**

## Expected Output:

Gemini will generate:
- Complete file structure
- Production-ready React components
- Express.js backend with all routes/controllers
- Supabase schema SQL
- Configuration files
- README with setup instructions

## Why This Is a "Golden Prompt":

✅ **Comprehensive**: Covers every aspect of the application  
✅ **Specific**: Exact tech stack, file structure, features  
✅ **Production-Ready**: Includes security, testing, deployment  
✅ **Business-Focused**: Explains the "why" behind each feature  
✅ **AI-Optimized**: Structured for large language models  
✅ **Demonstrates Google AI Use**: Shows how Gemini can build real products  

## For Your Google Submission:

### Include This Statement:

> **"This application was architected and scaffolded using Google Gemini AI. The prompt engineering approach demonstrates how Gemini 1.5 Pro can transform a detailed business requirement into a production-grade full-stack SaaS application. The result is Triponic - a real B2B platform currently serving 4 paying travel agencies in beta."**

---

**File saved to**: `e:\B2B 44\triponic-b2b\.agent\Google_Golden_Prompt.md`

Good luck with your Google Idea to Prototype submission! 🚀🎯

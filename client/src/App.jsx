import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { BrandingProvider } from '@/contexts/BrandingContext';
import { ChatProvider } from '@/contexts/ChatContext';
import { AmadeusProvider } from '@/contexts/AmadeusContext';
import { Toaster } from 'sonner';
import TestConnection from './pages/TestConnection';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import Itineraries from './pages/Itineraries';
import ItineraryDetails from './pages/ItineraryDetails';
import Quotes from './pages/Quotes';
import Finance from './pages/Finance';
import Settings from './pages/Settings';
import CRM from './pages/CRM';
import Layout from './components/Layout';
import ClientDetails from './pages/ClientDetails';
import Bookings from './pages/Bookings';
import Resorts from './pages/Resorts';
import ResortDetails from './pages/ResortDetails';
import Suppliers from './pages/Suppliers';
import Landing from './pages/Landing';
import Pricing from './pages/Pricing';
import PublicItineraryView from './pages/PublicItineraryView';
import LeadCaptureWidget from './pages/LeadCaptureWidget';
import About from './pages/About';
import LogoPage from './pages/LogoPage';
import PartnersLanding from './pages/PartnersLanding';
import ScrollToTop from './components/ScrollToTop';
import GrowthTab from './pages/GrowthTab';

// Admin Imports
import AdminRoute from './components/admin/AdminRoute';
import AdminLayout from './components/admin/AdminLayout';
import AdminDashboard from './pages/admin/Dashboard';
import AgenciesList from './pages/admin/AgenciesList';
import AgencyDetails from './pages/admin/AgencyDetails';
import Activity from './pages/admin/Activity';
import AdminLeads from './pages/admin/AdminLeads';
import AdminSettings from './pages/admin/AdminSettings';
import AdminClientDetails from './pages/admin/ClientDetails';
import AdminLeadDetails from './pages/admin/LeadDetails';
import MassEmail from './pages/admin/MassEmail';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return children;
}

function AppRoutes() {
  const { user, profile } = useAuth(); // profile contains the role

  const getHomeRoute = () => {
    if (profile?.role === 'super_admin') return '/admin/dashboard';
    return '/dashboard';
  };

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to={getHomeRoute()} /> : <Login />}
      />
      <Route
        path="/forgot-password"
        element={user ? <Navigate to="/dashboard" /> : <ForgotPassword />}
      />
      <Route
        path="/reset-password"
        element={user ? <Navigate to="/dashboard" /> : <ResetPassword />}
      />

      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <Layout>
              <Routes>

                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/clients" element={<Clients />} />
                <Route path="/clients/:id" element={<ClientDetails />} />

                <Route path="/itineraries" element={<Itineraries />} />
                <Route path="/itineraries/:id" element={<ItineraryDetails />} />
                <Route path="/bookings" element={<Bookings />} />
                <Route path="/resorts" element={<Resorts />} />
                <Route path="/resorts/:id" element={<ResortDetails />} />
                <Route path="/suppliers" element={<Suppliers />} />
                <Route path="/quotes" element={<Quotes />} />
                <Route path="/finance" element={<Finance />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/crm" element={<CRM />} />
                <Route path="/growth" element={<GrowthTab />} />
                <Route path="/test" element={<TestConnection />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Admin Routes */}
      <Route
        path="/admin/*"
        element={
          <AdminRoute>
            <AdminLayout>
              <Routes>
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="agencies" element={<AgenciesList />} />
                <Route path="agencies/:id" element={<AgencyDetails />} />
                <Route path="activity" element={<Activity />} />
                <Route path="clients/:id" element={<AdminClientDetails />} />
                <Route path="crm-leads/:id" element={<AdminLeadDetails />} />
                <Route path="leads" element={<AdminLeads />} />
                <Route path="mass-email" element={<MassEmail />} />
                <Route path="settings" element={<AdminSettings />} />
                <Route index element={<Navigate to="dashboard" />} />
              </Routes>
            </AdminLayout>
          </AdminRoute>
        }
      />

      {/* Public Landing Page */}
      <Route path="/" element={user ? <Navigate to={getHomeRoute()} /> : <Landing />} />

      {/* Public Pricing Page */}
      <Route path="/pricing" element={<Pricing />} />

      {/* Public About Page */}
      <Route path="/about" element={<About />} />

      {/* Public Itinerary View */}
      <Route path="/view/:id" element={<PublicItineraryView />} />

      {/* Public Logo View */}
      <Route path="/logo" element={<LogoPage />} />

      {/* Partners Landing Page */}
      <Route path="/landing" element={<PartnersLanding />} />

      {/* Lead Capture Widget */}
      <Route path="/widget/:agencyId" element={<LeadCaptureWidget />} />
    </Routes>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AmadeusProvider>
          <BrandingProvider>
            <ChatProvider>
              <BrowserRouter>
                <ScrollToTop />
                <AppRoutes />
                <Toaster />
              </BrowserRouter>
            </ChatProvider>
          </BrandingProvider>
        </AmadeusProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;

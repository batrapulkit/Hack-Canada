import express from 'express';
import { authenticate, verifySuperAdmin } from '../middleware/auth.js';
import {
    getDashboardStats,
    getAgencyList,
    getAgencyDetails,
    getAgencyClients,
    getAgencyLeads,
    getAgencyItineraries,
    getAgencyInvoices,
    getAdminClientDetails,
    getAdminLeadDetails,
    addAgencyCredits,
    getSystemActivity,
    updateAgency,
    deleteAgency,
    createAgencyUser,
    updateAgencyUser,
    deleteAgencyUser,
    getRevenueStats,
    getAdminLeads,
    createAdminLead,
    updateAdminLead,
    deleteAdminLead,
    promoteLeadToAgency,
    bulkCreateAdminLeads,
    getAdminTeam,
    createAdminUser as createSuperAdmin, // Renamed to avoid usage conflict if needed, though export names are distinct
    deleteAdminUser as deleteSuperAdmin,
    updateAdminPassword,
    sendMassEmail,
    getSystemSettings,
    updateSystemSettings
} from '../controllers/adminController.js';

const router = express.Router();

// All routes require authentication AND super_admin role
router.use(authenticate);
router.use(verifySuperAdmin);

router.get('/stats', getDashboardStats);
router.get('/agencies', getAgencyList);
router.get('/agencies/:id', getAgencyDetails);
router.get('/agencies/:id/clients', getAgencyClients);
router.get('/agencies/:id/leads', getAgencyLeads);
router.get('/agencies/:id/itineraries', getAgencyItineraries);
router.get('/agencies/:id/invoices', getAgencyInvoices);
router.post('/agencies/:id/credits', addAgencyCredits);
router.get('/clients/:id', getAdminClientDetails);
router.get('/crm-leads/:id', getAdminLeadDetails); // Changed to crm-leads to distinct from 'leads' (admin leads)
router.get('/activity', getSystemActivity);
router.get('/revenue', getRevenueStats);

// Agency Management
router.put('/agencies/:id', updateAgency);
router.delete('/agencies/:id', deleteAgency);

// Agent Management (God Mode)
router.post('/agencies/:id/users', createAgencyUser);
router.put('/users/:userId', updateAgencyUser);
router.delete('/users/:userId', deleteAgencyUser);

// Outreach / Admin Leads
router.get('/leads', getAdminLeads);
router.post('/leads/bulk', bulkCreateAdminLeads);
router.post('/leads', createAdminLead);
router.put('/leads/:id', updateAdminLead);
router.delete('/leads/:id', deleteAdminLead);
router.post('/leads/:id/promote', promoteLeadToAgency);

// Admin Settings
router.get('/team', getAdminTeam);
router.post('/team', createSuperAdmin);
router.delete('/team/:id', deleteSuperAdmin);
router.put('/password', updateAdminPassword);

// Mass Email
router.post('/mass-email', sendMassEmail);

// System Settings
router.get('/system-settings', getSystemSettings);
router.post('/system-settings', updateSystemSettings);

export default router;

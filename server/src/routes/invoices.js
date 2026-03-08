import express from 'express';
import {
  getInvoices,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  getInvoiceById,
  createPaymentLink
} from '../controllers/invoiceController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticate);

// Get all invoices
router.get('/', getInvoices);

// Get invoice by ID
router.get('/:id', getInvoiceById);

// Create new invoice
router.post('/', createInvoice);

// Update invoice
router.patch('/:id', updateInvoice);

// Delete invoice
router.delete('/:id', authenticate, deleteInvoice);

export default router;

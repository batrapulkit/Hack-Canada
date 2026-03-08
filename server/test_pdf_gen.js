import { generateInvoicePDF } from './src/services/pdfService.js';
import fs from 'fs';

const mockInvoice = {
    invoice_number: 'INV-TEST-001',
    issue_date: new Date().toISOString(),
    due_date: new Date().toISOString(),
    total: 1500.00,
    client: {
        full_name: 'Test Client',
        email: 'test@example.com'
    },
    invoice_items: [
        { description: 'Service A', quantity: 1, unit_price: 1000, amount: 1000 },
        { description: 'Service B', quantity: 2, unit_price: 250, amount: 500 }
    ]
};

const mockSettings = {
    agency_name: 'Test Agency'
};

async function test() {
    try {
        console.log('Generating PDF...');
        const buffer = await generateInvoicePDF(mockInvoice, mockSettings);
        console.log('PDF generated. Buffer length:', buffer.length);
        fs.writeFileSync('test_invoice.pdf', buffer);
        console.log('Saved to test_invoice.pdf');
    } catch (error) {
        console.error('Error generating PDF:', error);
    }
}

test();

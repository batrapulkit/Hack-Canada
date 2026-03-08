import PDFDocument from 'pdfkit';

export const generateInvoicePDF = (invoice, agencySettings) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50 });
            let buffers = [];
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => resolve(Buffer.concat(buffers)));

            // --- 1. Header ---
            // Agency Name (Top Left)
            doc.fontSize(20).text(agencySettings?.agency_name || 'Triponic B2B', { align: 'left' });

            // Invoice Info (Top Right)
            doc.fontSize(10).text(`Invoice Number: ${invoice.invoice_number}`, { align: 'right' });
            doc.text(`Issue Date: ${new Date(invoice.issue_date).toLocaleDateString()}`, { align: 'right' });
            doc.text(`Due Date: ${new Date(invoice.due_date).toLocaleDateString()}`, { align: 'right' });
            doc.moveDown();

            // --- 2. Client Info ---
            doc.fontSize(12).text('Bill To:', { underline: true });
            if (invoice.client) {
                doc.fontSize(10).text(invoice.client.full_name);
                doc.text(invoice.client.email || '');
            } else {
                doc.fontSize(10).text('Client details not available');
            }
            doc.moveDown();

            // --- 3. Items Table ---
            const tableTop = 200;
            doc.font('Helvetica-Bold');
            doc.text('Description', 50, tableTop);
            doc.text('Quantity', 300, tableTop, { width: 90, align: 'right' });
            doc.text('Unit Price', 400, tableTop, { width: 90, align: 'right' });
            doc.text('Total', 500, tableTop, { width: 90, align: 'right' });

            doc.moveTo(50, tableTop + 15).lineTo(590, tableTop + 15).stroke();
            doc.font('Helvetica');

            let position = tableTop + 30;

            // Ensure invoice_items exists
            const items = invoice.invoice_items || [];

            items.forEach(item => {
                doc.text(item.description, 50, position);
                doc.text(item.quantity, 300, position, { width: 90, align: 'right' });
                doc.text(`$${item.unit_price}`, 400, position, { width: 90, align: 'right' });
                doc.text(`$${item.amount}`, 500, position, { width: 90, align: 'right' });
                position += 20;
            });

            doc.moveTo(50, position + 10).lineTo(590, position + 10).stroke();
            position += 20;

            // --- 4. Totals ---
            doc.font('Helvetica-Bold');
            doc.text(`Total: $${invoice.total}`, 400, position, { width: 190, align: 'right' });

            // --- 5. Footer ---
            doc.moveDown(4);
            doc.fontSize(10).font('Helvetica').text('Thank you for your business.', 50, doc.y, { align: 'center', width: 500 });

            doc.end();
        } catch (error) {
            reject(error);
        }
    });
};

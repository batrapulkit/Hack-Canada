import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Upload, FileText, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';
import api from '../../api/client';
import { toast } from 'sonner';

export default function ImportInvoiceDialog({ open, onClose, onSuccess }) {
    const [importMethod, setImportMethod] = useState(null); // 'excel' or 'manual'
    const [parsedInvoices, setParsedInvoices] = useState([]);
    const [loading, setLoading] = useState(false);

    // Manual entry state
    const [manualInvoice, setManualInvoice] = useState({
        invoice_number: '',
        client_id: '',
        amount: '',
        due_date: '',
        description: ''
    });

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const wb = XLSX.read(evt.target.result, { type: 'binary' });
                const ws = wb.Sheets[wb.SheetNames[0]];
                const data = XLSX.utils.sheet_to_json(ws, { header: 1 });

                if (data.length < 2) {
                    toast.error('Excel file must have at least a header row and one data row');
                    return;
                }

                const headers = data[0].map(h => String(h).toLowerCase().trim());
                const invoices = data.slice(1).map(row => {
                    const invoice = {};
                    headers.forEach((header, index) => {
                        const value = row[index] ? String(row[index]).trim() : '';
                        if (header.includes('invoice') && header.includes('number')) invoice.invoice_number = value;
                        else if (header.includes('client')) invoice.client_id = value;
                        else if (header.includes('amount') || header.includes('total')) invoice.amount = value;
                        else if (header.includes('due') && header.includes('date')) invoice.due_date = value;
                        else if (header.includes('description') || header.includes('note')) invoice.description = value;
                    });

                    // Fallback to positional if no headers matched
                    if (!invoice.invoice_number && row[0]) invoice.invoice_number = String(row[0]).trim();
                    if (!invoice.client_id && row[1]) invoice.client_id = String(row[1]).trim();
                    if (!invoice.amount && row[2]) invoice.amount = String(row[2]).trim();

                    return invoice;
                }).filter(invoice => invoice.invoice_number);

                setParsedInvoices(invoices);
                toast.success(`Found ${invoices.length} invoices in file`);
            } catch (error) {
                console.error(error);
                toast.error('Failed to parse Excel file');
            }
        };
        reader.readAsBinaryString(file);
    };

    const handleManualSubmit = async () => {
        if (!manualInvoice.invoice_number || !manualInvoice.amount) {
            toast.error('Invoice Number and Amount are required');
            return;
        }

        setLoading(true);
        try {
            await api.post('/invoices', {
                ...manualInvoice,
                total: manualInvoice.amount,
                status: 'draft'
            });
            toast.success('Invoice added successfully!');
            setManualInvoice({ invoice_number: '', client_id: '', amount: '', due_date: '', description: '' });
            onSuccess?.();
            onClose();
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.error || 'Failed to add invoice');
        } finally {
            setLoading(false);
        }
    };

    const handleBulkImport = async () => {
        if (parsedInvoices.length === 0) {
            toast.error('No invoices to import');
            return;
        }

        setLoading(true);
        try {
            // Import invoices one by one (you may want to create a bulk endpoint on the backend)
            for (const invoice of parsedInvoices) {
                await api.post('/invoices', {
                    ...invoice,
                    total: invoice.amount,
                    status: 'draft'
                });
            }
            toast.success(`Successfully imported ${parsedInvoices.length} invoices!`);
            setParsedInvoices([]);
            onSuccess?.();
            onClose();
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.error || 'Failed to import invoices');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setImportMethod(null);
        setParsedInvoices([]);
        setManualInvoice({ invoice_number: '', client_id: '', amount: '', due_date: '', description: '' });
        onClose();
    };

    if (!open) return null;

    return (
        <>
            <div className="fixed inset-0 bg-black/50 z-40" onClick={handleClose} />
            <div className="fixed inset-0 flex items-center justify-center z-50 p-4" onClick={handleClose}>
                <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                    <div className="p-6">
                        <h2 className="text-2xl font-bold mb-6">Import Invoices</h2>

                        {!importMethod && (
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => setImportMethod('excel')}
                                    className="p-6 border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all"
                                >
                                    <FileSpreadsheet className="w-12 h-12 mx-auto mb-3 text-blue-600" />
                                    <h3 className="font-semibold text-lg mb-2">Upload Excel</h3>
                                    <p className="text-sm text-gray-600">Import multiple invoices from an Excel file</p>
                                </button>

                                <button
                                    onClick={() => setImportMethod('manual')}
                                    className="p-6 border-2 border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all"
                                >
                                    <FileText className="w-12 h-12 mx-auto mb-3 text-green-600" />
                                    <h3 className="font-semibold text-lg mb-2">Manual Entry</h3>
                                    <p className="text-sm text-gray-600">Add a single invoice manually</p>
                                </button>
                            </div>
                        )}

                        {importMethod === 'excel' && (
                            <div className="space-y-4">
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-500 transition-colors">
                                    <Label htmlFor="file-upload" className="cursor-pointer">
                                        <div className="text-center">
                                            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                                            <p className="text-sm text-gray-600">
                                                Click to upload or drag and drop
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                Excel (.xlsx, .xls) files
                                            </p>
                                        </div>
                                    </Label>
                                    <Input
                                        id="file-upload"
                                        type="file"
                                        accept=".xlsx,.xls"
                                        onChange={handleFileUpload}
                                        className="hidden"
                                    />
                                </div>

                                {parsedInvoices.length > 0 && (
                                    <div className="border rounded-lg p-4 bg-green-50">
                                        <h3 className="font-semibold mb-2 text-green-800">
                                            Preview: {parsedInvoices.length} invoice(s) ready to import
                                        </h3>
                                        <div className="max-h-48 overflow-y-auto space-y-2">
                                            {parsedInvoices.slice(0, 5).map((invoice, idx) => (
                                                <div key={idx} className="text-sm bg-white p-2 rounded">
                                                    <span className="font-medium">{invoice.invoice_number}</span>
                                                    {invoice.amount && <span className="text-gray-600"> • ${invoice.amount}</span>}
                                                    {invoice.client_id && <span className="text-gray-600"> • Client: {invoice.client_id}</span>}
                                                </div>
                                            ))}
                                            {parsedInvoices.length > 5 && (
                                                <p className="text-xs text-gray-500 italic">
                                                    ...and {parsedInvoices.length - 5} more
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <div className="flex justify-end gap-3 pt-4 border-t">
                                    <Button variant="outline" onClick={handleClose}>
                                        Cancel
                                    </Button>
                                    <Button variant="outline" onClick={() => setImportMethod(null)}>
                                        Back
                                    </Button>
                                    <Button
                                        onClick={handleBulkImport}
                                        disabled={parsedInvoices.length === 0 || loading}
                                        className="bg-blue-600 hover:bg-blue-700"
                                    >
                                        {loading ? 'Importing...' : `Import ${parsedInvoices.length} Invoice${parsedInvoices.length !== 1 ? 's' : ''}`}
                                    </Button>
                                </div>
                            </div>
                        )}

                        {importMethod === 'manual' && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="invoice_number">Invoice Number *</Label>
                                        <Input
                                            id="invoice_number"
                                            value={manualInvoice.invoice_number}
                                            onChange={(e) => setManualInvoice({ ...manualInvoice, invoice_number: e.target.value })}
                                            placeholder="INV-001"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="amount">Amount *</Label>
                                        <Input
                                            id="amount"
                                            type="number"
                                            value={manualInvoice.amount}
                                            onChange={(e) => setManualInvoice({ ...manualInvoice, amount: e.target.value })}
                                            placeholder="1000.00"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="client_id">Client ID</Label>
                                        <Input
                                            id="client_id"
                                            value={manualInvoice.client_id}
                                            onChange={(e) => setManualInvoice({ ...manualInvoice, client_id: e.target.value })}
                                            placeholder="Client ID or Name"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="due_date">Due Date</Label>
                                        <Input
                                            id="due_date"
                                            type="date"
                                            value={manualInvoice.due_date}
                                            onChange={(e) => setManualInvoice({ ...manualInvoice, due_date: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <Label htmlFor="description">Description</Label>
                                    <textarea
                                        id="description"
                                        className="w-full border rounded-lg p-2"
                                        rows="3"
                                        value={manualInvoice.description}
                                        onChange={(e) => setManualInvoice({ ...manualInvoice, description: e.target.value })}
                                        placeholder="Invoice description or notes..."
                                    />
                                </div>

                                <div className="flex justify-end gap-3 pt-4 border-t">
                                    <Button variant="outline" onClick={handleClose}>
                                        Cancel
                                    </Button>
                                    <Button variant="outline" onClick={() => setImportMethod(null)}>
                                        Back
                                    </Button>
                                    <Button
                                        onClick={handleManualSubmit}
                                        disabled={loading}
                                        className="bg-green-600 hover:bg-green-700"
                                    >
                                        {loading ? 'Adding...' : 'Add Invoice'}
                                    </Button>
                                </div>
                            </div>
                        )}

                        {!importMethod && (
                            <div className="flex justify-end gap-3 pt-4 border-t mt-4">
                                <Button variant="outline" onClick={handleClose}>
                                    Cancel
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

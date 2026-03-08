import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Upload, UserPlus, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';
import api from '../../api/client';
import { toast } from 'sonner';

export default function ImportClientDialog({ open, onClose, onSuccess }) {
    const [importMethod, setImportMethod] = useState(null); // 'excel' or 'manual'
    const [parsedClients, setParsedClients] = useState([]);
    const [loading, setLoading] = useState(false);

    // Manual entry state
    const [manualClient, setManualClient] = useState({
        name: '',
        email: '',
        phone: '',
        company: '',
        city: '',
        country: ''
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
                const clients = data.slice(1).map(row => {
                    const client = {};
                    headers.forEach((header, index) => {
                        const value = row[index] ? String(row[index]).trim() : '';
                        if (header.includes('name')) client.name = value;
                        else if (header.includes('email')) client.email = value;
                        else if (header.includes('phone')) client.phone = value;
                        else if (header.includes('company')) client.company = value;
                        else if (header.includes('city')) client.city = value;
                        else if (header.includes('country')) client.country = value;
                    });

                    // Fallback to positional if no headers matched
                    if (!client.name && row[0]) client.name = String(row[0]).trim();
                    if (!client.email && row[1]) client.email = String(row[1]).trim();
                    if (!client.phone && row[2]) client.phone = String(row[2]).trim();

                    return client;
                }).filter(client => client.name);

                setParsedClients(clients);
                toast.success(`Found ${clients.length} clients in file`);
            } catch (error) {
                console.error(error);
                toast.error('Failed to parse Excel file');
            }
        };
        reader.readAsBinaryString(file);
    };

    const handleManualSubmit = async () => {
        if (!manualClient.name || !manualClient.email) {
            toast.error('Name and Email are required');
            return;
        }

        setLoading(true);
        try {
            await api.post('/clients', manualClient);
            toast.success('Client added successfully!');
            setManualClient({ name: '', email: '', phone: '', company: '', city: '', country: '' });
            onSuccess?.();
            onClose();
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.error || 'Failed to add client');
        } finally {
            setLoading(false);
        }
    };

    const handleBulkImport = async () => {
        if (parsedClients.length === 0) {
            toast.error('No clients to import');
            return;
        }

        setLoading(true);
        try {
            await api.post('/clients/bulk', { clients: parsedClients });
            toast.success(`Successfully imported ${parsedClients.length} clients!`);
            setParsedClients([]);
            onSuccess?.();
            onClose();
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.error || 'Failed to import clients');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setImportMethod(null);
        setParsedClients([]);
        setManualClient({ name: '', email: '', phone: '', company: '', city: '', country: '' });
        onClose();
    };

    if (!open) return null;

    return (
        <>
            <div className="fixed inset-0 bg-black/50 z-40" onClick={handleClose} />
            <div className="fixed inset-0 flex items-center justify-center z-50 p-4" onClick={handleClose}>
                <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                    <div className="p-6">
                        <h2 className="text-2xl font-bold mb-6">Import Clients</h2>

                        {!importMethod && (
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => setImportMethod('excel')}
                                    className="p-6 border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all"
                                >
                                    <FileSpreadsheet className="w-12 h-12 mx-auto mb-3 text-blue-600" />
                                    <h3 className="font-semibold text-lg mb-2">Upload Excel</h3>
                                    <p className="text-sm text-gray-600">Import multiple clients from an Excel file</p>
                                </button>

                                <button
                                    onClick={() => setImportMethod('manual')}
                                    className="p-6 border-2 border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all"
                                >
                                    <UserPlus className="w-12 h-12 mx-auto mb-3 text-green-600" />
                                    <h3 className="font-semibold text-lg mb-2">Manual Entry</h3>
                                    <p className="text-sm text-gray-600">Add a single client manually</p>
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

                                {parsedClients.length > 0 && (
                                    <div className="border rounded-lg p-4 bg-green-50">
                                        <h3 className="font-semibold mb-2 text-green-800">
                                            Preview: {parsedClients.length} client(s) ready to import
                                        </h3>
                                        <div className="max-h-48 overflow-y-auto space-y-2">
                                            {parsedClients.slice(0, 5).map((client, idx) => (
                                                <div key={idx} className="text-sm bg-white p-2 rounded">
                                                    <span className="font-medium">{client.name}</span>
                                                    {client.email && <span className="text-gray-600"> • {client.email}</span>}
                                                    {client.phone && <span className="text-gray-600"> • {client.phone}</span>}
                                                </div>
                                            ))}
                                            {parsedClients.length > 5 && (
                                                <p className="text-xs text-gray-500 italic">
                                                    ...and {parsedClients.length - 5} more
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
                                        disabled={parsedClients.length === 0 || loading}
                                        className="bg-blue-600 hover:bg-blue-700"
                                    >
                                        {loading ? 'Importing...' : `Import ${parsedClients.length} Client${parsedClients.length !== 1 ? 's' : ''}`}
                                    </Button>
                                </div>
                            </div>
                        )}

                        {importMethod === 'manual' && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="name">Name *</Label>
                                        <Input
                                            id="name"
                                            value={manualClient.name}
                                            onChange={(e) => setManualClient({ ...manualClient, name: e.target.value })}
                                            placeholder="John Doe"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="email">Email *</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            value={manualClient.email}
                                            onChange={(e) => setManualClient({ ...manualClient, email: e.target.value })}
                                            placeholder="john@example.com"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="phone">Phone</Label>
                                        <Input
                                            id="phone"
                                            value={manualClient.phone}
                                            onChange={(e) => setManualClient({ ...manualClient, phone: e.target.value })}
                                            placeholder="+1234567890"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="company">Company</Label>
                                        <Input
                                            id="company"
                                            value={manualClient.company}
                                            onChange={(e) => setManualClient({ ...manualClient, company: e.target.value })}
                                            placeholder="Company Name"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="city">City</Label>
                                        <Input
                                            id="city"
                                            value={manualClient.city}
                                            onChange={(e) => setManualClient({ ...manualClient, city: e.target.value })}
                                            placeholder="New York"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="country">Country</Label>
                                        <Input
                                            id="country"
                                            value={manualClient.country}
                                            onChange={(e) => setManualClient({ ...manualClient, country: e.target.value })}
                                            placeholder="USA"
                                        />
                                    </div>
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
                                        {loading ? 'Adding...' : 'Add Client'}
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

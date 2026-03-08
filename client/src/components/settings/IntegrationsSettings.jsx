import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plane, Calendar, Map, CheckCircle2, Eye, EyeOff, Server, RefreshCw, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import api from "@/api/client";

const IntegrationCard = ({
    title,
    description,
    icon: Icon,
    apiKey,
    onSave,
    placeholder = "Enter API Key",
    helpText,
    type = "password",
    readOnly = false
}) => {
    const [key, setKey] = useState(apiKey || '');
    const [showKey, setShowKey] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setKey(apiKey || '');
    }, [apiKey]);

    const handleSave = async () => {
        setSaving(true);
        await onSave(key);
        setSaving(false);
    };

    return (
        <Card className="border-slate-200">
            <CardHeader className="flex flex-row items-center gap-4 pb-2">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <Icon className="w-6 h-6 text-slate-600" />
                </div>
                <div>
                    <CardTitle className="text-base font-semibold text-slate-900">{title}</CardTitle>
                    <CardDescription className="text-xs">{description}</CardDescription>
                </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
                <div className="space-y-2">
                    <Label>{type === 'text' ? 'Value' : 'API Key / Secret'}</Label>
                    <div className="relative">
                        <Input
                            type={type === 'text' || showKey ? "text" : "password"}
                            value={key}
                            onChange={(e) => setKey(e.target.value)}
                            placeholder={placeholder}
                            className={`pr-10 ${readOnly ? 'bg-slate-50' : ''}`}
                            readOnly={readOnly}
                        />
                        {type !== 'text' && (
                            <button
                                type="button"
                                onClick={() => setShowKey(!showKey)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        )}
                    </div>
                    {helpText && <p className="text-xs text-slate-500">{helpText}</p>}
                </div>

                {!readOnly && (
                    <div className="flex justify-end">
                        <Button
                            size="sm"
                            onClick={handleSave}
                            disabled={saving || !key || key === apiKey}
                            className={apiKey && key === apiKey ? "bg-green-600 hover:bg-green-700" : ""}
                        >
                            {saving ? "Saving..." : (apiKey && key === apiKey ? "Saved" : "Save")}
                            {apiKey && key === apiKey && <CheckCircle2 className="w-4 h-4 ml-2" />}
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

// New Component for GDS Enterprise Config (REST)
const AmadeusGDSCard = ({ config, onSave, onSyncNow, agencyId }) => {
    const [formData, setFormData] = useState({
        amadeus_client_id: config?.amadeus_client_id || '',
        amadeus_client_secret: '', // Don't show existing
        amadeus_environment: config?.amadeus_environment || 'test',
        amadeus_queue_number: config?.amadeus_queue_number || '50'
    });
    const [saving, setSaving] = useState(false);
    const [importing, setImporting] = useState(false);
    const [showKey, setShowKey] = useState(false);

    // Auto-Discovery Popup State
    const [showImportDialog, setShowImportDialog] = useState(false);
    const [foundCount, setFoundCount] = useState(0);

    // Import Tests
    const [testPnr, setTestPnr] = useState('');

    useEffect(() => {
        setFormData(prev => ({
            ...prev,
            amadeus_client_id: config?.amadeus_client_id || '',
            amadeus_environment: config?.amadeus_environment || 'test',
            amadeus_queue_number: config?.amadeus_queue_number || '50'
        }));
    }, [config]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // 1. Save keys
            await onSave(formData);

            // 2. Test Connection & Discovery
            if (agencyId) {
                try {
                    const testRes = await api.post('/integrations/gds/test', { agency_id: agencyId });
                    if (testRes.data.success) {
                        if (testRes.data.found_bookings_count > 0) {
                            // If bookings found, show Popup
                            setFoundCount(testRes.data.found_bookings_count);
                            setShowImportDialog(true);
                        } else {
                            toast.success("Connection successful! No pending bookings found.");
                        }
                    }
                } catch (testErr) {
                    console.warn("Connection test failed after save", testErr);
                    toast.warning("Saved, but connection verified failed. Check keys.");
                }
            }
        } catch (error) {
            console.error("Save failed", error);
        } finally {
            setSaving(false);
        }
    };

    const handleBatchImport = async () => {
        setShowImportDialog(false);
        setImporting(true);
        try {
            await api.post('/integrations/gds/import-batch', { agency_id: agencyId });
            toast.success("Batch import started. Bookings will appear shortly.");
        } catch (e) {
            toast.error("Batch import failed.");
        } finally {
            setImporting(false);
        }
    };

    const handleImport = async () => {
        if (!testPnr) return;
        setImporting(true);
        try {
            await onSyncNow(testPnr);
            setTestPnr('');
        } catch (e) {
            // Handled by parent
        } finally {
            setImporting(false);
        }
    };

    return (
        <Card className="border-blue-200 bg-blue-50/10 relative overflow-hidden">
            {/* Import Dialog Overlay */}
            {showImportDialog && (
                <div className="absolute inset-0 z-50 bg-white/95 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200">
                    <div className="text-center space-y-4 max-w-sm bg-white p-6 rounded-xl shadow-lg border border-slate-100">
                        <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                            <CheckCircle2 className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900">Success! Data Found.</h3>
                            <p className="text-sm text-slate-600 mt-2">
                                We found <strong>{foundCount} booking{foundCount !== 1 ? 's' : ''}</strong> associated with this account.
                            </p>
                            <p className="text-sm text-slate-500 mt-1">
                                Would you like to import <strong>everything</strong> into Triponic now?
                            </p>
                        </div>
                        <div className="flex flex-col gap-2 pt-2">
                            <Button onClick={handleBatchImport} className="w-full bg-blue-600 hover:bg-blue-700">
                                Yes, Import Everything
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => setShowImportDialog(false)} className="text-slate-400 hover:text-slate-600">
                                No, I'll import manually
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            <CardHeader className="flex flex-row items-center gap-4 pb-2">
                <div className="p-3 bg-blue-100 rounded-lg border border-blue-200">
                    <Server className="w-6 h-6 text-blue-700" />
                </div>
                <div>
                    <div className="flex items-center gap-2">
                        <CardTitle className="text-base font-semibold text-blue-900">Amadeus GDS (REST API)</CardTitle>
                        <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200 text-[10px] h-5">BETA</Badge>
                    </div>
                    <CardDescription className="text-xs">Connect using Amadeus Self-Service or Enterprise REST credentials.</CardDescription>
                </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>API Key (Client ID)</Label>
                        <Input name="amadeus_client_id" value={formData.amadeus_client_id} onChange={handleChange} placeholder="Enter API Key" />
                    </div>
                    <div className="space-y-2">
                        <Label>API Secret (Client Secret)</Label>
                        <div className="relative">
                            <Input
                                name="amadeus_client_secret"
                                type={showKey ? "text" : "password"}
                                value={formData.amadeus_client_secret}
                                onChange={handleChange}
                                placeholder={config?.amadeus_client_id ? "(Unchanged)" : "Enter Secret"}
                                className="pr-10"
                            />
                            <button
                                type="button"
                                onClick={() => setShowKey(!showKey)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Environment</Label>
                        <select
                            name="amadeus_environment"
                            value={formData.amadeus_environment}
                            onChange={handleChange}
                            className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2"
                        >
                            <option value="test">Test (Sandbox)</option>
                            <option value="production">Production</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <Label>Queue(s) to Scan</Label>
                        <Input
                            name="amadeus_queue_number"
                            value={formData.amadeus_queue_number}
                            onChange={handleChange}
                            placeholder="e.g. 50"
                        />
                        <p className="text-[10px] text-slate-500">
                            Queue for new/updated bookings (default: 50).
                        </p>
                    </div>
                </div>

                <div className="pt-4 border-t border-blue-100">
                    <div className="flex justify-between items-center mb-2">
                        <h5 className="text-sm font-medium text-blue-900">Test PNR Import</h5>
                    </div>
                    <div className="flex gap-2">
                        <Input
                            value={testPnr}
                            onChange={(e) => setTestPnr(e.target.value)}
                            placeholder="Enter PNR (e.g. R12345)"
                            className="max-w-xs"
                        />
                        <Button
                            size="sm"
                            variant="secondary"
                            onClick={handleImport}
                            disabled={importing || !testPnr || !config?.amadeus_client_id}
                        >
                            {importing ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                            {importing ? "Importing..." : "Import Booking"}
                        </Button>
                    </div>
                    <p className="text-xs text-slate-500 mt-2">
                        Enter a valid PNR to fetch booking details and create/update Client and Itinerary records.
                    </p>
                </div>

                <div className="pt-2 border-t border-blue-100 flex justify-end items-center mt-2">
                    <Button size="sm" onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
                        {saving ? "Saving..." : "Save Configuration"}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};


export default function IntegrationsSettings() {
    const [basicKeys, setBasicKeys] = useState({
        skyscanner: '',
        viator: ''
    });
    // Separate state for Enterprise GDS
    const [gdsConfig, setGdsConfig] = useState(null);
    const [loading, setLoading] = useState(true);
    const { agency } = useAuth();

    // Load initial keys
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                // 1. Fetch Basic Keys (Mock for now, or update to use API if ready)
                const loadedKeys = localStorage.getItem('integration_keys');
                if (loadedKeys) setBasicKeys(JSON.parse(loadedKeys));

                // 2. Fetch GDS Config from Backend
                if (agency?.id) {
                    const response = await api.get(`/integrations/gds?agency_id=${agency.id}`);
                    if (response.data) {
                        setGdsConfig(response.data);
                    }
                }
            } catch (err) {
                console.warn("Failed to load settings (or no config yet)", err);
                // If 404/Empty, that's fine, just null
            } finally {
                setLoading(false);
            }
        };

        if (agency) {
            fetchSettings();
        }
    }, [agency]);

    const saveBasicKey = async (provider, key) => {
        // Simulate API call for basic keys (Legacy)
        return new Promise(resolve => {
            setTimeout(() => {
                const newKeys = { ...basicKeys, [provider]: key };
                setBasicKeys(newKeys);
                localStorage.setItem('integration_keys', JSON.stringify(newKeys));
                toast.success(`${provider.charAt(0).toUpperCase() + provider.slice(1)} key saved successfully`);
                resolve();
            }, 500);
        });
    };

    const saveGdsConfig = async (formData) => {
        if (!agency?.id) {
            toast.error("Agency information missing");
            return;
        }
        try {
            const payload = { ...formData, agency_id: agency.id };
            const res = await api.post('/integrations/gds', payload);
            setGdsConfig(res.data.config);
            toast.success("Amadeus Connection Updated");
        } catch (err) {
            console.error(err);
            toast.error("Failed to save GDS configuration");
            throw err; // Re-throw to handle in Child
        }
    };

    const importBooking = async (pnr) => {
        if (!agency?.id) return;
        try {
            const res = await api.post('/integrations/gds/import', { agency_id: agency.id, pnr });
            if (res.data.success) {
                toast.success(res.data.message);
            }
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.error || "Import failed");
            throw err;
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="space-y-6">
            <Card className="bg-amber-50 border-amber-200">
                <CardContent className="p-4 flex gap-3">
                    <div className="p-2 bg-amber-100 rounded-lg h-fit">
                        <Calendar className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                        <h4 className="font-semibold text-amber-800 text-sm">GDS Sync Enabled</h4>
                        <p className="text-sm text-amber-700 mt-1">
                            The system is configured to sync with <strong>Amadeus GDS</strong>.
                            Enter your credentials below to enable real-time PNR imports and synchronization.
                        </p>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
                {/* Enterprise GDS Config */}
                <AmadeusGDSCard
                    config={gdsConfig}
                    onSave={saveGdsConfig}
                    onSyncNow={importBooking}
                    agencyId={agency?.id}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <IntegrationCard
                    title="Skyscanner API"
                    description="Global flight pricing and routing."
                    icon={Plane}
                    apiKey={basicKeys.skyscanner}
                    onSave={(k) => saveBasicKey('skyscanner', k)}
                    placeholder="Enter Skyscanner API Key"
                />

                <IntegrationCard
                    title="Viator Partner API"
                    description="Tours, activities, and experiences."
                    icon={Map}
                    apiKey={basicKeys.viator}
                    onSave={(k) => saveBasicKey('viator', k)}
                    placeholder="Enter Viator API Key"
                />
            </div>
        </div>
    );
}

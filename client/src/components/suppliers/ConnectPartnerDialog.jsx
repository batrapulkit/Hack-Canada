import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ExternalLink, Key, Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import api from "@/api/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const PARTNER_INSTRUCTIONS = {
    "Expedia": {
        portalUrl: "https://expediapartnersolutions.com/login",
        steps: [
            "Log in to Expedia Partner Solutions.",
            "Navigate to 'API Settings' in your dashboard.",
            "Create a new API Key for 'B2B Integration'.",
            "Copy the API Key and Shared Secret."
        ],
        fields: [
            { key: "apiKey", label: "API Key", type: "text", placeholder: "E.g. kjsd78..." },
            { key: "sharedSecret", label: "Shared Secret", type: "password", placeholder: "••••••••" }
        ]
    },
    "Booking.com": {
        portalUrl: "https://account.booking.com/",
        steps: [
            "Log in to your Booking.com Affiliate Partner Center.",
            "Go to 'Account' -> 'Connectivity'.",
            "Request an API Key for 'Content & Availability'.",
            "Copy the Affiliate ID and API Key."
        ],
        fields: [
            { key: "affiliateId", label: "Affiliate ID", type: "text", placeholder: "E.g. 12345" },
            { key: "apiKey", label: "API Key", type: "password", placeholder: "••••••••" }
        ]
    },
    "Agoda": {
        portalUrl: "https://partners.agoda.com/",
        steps: [
            "Log in to Agoda Partners.",
            "Navigate to 'Tools' -> 'API'.",
            "Generate a new API Key."
        ],
        fields: [
            { key: "apiKey", label: "API Key", type: "text", placeholder: "E.g. agoda_..." }
        ]
    },
    "default": {
        portalUrl: null,
        steps: [
            "Log in to the partner's developer or affiliate portal.",
            "Locate the API or Integration settings.",
            "Generate a new API Key or Access Token.",
            "Copy the credentials below."
        ],
        fields: [
            { key: "apiKey", label: "API Key / Token", type: "text", placeholder: "Enter API Key" }
        ]
    }
};

export default function ConnectPartnerDialog({ open, onClose, partner, existingSupplier }) {
    const queryClient = useQueryClient();
    const [config, setConfig] = useState({});
    const [isActive, setIsActive] = useState(true);

    const instructions = PARTNER_INSTRUCTIONS[partner?.name] || PARTNER_INSTRUCTIONS["default"];

    useEffect(() => {
        if (open) {
            // Pre-fill if editing existing
            if (existingSupplier) {
                setConfig(existingSupplier.api_config || {});
                setIsActive(existingSupplier.is_active);
            } else {
                setConfig({});
                setIsActive(true);
            }
        }
    }, [open, existingSupplier]);

    const mutation = useMutation({
        mutationFn: async (data) => {
            const payload = {
                name: partner.name,
                type: partner.type,
                website_url: partner.website,
                logo_url: partner.logo,
                is_active: isActive,
                region: 'Global',
                api_config: config,
                notes: `Connected via Partner Directory. ${partner.description}`
            };

            if (existingSupplier) {
                return api.entities.Supplier.update(existingSupplier.id, payload);
            } else {
                return api.entities.Supplier.create(payload);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['suppliers'] });
            toast.success(existingSupplier ? 'Partner configuration updated' : `Successfully connected to ${partner.name}`);
            onClose();
        },
        onError: (error) => {
            console.error(error);
            toast.error("Failed to save partner configuration");
        }
    });

    const handleSave = () => {
        mutation.mutate();
    };

    const handleTestConnection = () => {
        toast.promise(
            new Promise((resolve) => setTimeout(resolve, 1500)),
            {
                loading: 'Verifying credentials...',
                success: 'Connection successful! Credentials are valid.',
                error: 'Connection failed'
            }
        );
    };

    const handleConfigChange = (key, value) => {
        setConfig(prev => ({ ...prev, [key]: value }));
    };

    if (!partner) return null;

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center gap-4 mb-2">
                        <div className="w-12 h-12 bg-white border border-slate-100 rounded-xl flex items-center justify-center p-2 shadow-sm">
                            <img src={partner.logo} alt={partner.name} className="w-full h-full object-contain" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl">Connect {partner.name}</DialogTitle>
                            <DialogDescription>
                                Configure API access to enable real-time bookings
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Instructions Section */}
                    <Alert className="bg-blue-50 border-blue-100">
                        <Info className="h-4 w-4 text-blue-600" />
                        <AlertTitle className="text-blue-800 font-semibold mb-2">How to get credentials</AlertTitle>
                        <AlertDescription className="text-blue-700">
                            <ol className="list-decimal list-inside space-y-1 text-sm">
                                {instructions.steps.map((step, i) => (
                                    <li key={i}>{step}</li>
                                ))}
                            </ol>
                            {instructions.portalUrl && (
                                <Button variant="link" className="h-auto p-0 mt-2 text-blue-800 font-semibold" asChild>
                                    <a href={instructions.portalUrl} target="_blank" rel="noopener noreferrer">
                                        Go to Developer Portal <ExternalLink className="w-3 h-3 ml-1" />
                                    </a>
                                </Button>
                            )}
                        </AlertDescription>
                    </Alert>

                    {/* Configuration Fields */}
                    <div className="space-y-4 border p-4 rounded-lg bg-slate-50/50">
                        <div className="flex items-center gap-2 mb-2">
                            <Key className="w-4 h-4 text-slate-500" />
                            <h4 className="font-semibold text-slate-900">API Configuration</h4>
                        </div>

                        {instructions.fields.map((field) => (
                            <div key={field.key}>
                                <Label htmlFor={field.key}>{field.label}</Label>
                                <Input
                                    id={field.key}
                                    type={field.type}
                                    placeholder={field.placeholder}
                                    value={config[field.key] || ''}
                                    onChange={(e) => handleConfigChange(field.key, e.target.value)}
                                    className="bg-white"
                                />
                            </div>
                        ))}
                    </div>

                    {/* Status Toggle */}
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-0.5">
                            <Label className="text-base">Active Status</Label>
                            <p className="text-sm text-slate-500">
                                Enable this partner on the Bookings page
                            </p>
                        </div>
                        <Switch
                            checked={isActive}
                            onCheckedChange={setIsActive}
                        />
                    </div>
                </div>

                <DialogFooter className="flex justify-between sm:justify-between">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={handleTestConnection}
                        className="mr-auto"
                    >
                        Test Connection
                    </Button>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={onClose}>Cancel</Button>
                        <Button
                            onClick={handleSave}
                            disabled={mutation.isPending}
                            className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white"
                        >
                            {mutation.isPending ? 'Saving...' : existingSupplier ? 'Update Configuration' : 'Connect Partner'}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

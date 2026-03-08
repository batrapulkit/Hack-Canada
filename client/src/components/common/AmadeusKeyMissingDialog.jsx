
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Key, CheckCircle2, AlertCircle } from "lucide-react";
import api from "@/api/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export default function AmadeusKeyMissingDialog({ open, onOpenChange, onSuccess }) {
    const { agency } = useAuth();
    const [clientId, setClientId] = useState('');
    const [clientSecret, setClientSecret] = useState('');
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        if (!agency?.id || !clientId || !clientSecret) return;

        setSaving(true);
        try {
            await api.post('/integrations/gds', {
                agency_id: agency.id,
                amadeus_client_id: clientId,
                amadeus_client_secret: clientSecret,
                amadeus_environment: 'test', // Default to test for safety
                amadeus_queue_number: '50'
            });

            toast.success("Amadeus Keys Saved!");

            // Wait a moment for backend to propagate if needed (usually instant)
            setTimeout(() => {
                onOpenChange(false);
                if (onSuccess) onSuccess();
            }, 500);

        } catch (error) {
            console.error(error);
            toast.error("Failed to save keys");
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <div className="mx-auto w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mb-4">
                        <Key className="w-6 h-6 text-amber-600" />
                    </div>
                    <DialogTitle className="text-center">Amadeus API Key Required</DialogTitle>
                    <DialogDescription className="text-center pt-2">
                        To use this feature (Live Search, Real-time Pricing, etc.), you must connect your Amadeus account.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="bg-amber-50 p-3 rounded-md text-xs text-amber-800 flex gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <p>These keys are stored securely in your agency settings and only used to fetch live data for you.</p>
                    </div>

                    <div className="space-y-2">
                        <Label>API Key (Client ID)</Label>
                        <Input
                            value={clientId}
                            onChange={(e) => setClientId(e.target.value)}
                            placeholder="Enter Client ID"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>API Secret (Client Secret)</Label>
                        <Input
                            type="password"
                            value={clientSecret}
                            onChange={(e) => setClientSecret(e.target.value)}
                            placeholder="Enter Client Secret"
                        />
                    </div>
                </div>

                <DialogFooter className="sm:justify-between flex gap-2">
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={saving || !clientId || !clientSecret} className="bg-amber-600 hover:bg-amber-700">
                        {saving ? "Saving..." : "Save & Continue"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

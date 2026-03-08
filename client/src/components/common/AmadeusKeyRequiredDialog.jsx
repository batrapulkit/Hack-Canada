import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Settings } from 'lucide-react';

/**
 * Reusable dialog component to show when Amadeus API keys are required but not configured
 * @param {boolean} open - Controls dialog visibility
 * @param {function} onOpenChange - Callback when dialog state changes
 * @param {string} feature - Name of the feature that requires Amadeus (e.g., "Flight Search", "Live Resort Pricing")
 */
export default function AmadeusKeyRequiredDialog({ open, onOpenChange, feature = "this feature" }) {
    const navigate = useNavigate();

    const handleGoToSettings = () => {
        onOpenChange(false);
        navigate('/settings?tab=integrations');
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className="mx-auto mb-2">
                        <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center">
                            <AlertTriangle className="w-8 h-8 text-amber-600" />
                        </div>
                    </div>
                    <DialogTitle className="text-center text-xl">
                        Amadeus API Configuration Required
                    </DialogTitle>
                    <DialogDescription className="text-center text-base pt-2">
                        {feature} requires Amadeus API credentials to fetch live data.
                        <br />
                        <br />
                        Please configure your <strong>API Key</strong> and <strong>Secret</strong> in Settings to enable this feature.
                    </DialogDescription>
                </DialogHeader>

                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 my-4">
                    <p className="text-sm text-slate-700">
                        <strong>Where to find your credentials:</strong>
                    </p>
                    <ol className="text-sm text-slate-600 mt-2 ml-4 space-y-1">
                        <li>Log in to your Amadeus Self-Service account</li>
                        <li>Navigate to "My Self-Service Workspace"</li>
                        <li>Copy your API Key and Secret</li>
                    </ol>
                    <a
                        href="https://developers.amadeus.com/get-started"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-800 mt-2 inline-block"
                    >
                        Learn more about Amadeus API →
                    </a>
                </div>

                <DialogFooter className="flex gap-2 sm:justify-center">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleGoToSettings}
                        className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600"
                    >
                        <Settings className="w-4 h-4 mr-2" />
                        Go to Settings
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

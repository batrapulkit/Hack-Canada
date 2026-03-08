import React from 'react';
import { useBranding } from '@/contexts/BrandingContext';

export default function LogoPage() {
    const { logo_url, company_name } = useBranding();

    // Use the dynamic logo from branding context, or fallback to the local one
    const logoSrc = logo_url || '/Logown.png';

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="p-8">
                <img
                    src={logoSrc}
                    alt={company_name || "Company Logo"}
                    className="max-h-96 max-w-full object-contain"
                />
            </div>
        </div>
    );
}

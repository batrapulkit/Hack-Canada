import React from "react";
import { useBranding } from "@/contexts/BrandingContext";

export default function AgencyBranding() {
  const { company_name, logo_url, plan } = useBranding();

  return (
    <div className="flex items-center gap-3">
      {logo_url ? (
        <img src={logo_url} alt={company_name} className="h-8 w-auto rounded-lg object-cover" />
      ) : (
        <img src="/Logown.png" alt="Triponic" className="h-8 w-auto" />
      )}
      <div>
        <h1 className="font-semibold text-slate-900 text-sm">{company_name}</h1>
        <p className="text-xs text-slate-500">{plan}</p>
      </div>
    </div>
  );
}

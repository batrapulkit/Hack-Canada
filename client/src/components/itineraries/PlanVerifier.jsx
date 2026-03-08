import React, { useState, useEffect } from "react";
import { ShieldCheck, Loader2, CheckCircle2, AlertCircle, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const CATEGORY_COLORS = {
    destination: "bg-blue-100 text-blue-800",
    activity: "bg-purple-100 text-purple-800",
    logistics: "bg-amber-100 text-amber-800",
    accommodation: "bg-green-100 text-green-800",
};

const CONFIDENCE_ICON = {
    high: <CheckCircle2 className="w-4 h-4 text-green-500" />,
    medium: <AlertCircle className="w-4 h-4 text-amber-500" />,
    low: <XCircle className="w-4 h-4 text-red-500" />,
};

export default function PlanVerifier({ itinerary }) {
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleVerify = async () => {
        setLoading(true);
        try {
            const planText = [
                itinerary.title || itinerary.destination,
                itinerary.destination,
                `${itinerary.duration} days, ${itinerary.travelers} travelers`,
                itinerary.notes || "",
                itinerary.ai_generated_json?.summary || "",
            ].filter(Boolean).join(". ");

            const res = await fetch(`${import.meta.env.VITE_API_URL}/public/verify-plan`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    itineraryText: planText,
                    destination: itinerary.destination,
                    duration: itinerary.duration,
                }),
            });

            if (!res.ok) throw new Error("Verification failed");
            const data = await res.json();
            setResult(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Auto-verify on mount
    useEffect(() => {
        handleVerify();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [itinerary.id]);

    return (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 animate-fade-in-up">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                {/* Left side: Header & Score inline */}
                <div className="flex items-center gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center border border-indigo-100">
                        <ShieldCheck className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                            AI Verified Plan
                        </h3>
                        {loading ? (
                            <div className="flex items-center gap-1.5 text-xs text-indigo-600 mt-1">
                                <Loader2 className="w-3 h-3 animate-spin" /> Verifying...
                            </div>
                        ) : result ? (
                            <div className="flex items-center gap-2 mt-1">
                                <span className={`text-sm font-bold ${result.overall_score >= 80 ? "text-green-600" : result.overall_score >= 60 ? "text-amber-600" : "text-red-600"}`}>
                                    {result.overall_score}/100 Score
                                </span>
                                <span className="text-xs text-slate-500 hidden sm:inline">•</span>
                                <span className="text-xs text-slate-500 truncate max-w-[250px]">{result.recommendation}</span>
                            </div>
                        ) : null}
                    </div>
                </div>

                {/* Right side: Keyword summary */}
                {result && result.keywords?.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2 sm:justify-end w-full sm:w-auto">
                        {result.keywords.slice(0, 3).map((kw, i) => (
                            <Badge key={i} variant="secondary" className={`text-[10px] px-2 py-0.5 font-medium flex items-center gap-1 bg-slate-50 border-slate-200 text-slate-700`}>
                                {CONFIDENCE_ICON[kw.confidence]}
                                {kw.term}
                            </Badge>
                        ))}
                        {result.keywords.length > 3 && (
                            <span className="text-xs text-slate-400 font-medium ml-1">+{result.keywords.length - 3} more</span>
                        )}
                    </div>
                )}
            </div>

            {/* Risk Flags - compact */}
            {result?.flags?.length > 0 && (
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-800 font-medium">
                        {result.flags.join(" • ")}
                    </p>
                </div>
            )}
        </div>
    );
}

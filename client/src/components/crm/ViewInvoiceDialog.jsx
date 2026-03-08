import React, { useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Printer, Mail, Share2, Settings, X } from "lucide-react";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { format } from "date-fns";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner"; // Ensure toast is imported

import api from "@/api/client";
import { useQuery } from "@tanstack/react-query";

import { useBranding } from "@/contexts/BrandingContext";

export default function ViewInvoiceDialog({ open, onClose, invoice: initialInvoice }) {
    const invoiceRef = useRef();
    const branding = useBranding();
    const [showSettings, setShowSettings] = useState(false);

    // Initialize with defaults from branding context
    const [customOptions, setCustomOptions] = useState({
        customFooter: branding.invoiceSettings?.customFooter || "Thank you for choosing us for your travel needs.",
        customNotes: "",
        paymentInstructions: branding.invoiceSettings?.paymentInstructions || ""
    });

    // Update defaults when branding loads
    React.useEffect(() => {
        if (branding.invoiceSettings) {
            setCustomOptions(prev => ({
                ...prev,
                customFooter: branding.invoiceSettings.customFooter || prev.customFooter,
                paymentInstructions: branding.invoiceSettings.paymentInstructions || prev.paymentInstructions
            }));
        }
    }, [branding.invoiceSettings]);

    const { data: invoice } = useQuery({
        queryKey: ['invoice', initialInvoice?.id],
        queryFn: () => api.entities.Invoice.get(initialInvoice.id),
        enabled: !!initialInvoice?.id,
        initialData: initialInvoice
    });

    if (!invoice || !open) return null;

    const handleDownloadPDF = async () => {
        try {
            const { downloadInvoicePDF } = await import("@/utils/pdfGenerator");
            // Pass full branding context + custom overrides
            await downloadInvoicePDF(invoice, branding.company_name, branding.logo_url, {
                ...branding,
                ...customOptions
            });
            toast.success("Invoice PDF downloaded");
        } catch (error) {
            console.error("PDF Download failed", error);
            toast.error("Failed to download PDF");
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-5xl p-0 overflow-hidden bg-slate-50 flex h-[90vh]">

                {/* SETTINGS SIDEBAR (Customization) */}
                {showSettings && (
                    <div className="w-80 bg-white border-r border-slate-200 p-6 flex flex-col gap-6 overflow-y-auto shrink-0 animate-in slide-in-from-left-48">
                        <div className="flex justify-between items-center">
                            <h3 className="font-bold text-lg text-slate-800">Customize PDF</h3>
                            <Button variant="ghost" size="icon" onClick={() => setShowSettings(false)}>
                                <X className="w-4 h-4" />
                            </Button>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Custom Notes</Label>
                                <Textarea
                                    placeholder="Add extra notes (e.g. Terms & Conditions)"
                                    value={customOptions.customNotes}
                                    onChange={(e) => setCustomOptions(prev => ({ ...prev, customNotes: e.target.value }))}
                                    className="text-xs h-24 resize-none"
                                />
                                <p className="text-[10px] text-slate-400">Replaces default invoice notes if set.</p>
                            </div>

                            <div className="space-y-2">
                                <Label>Payment Instructions</Label>
                                <Textarea
                                    placeholder="Wire Transfer Info..."
                                    value={customOptions.paymentInstructions}
                                    onChange={(e) => setCustomOptions(prev => ({ ...prev, paymentInstructions: e.target.value }))}
                                    className="text-xs h-24 resize-none"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Footer Text</Label>
                                <Textarea
                                    placeholder="Thank you message..."
                                    value={customOptions.customFooter}
                                    onChange={(e) => setCustomOptions(prev => ({ ...prev, customFooter: e.target.value }))}
                                    className="text-xs h-16 resize-none"
                                />
                            </div>
                        </div>

                        <div className="mt-auto">
                            <Button className="w-full" onClick={handleDownloadPDF}>
                                <Download className="w-4 h-4 mr-2" />
                                Download PDF
                            </Button>
                        </div>
                    </div>
                )}

                <div className="flex-1 flex flex-col h-full overflow-hidden">
                    {/* Toolbar */}
                    <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200 shrink-0">
                        <DialogTitle>View Invoice</DialogTitle>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => setShowSettings(!showSettings)} className={showSettings ? "bg-slate-100" : ""}>
                                <Settings className="w-4 h-4 mr-2" />
                                Customize
                            </Button>
                            <Button variant="default" size="sm" onClick={handleDownloadPDF}>
                                <Download className="w-4 h-4 mr-2" />
                                PDF
                            </Button>
                        </div>
                    </div>

                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto p-8 flex justify-center bg-slate-50">
                        {/* INVOICE PAPER */}
                        <div
                            ref={invoiceRef}
                            className="w-full max-w-[210mm] min-h-[297mm] bg-white shadow-2xl p-12 text-slate-800 relative"
                            style={{ borderTop: `8px solid ${branding.color}` }}
                        >
                            {/* Header */}
                            <div className="flex justify-between items-start mb-16">
                                <div>
                                    <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-2">INVOICE</h1>
                                    <p className="text-slate-500 font-medium">#{invoice.invoice_number}</p>
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl font-bold text-slate-900 mb-1">{branding.company_name || 'Travel Agency'}</div>
                                    <div className="text-sm text-slate-500">
                                        {[
                                            branding.addressLine1,
                                            branding.addressLine2
                                        ].filter(Boolean).map((line, i) => <div key={i}>{line}</div>)}
                                        <div>
                                            {branding.city}{branding.city && branding.state ? ', ' : ''}{branding.state} {branding.zip}
                                        </div>
                                        {branding.country && <div>{branding.country}</div>}
                                        {branding.phone && <div className="mt-1">{branding.phone}</div>}
                                        {branding.contact_email && <div>{branding.contact_email}</div>}
                                        {branding.ticoRegistrationNumber && (
                                            <div className="text-[10px] mt-2 font-semibold tracking-wider text-slate-400">
                                                TICO #{branding.ticoRegistrationNumber}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Bill To / Details Grid */}
                            <div className="grid grid-cols-2 gap-12 mb-16">
                                <div>
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Bill To</h3>
                                    <div className="text-lg font-semibold text-slate-900">{invoice.client?.full_name}</div>
                                    <div className="text-slate-500 mt-1">
                                        {invoice.client?.email}<br />
                                        {invoice.client?.phone}
                                    </div>
                                </div>
                                <div className="flex flex-col gap-4">
                                    <div className="flex justify-between border-b border-slate-100 pb-2">
                                        <span className="text-slate-500 font-medium">Issue Date</span>
                                        <span className="font-semibold text-slate-900">
                                            {invoice.issue_date ? format(new Date(invoice.issue_date), 'MMM d, yyyy') : '-'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-100 pb-2">
                                        <span className="text-slate-500 font-medium">Due Date</span>
                                        <span className="font-semibold text-slate-900">
                                            {invoice.due_date ? format(new Date(invoice.due_date), 'MMM d, yyyy') : '-'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-100 pb-2">
                                        <span className="text-slate-500 font-medium">Status</span>
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase ${invoice.status === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                                            invoice.status === 'overdue' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'
                                            }`}>
                                            {invoice.status}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Items Table */}
                            <div className="mb-12">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b-2 border-slate-900">
                                            <th className="text-left py-3 text-xs font-bold uppercase tracking-wider text-slate-900 w-[50%]">Description</th>
                                            <th className="text-center py-3 text-xs font-bold uppercase tracking-wider text-slate-900 w-[15%]">Qty</th>
                                            <th className="text-right py-3 text-xs font-bold uppercase tracking-wider text-slate-900 w-[15%]">Price</th>
                                            <th className="text-right py-3 text-xs font-bold uppercase tracking-wider text-slate-900 w-[20%]">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {invoice.invoice_items?.map((item, i) => (
                                            <tr key={i}>
                                                <td className="py-4 text-slate-700">
                                                    <p className="font-semibold text-slate-900">{item.description}</p>
                                                </td>
                                                <td className="py-4 text-center text-slate-600">{item.quantity}</td>
                                                <td className="py-4 text-right text-slate-600">${parseFloat(item.unit_price).toLocaleString()}</td>
                                                <td className="py-4 text-right font-medium text-slate-900">${(item.quantity * item.unit_price).toLocaleString()}</td>
                                            </tr>
                                        ))}
                                        {(!invoice.invoice_items || invoice.invoice_items.length === 0) && (
                                            <tr>
                                                <td colSpan={4} className="py-8 text-center text-slate-400 italic">No items listed.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Summary */}
                            <div className="flex justify-end mb-16">
                                <div className="w-1/2 space-y-3">
                                    <div className="flex justify-between text-slate-500">
                                        <span>Subtotal</span>
                                        <span>${(parseFloat(invoice.total || 0)).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-slate-500">
                                        <span>Tax (0%)</span>
                                        <span>$0.00</span>
                                    </div>
                                    <div className="flex justify-between pt-4 border-t border-slate-200 text-xl font-bold text-slate-900">
                                        <span>Total</span>
                                        <span>${(parseFloat(invoice.total || 0)).toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Footer / Notes */}
                            {invoice.notes && (
                                <div className="bg-slate-50 p-6 rounded-lg mb-8">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Notes & Terms</h4>
                                    <p className="text-sm text-slate-600 leading-relaxed">{invoice.notes}</p>
                                </div>
                            )}

                            <div className="text-center text-xs text-slate-400 mt-auto pt-8 border-t border-slate-100">
                                Thank you for your business!
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

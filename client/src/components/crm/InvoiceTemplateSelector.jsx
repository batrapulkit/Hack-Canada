import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Package,
    Plane,
    Hotel,
    Ship,
    Users,
    MessageSquare,
    FileText
} from "lucide-react";
import { motion } from "framer-motion";

// Invoice template definitions
const INVOICE_TEMPLATES = [
    {
        id: 'complete-package',
        name: 'Complete Package',
        description: 'Full trip with flights, hotel, and activities',
        icon: Package,
        color: 'from-blue-500 to-cyan-500',
        items: [
            { description: 'Round-trip Flights', quantity: 1, unit_price: 0, taxable: true },
            { description: 'Hotel Accommodation (per night)', quantity: 7, unit_price: 0, taxable: true },
            { description: 'Airport Transfers', quantity: 1, unit_price: 0, taxable: true },
            { description: 'Tours & Activities', quantity: 1, unit_price: 0, taxable: true },
        ]
    },
    {
        id: 'flights-only',
        name: 'Flights Only',
        description: 'Simple flight booking invoice',
        icon: Plane,
        color: 'from-purple-500 to-pink-500',
        items: [
            { description: 'Round-trip Flight Tickets', quantity: 1, unit_price: 0, taxable: true },
            { description: 'Seat Selection Fee', quantity: 1, unit_price: 0, taxable: true },
            { description: 'Baggage Fee', quantity: 1, unit_price: 0, taxable: false },
        ]
    },
    {
        id: 'hotel-resort',
        name: 'Hotel & Resort',
        description: 'Accommodation-focused booking',
        icon: Hotel,
        color: 'from-green-500 to-emerald-500',
        items: [
            { description: 'Resort Stay (per night)', quantity: 5, unit_price: 0, taxable: true },
            { description: 'All-Inclusive Package', quantity: 1, unit_price: 0, taxable: true },
            { description: 'Resort Fee', quantity: 1, unit_price: 0, taxable: false },
        ]
    },
    {
        id: 'cruise-package',
        name: 'Cruise Package',
        description: 'Cruise with port fees and extras',
        icon: Ship,
        color: 'from-orange-500 to-red-500',
        items: [
            { description: 'Cruise Fare (per person)', quantity: 2, unit_price: 0, taxable: true },
            { description: 'Port Fees & Taxes', quantity: 1, unit_price: 0, taxable: false },
            { description: 'Beverage Package', quantity: 2, unit_price: 0, taxable: true },
            { description: 'Shore Excursions', quantity: 1, unit_price: 0, taxable: true },
        ]
    },
    {
        id: 'group-travel',
        name: 'Group Travel',
        description: 'Multiple travelers with per-person pricing',
        icon: Users,
        color: 'from-indigo-500 to-purple-500',
        items: [
            { description: 'Flight + Hotel Package (per person)', quantity: 10, unit_price: 0, taxable: true },
            { description: 'Group Activities', quantity: 1, unit_price: 0, taxable: true },
            { description: 'Group Coordinator Fee', quantity: 1, unit_price: 0, taxable: true },
        ]
    },
    {
        id: 'consultation',
        name: 'Travel Consultation',
        description: 'Service fees and planning charges',
        icon: MessageSquare,
        color: 'from-teal-500 to-cyan-500',
        items: [
            { description: 'Travel Planning & Research', quantity: 1, unit_price: 0, taxable: true },
            { description: 'Itinerary Design', quantity: 1, unit_price: 0, taxable: true },
            { description: 'Booking Management Fee', quantity: 1, unit_price: 0, taxable: true },
        ]
    }
];

export default function InvoiceTemplateSelector({ open, onClose, onSelectTemplate }) {
    const handleSelectTemplate = (template) => {
        onSelectTemplate(template);
    };

    const handleSkip = () => {
        onSelectTemplate(null);
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-slate-900">
                        Choose an Invoice Template
                    </DialogTitle>
                    <p className="text-slate-600 mt-2">
                        Select a pre-configured template to get started quickly, or create a blank invoice from scratch.
                    </p>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                    {INVOICE_TEMPLATES.map((template, index) => {
                        const Icon = template.icon;
                        return (
                            <motion.div
                                key={template.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <Card
                                    className="cursor-pointer hover:shadow-xl transition-all duration-300 border-slate-200 hover:border-slate-300 group"
                                    onClick={() => handleSelectTemplate(template)}
                                >
                                    <CardHeader>
                                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${template.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300`}>
                                            <Icon className="w-6 h-6 text-white" />
                                        </div>
                                        <CardTitle className="text-lg font-semibold text-slate-900">
                                            {template.name}
                                        </CardTitle>
                                        <CardDescription className="text-sm text-slate-600">
                                            {template.description}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-1">
                                            <p className="text-xs font-medium text-slate-500 mb-2">Included items:</p>
                                            {template.items.map((item, idx) => (
                                                <div key={idx} className="flex items-start gap-2 text-xs text-slate-600">
                                                    <span className="text-slate-400 mt-0.5">•</span>
                                                    <span className="flex-1">{item.description}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        );
                    })}
                </div>

                <div className="flex items-center justify-between mt-6 pt-6 border-t border-slate-200">
                    <Button
                        variant="ghost"
                        onClick={handleSkip}
                        className="flex items-center gap-2 text-slate-600 hover:text-slate-900"
                    >
                        <FileText className="w-4 h-4" />
                        Create Blank Invoice
                    </Button>
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export { INVOICE_TEMPLATES };

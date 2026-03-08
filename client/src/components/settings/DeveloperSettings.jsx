
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Database, Loader2 } from "lucide-react";
import { toast } from "sonner";
import api from "@/api/client";

export default function DeveloperSettings() {
    const [loading, setLoading] = useState(false);

    // Helpers for procedural generation
    const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];
    const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
    const getRandomDate = (startOffset, endOffset) => new Date(Date.now() + getRandomInt(startOffset, endOffset) * 86400000).toISOString();

    const seedRevenueOnly = async () => {
        setLoading(true);
        try {
            toast.info("Generating increasing financial history...");

            const clientsRes = await api.get('/clients?limit=50');
            const clients = clientsRes.data.clients || [];

            if (!clients.length) {
                toast.error("Need clients to generate revenue.");
                setLoading(false);
                return;
            }

            // CLEANUP: Delete existing invoices to ensure a clean trend line
            try {
                const existing = await api.entities.Invoice.list();
                if (existing.length > 0) {
                    toast.info(`Cleaning up ${existing.length} old invoices...`);
                    await Promise.all(existing.map(inv => api.entities.Invoice.delete(inv.id)));
                }
            } catch (e) { console.warn("Cleanup failed", e); }

            let count = 0;
            const today = new Date();

            // Loop 6 months back to now
            for (let m = 5; m >= 0; m--) {
                // progressive volume: 2 invoices 6 months ago -> 12 invoices now
                const volume = 3 + ((5 - m) * 2);

                for (let k = 0; k < volume; k++) {
                    try {
                        const client = getRandom(clients);

                        // Progressive amounts: Base grows each month
                        const baseAmount = 2000 + ((5 - m) * 1000);
                        const amount = getRandomInt(baseAmount, baseAmount + 5000); // e.g., 2k-7k -> 7k-12k

                        // Calculate date in the specific month
                        const date = new Date(today.getFullYear(), today.getMonth() - m, getRandomInt(1, 28));
                        const dateStr = date.toISOString();

                        // Force recent ones to be pending mostly? No, user wants revenue inc. 
                        // Revenue usually implies PAID. Pending is future.
                        // So past months = PAID. Current month = Mix.
                        const isPaid = m > 0 || Math.random() > 0.4;

                        const inv = {
                            client_id: client.id,
                            total: amount,
                            status: isPaid ? 'paid' : 'pending',
                            due_date: dateStr,
                            created_at: dateStr,
                            items: [
                                { description: "Travel Services", quantity: 1, unit_price: amount }
                            ]
                        };

                        await api.entities.Invoice.create(inv);
                        count++;
                    } catch (e) { console.warn("Skip inv"); }
                }
            }

            toast.success(`Generated ${count} invoices with a growth trend!`);
            window.location.reload();

        } catch (e) {
            toast.error("Failed: " + e.message);
        } finally {
            setLoading(false);
        }
    };

    const seedLeadsOnly = async () => {
        setLoading(true);
        try {
            toast.info("Populating CRM pipeline...");

            const destinations = ["Bali", "Paris", "Tokyo", "New York", "London", "Dubai", "Rome", "Bangkok", "Barcelona", "Sydney", "Cape Town", "Cairo", "Istanbul", "Mumbai"];
            const firstNames = ["John", "Jane", "Michael", "Emily", "David", "Sarah", "Chris", "Anna", "James", "Elena", "Robert", "Lisa", "William", "Maria"];
            const lastNames = ["Smith", "Doe", "Johnson", "Brown", "Williams", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez"];

            // Ensure distribution across all stages
            const stages = ["new", "contacted", "qualified", "proposal", "negotiation"]; // "won" converts to client

            let count = 0;
            for (let k = 0; k < 15; k++) { // 15 random leads
                try {
                    const stage = stages[k % stages.length]; // Even spread
                    const lead = {
                        first_name: getRandom(firstNames),
                        last_name: getRandom(lastNames),
                        email: `lead_${Date.now()}_${k}@example.com`,
                        phone: `+1555${getRandomInt(100000, 999999)}`,
                        status: stage,
                        source: getRandom(["website", "referral", "social", "ad"]),
                        notes: `Interested in a trip to ${getRandom(destinations)}`,
                        created_at: getRandomDate(-30, 0)
                    };
                    await api.entities.Lead.create(lead);
                    count++;
                } catch (e) { }
            }

            toast.success(`Pipeline populated! Added ${count} leads across all stages.`);
            window.location.reload();
        } catch (e) {
            toast.error("Failed to seed leads: " + e.message);
        } finally {
            setLoading(false);
        }
    };

    const clearQuotes = async () => {
        // if (!confirm("Delete ALL quotes? This cannot be undone.")) return; // Skipped for debugging
        console.log("Starting FORCE delete...");
        setLoading(true);
        try {
            console.log("Listing quotes...");
            const quotes = await api.entities.Quote.list();
            console.log("Quotes found:", quotes);

            if (quotes.length === 0) {
                console.log("No quotes to delete.");
                toast.info("No quotes to delete.");
                setLoading(false);
                return;
            }

            toast.info(`Deleting ${quotes.length} quotes...`);
            console.log("Deleting...");
            await Promise.all(quotes.map(q => api.entities.Quote.delete(q.id)));
            console.log("Delete complete.");

            toast.success("All quotes deleted!");
            window.location.reload();
        } catch (e) {
            console.error("Delete failed:", e);
            toast.error("Cleanup failed: " + e.message);
        } finally {
            setLoading(false);
        }
    };

    const seedQuotesOnly = async () => {
        setLoading(true);
        try {
            toast.info("Generating high-value proposals...");

            const [clientsRes] = await Promise.all([
                api.get('/clients?limit=50')
            ]);
            const clients = clientsRes.data.clients || [];

            if (!clients.length) {
                toast.error("Need clients to generate quotes.");
                return;
            }

            let count = 0;
            const destinations = ["Maldives", "Paris", "Tokyo", "Swiss Alps", "Santorini", "Dubai", "New York", "Safari Kenya", "Bora Bora", "Rome"];

            // Generate 10 generic quotes (no itinerary link) with high values
            for (let i = 0; i < 10; i++) {
                try {
                    const client = getRandom(clients);
                    const dest = getRandom(destinations);

                    // High value range: $2,500 - $18,000
                    const totalAmount = getRandomInt(25, 180) * 100;

                    // Decide target status
                    const targetStatus = getRandom(['draft', 'sent', 'accepted']);

                    const quote = {
                        client_id: client.id,
                        total: totalAmount,
                        status: targetStatus, // Now accepted by backend
                        valid_until: getRandomDate(7, 30), // Valid for 7-30 days
                        notes: `Trip to ${dest} - All inclusive package`,
                        items: [
                            { description: `Flight and Hotel Package - ${dest}`, quantity: 1, unit_price: totalAmount }
                        ]
                    };

                    await api.entities.Quote.create(quote);
                    count++;
                } catch (e) {
                    console.error("Failed to create quote:", e);
                }
            }

            toast.success(`Generated ${count} high-value proposals!`);
            window.location.reload();

        } catch (e) {
            console.error("Seeding error:", e);
            toast.error("Failed: " + e.message);
        } finally {
            setLoading(false);
        }
    };


    const seedData = async () => {
        setLoading(true);
        try {
            // 1. Clients
            toast.info("Creating clients...");
            const createdClients = [];
            for (let i = 0; i < 5; i++) {
                try {
                    const client = await api.entities.Client.create({
                        name: `Client ${Date.now()}_${i}`,
                        email: `client${Date.now()}_${i}@test.com`,
                        phone: `+1555${Math.floor(Math.random() * 900000) + 100000}`
                    });
                    createdClients.push(client);
                } catch (e) { console.warn("Skip client"); }
            }

            if (createdClients.length === 0) throw new Error("No clients created");

            // 2. Suppliers
            toast.info("Adding suppliers...");
            const supplierNames = ["Global Air", "City Hotels", "Adventure Tours", "Sea Cruises", "Local Guides Inc"];
            const createdSuppliers = [];
            for (let name of supplierNames) {
                try {
                    const s = await api.entities.Supplier.create({
                        name: name,
                        contact_name: "Manager " + name.split(' ')[0],
                        email: `contact@${name.replace(/ /g, '').toLowerCase()}.com`,
                        category: ["airline", "hotel", "tour", "cruise", "transport"][Math.floor(Math.random() * 5)]
                    });
                    createdSuppliers.push(s);
                } catch (e) { console.warn("Skip supplier"); }
            }

            // 3. Itineraries
            toast.info("Drafting itineraries...");
            const createdItineraries = [];
            const destinations = ["Paris", "Tokyo", "New York", "Bali", "London"];

            for (let i = 0; i < 5; i++) {
                try {
                    const dest = destinations[i];
                    const itin = await api.entities.Itinerary.create({
                        client_id: createdClients[i % createdClients.length].id,
                        title: `Trip to ${dest}`,
                        destination: dest,
                        start_date: new Date().toISOString(),
                        end_date: new Date(Date.now() + 7 * 86400000).toISOString(),
                        status: ['draft', 'confirmed', 'completed'][Math.floor(Math.random() * 3)],
                        estimated_cost: Math.floor(Math.random() * 5000) + 1000
                    });
                    createdItineraries.push(itin);
                } catch (e) { console.warn("Skip itin"); }
            }

            // 4. Bookings (Linked to Itineraries)
            if (createdItineraries.length > 0 && createdSuppliers.length > 0) {
                toast.info("Booking flights & hotels...");
                for (let i = 0; i < 10; i++) {
                    try {
                        const itin = getRandom(createdItineraries);
                        const supplier = getRandom(createdSuppliers);
                        const cost = getRandomInt(200, 2000);

                        await api.entities.Booking.create({
                            itinerary_id: itin.id,
                            supplier_id: supplier.id,
                            service_type: supplier.category || 'other',
                            status: getRandom(['confirmed', 'pending', 'cancelled']),
                            cost: cost,
                            booking_date: new Date().toISOString(),
                            details: `Booking ref: ${getRandomInt(10000, 99999)}`
                        });
                    } catch (e) { console.warn("Skip booking", e); } // Log error for debug
                }
            }

            toast.success("Full seed complete!");
            window.location.reload();

        } catch (err) {
            toast.error("Seed failed: " + err.message);
            console.error(err);
        } finally {
            setLoading(false);
        }
    };


    return (
        <Card className="border-amber-200 bg-amber-50/30">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-800">
                    <Database className="w-5 h-5" />
                    Developer Tools
                </CardTitle>
                <CardDescription>
                    Populate your dashboard with realistic data.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                        <Button
                            onClick={async () => {
                                setLoading(true);
                                // Seed Bookings Logic
                                try {
                                    const itineraries = await api.entities.Itinerary.list();
                                    const suppliers = await api.entities.Supplier.list();

                                    if (!itineraries.length || !suppliers.length) {
                                        toast.error("Need itineraries and suppliers first.");
                                        setLoading(false);
                                        return;
                                    }

                                    toast.info("Booking...");
                                    let count = 0;
                                    for (let i = 0; i < 15; i++) {
                                        try {
                                            const itin = getRandom(itineraries);
                                            const sup = getRandom(suppliers);
                                            const cost = getRandomInt(150, 2500);

                                            await api.entities.Booking.create({
                                                itinerary_id: itin.id,
                                                supplier_id: sup.id,
                                                service_type: sup.category || 'other',
                                                status: getRandom(['confirmed', 'pending', 'cancelled']),
                                                cost: cost,
                                                booking_date: getRandomDate(-30, 30),
                                                details: `Ref: ${getRandomInt(10000, 99999)}`
                                            });
                                            count++;
                                        } catch (e) { }
                                    }
                                    toast.success(`Created ${count} bookings`);
                                    window.location.reload();
                                } catch (e) {
                                    toast.error("Failed");
                                } finally {
                                    setLoading(false);
                                }
                            }}
                            variant="outline"
                            className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                            disabled={loading}
                        >
                            Seed Bookings
                        </Button>
                        <Button
                            onClick={seedRevenueOnly}
                            variant="outline"
                            className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                            disabled={loading}
                        >
                            Seed Revenue
                        </Button>
                        <Button
                            onClick={seedLeadsOnly}
                            variant="outline"
                            className="bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100"
                            disabled={loading}
                        >
                            Seed Leads
                        </Button>
                        <Button
                            onClick={seedData}
                            disabled={loading}
                            variant="outline"
                            className="border-amber-300 text-amber-800 hover:bg-amber-100"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            {loading ? 'Full Seed' : 'Full Seed'}
                        </Button>
                        <Button
                            onClick={clearQuotes}
                            disabled={loading}
                            variant="destructive"
                            className="bg-red-50 text-red-600 hover:bg-red-100 border-red-200 border"
                        >
                            Clear Quotes (Direct)
                        </Button>
                        <Button
                            onClick={seedQuotesOnly}
                            disabled={loading}
                            variant="outline"
                            className="border-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-100"
                        >
                            Seed Quotes
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

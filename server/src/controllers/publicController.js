import { supabase } from "../config/supabase.js";
import { generateBrandedItineraryImage } from "../services/cloudinaryService.js";

// Mapping of destinations to high-quality Unsplash images
const DESTINATION_IMAGES = {
    'paris': 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=2073&auto=format&fit=crop',
    'london': 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?q=80&w=2070&auto=format&fit=crop',
    'new york': 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?q=80&w=2070&auto=format&fit=crop',
    'tokyo': 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?q=80&w=1994&auto=format&fit=crop',
    'dubai': 'https://images.unsplash.com/photo-1512453979798-5ea904ac66de?q=80&w=2009&auto=format&fit=crop',
    'bali': 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?q=80&w=2038&auto=format&fit=crop',
    'rome': 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?q=80&w=1996&auto=format&fit=crop',
    'santorini': 'https://images.unsplash.com/photo-1613395877344-13d4c79e4284?q=80&w=2070&auto=format&fit=crop',
    'maldives': 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?q=80&w=2065&auto=format&fit=crop',
    'switzerland': 'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?q=80&w=2070&auto=format&fit=crop',
    'thailand': 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?q=80&w=2039&auto=format&fit=crop',
    'pakistan': 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=2070&auto=format&fit=crop',
    'india': 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?q=80&w=2071&auto=format&fit=crop',
    'singapore': 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?q=80&w=2052&auto=format&fit=crop',
    'australia': 'https://images.unsplash.com/photo-1523482580672-f109ba8cb9be?q=80&w=2030&auto=format&fit=crop',
    'canada': 'https://images.unsplash.com/photo-1503614472-8c93d56e92ce?q=80&w=2011&auto=format&fit=crop',
    'default': 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=2070&auto=format&fit=crop'
};

const getDestinationImage = (destination) => {
    if (!destination) return DESTINATION_IMAGES.default;
    const key = destination.toLowerCase();
    for (const [city, url] of Object.entries(DESTINATION_IMAGES)) {
        if (key.includes(city)) return url;
    }
    return DESTINATION_IMAGES.default;
};

// =========================
// GET PUBLIC ITINERARY
// =========================
export const getPublicItinerary = async (req, res) => {
    try {
        const { id } = req.params;

        // Fetch itinerary with agency details
        const { data: itinerary, error } = await supabase
            .from("itineraries")
            .select(`
        *,
        agencies (
          id,
          agency_name,
          contact_email,
          logo_url
        )
      `)
            .eq("id", id)
            .single();

        if (error || !itinerary) {
            return res.status(404).json({ error: "Itinerary not found" });
        }

        // Generate branded hero image via Cloudinary
        const rawImageUrl = getDestinationImage(itinerary.destination);
        const brandedImageUrl = generateBrandedItineraryImage(
            rawImageUrl,
            itinerary.agencies?.agency_name || 'Triponic',
            itinerary.destination
        );

        // Return only necessary data
        const agencyData = {
            ...itinerary.agencies,
            logo_url: process.env.COMPANY_LOGO_URL || itinerary.agencies?.logo_url
        };

        return res.json({
            success: true,
            itinerary: {
                ...itinerary,
                hero_image_url: brandedImageUrl || rawImageUrl
            },
            agency: agencyData
        });
    } catch (err) {
        console.error("Public itinerary error:", err);
        return res.status(500).json({
            error: "Failed to fetch itinerary",
            details: err.message,
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
    }
};

// =========================
// CAPTURE WAITLIST
// =========================
export const captureWaitlist = async (req, res) => {
    try {
        const { full_name, name, email } = req.body;
        const leadName = full_name || name;

        if (!leadName || !email) {
            return res.status(400).json({ error: 'Name and email are required' });
        }

        const { error } = await supabase
            .from('waitlist')
            .insert({ full_name: leadName.trim(), email: email.trim().toLowerCase() });

        if (error) {
            // Unique constraint → already signed up
            if (error.code === '23505') {
                return res.status(200).json({ success: true, message: 'Already on the waitlist!' });
            }
            throw error;
        }

        return res.status(201).json({ success: true, message: 'Added to waitlist!' });
    } catch (err) {
        console.error('Waitlist capture error:', err);
        return res.status(500).json({ error: 'Failed to join waitlist', details: err.message });
    }
};


export const captureLead = async (req, res) => {
    try {
        const { agency_id, full_name, name, email, phone, destination, travel_date, budget, notes, source } = req.body;

        const leadName = full_name || name;

        if (!leadName || !email) {
            return res.status(400).json({ error: "Name and email are required" });
        }

        // Resolve agency_id (required NOT NULL in DB):
        // 1. From request body (e.g. widget embed)
        // 2. From environment variable (set LANDING_PAGE_AGENCY_ID in .env)
        // 3. Fallback: first agency in the DB (Triponic's own agency)
        let resolvedAgencyId = agency_id || process.env.LANDING_PAGE_AGENCY_ID || null;

        if (!resolvedAgencyId) {
            const { data: firstAgency, error: agencyErr } = await supabase
                .from('agencies')
                .select('id')
                .order('created_at', { ascending: true })
                .limit(1)
                .single();

            if (agencyErr || !firstAgency) {
                return res.status(500).json({ error: 'Could not resolve a default agency for this lead.' });
            }
            resolvedAgencyId = firstAgency.id;
        }

        const leadData = {
            agency_id: resolvedAgencyId,
            full_name: leadName,
            email,
            phone: phone || null,
            destination: destination || null,
            travel_dates: travel_date || null,
            budget: budget ? parseFloat(budget) : null,
            notes: notes || null,
            status: 'new',
            source: source || 'manual',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };

        const { data, error } = await supabase
            .from("leads")
            .insert(leadData)
            .select()
            .single();

        if (error) throw error;

        return res.status(201).json({ success: true, message: "Lead captured successfully" });
    } catch (err) {
        console.error("Lead capture error:", err);
        return res.status(500).json({ error: "Failed to capture lead", details: err.message });
    }
};

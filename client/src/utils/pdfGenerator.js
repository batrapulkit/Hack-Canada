// Utility for generating professional PDF itineraries with company branding
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { getDayImageUrl } from './imageUtils';

// Default Premium Color Palette (Fallbacks)
const DEFAULT_COLORS = {
    primary: [15, 23, 42],    // Slate-900 (Deep Navy/Black)
    secondary: [51, 65, 85],  // Slate-700 (Dark Grey)
    accent: [180, 83, 9],     // Amber-700 (Gold/Bronze)
    light: [248, 250, 252],   // Slate-50 (Off-white background)
    text: [30, 41, 59],       // Slate-800 (Main text)
    muted: [100, 116, 139],   // Slate-500 (Muted text)
    border: [226, 232, 240],  // Slate-200 (Light borders)
    gold: [212, 175, 55]      // Metallic Gold
};

// Helper to parse hex to RGB
const hexToRgb = (hex) => {
    if (!hex) return null;
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16)
    ] : null;
};

// Helper to load image safely (fetching as blob first to bypass CORS/taint issues)
const loadImage = async (url) => {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);
        const blob = await response.blob();

        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64data = reader.result;
                const img = new Image();
                img.src = base64data;
                img.onload = () => resolve(img);
                img.onerror = (e) => reject(new Error("Failed to load image from data URL"));
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (e) {
        console.warn("Image load failed", url, e);
        throw e;
    }
};

// Helper to title case strings
const toTitleCase = (str) => {
    if (!str) return '';
    return str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

/**
 * Generate PDF with Dynamic Branding
 * @param {Object} itinerary - The itinerary data
 * @param {Object} branding - { agencyName, logoUrl, brandColor, secondaryColor, website }
 */
export const generateItineraryPDF = async (itinerary, branding = {}) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 20;

    // Apply Branding Colors
    const primaryColor = hexToRgb(branding.brandColor) || DEFAULT_COLORS.primary;
    const secondaryColor = hexToRgb(branding.secondaryColor) || DEFAULT_COLORS.accent;

    // Theme Object
    const theme = {
        ...DEFAULT_COLORS,
        primary: primaryColor,
        accent: secondaryColor
    };

    const agencyName = branding.agencyName || 'Triponic';
    const logoUrl = branding.logoUrl || '';

    // --- COVER PAGE ---
    // 1. Background Image or Color
    const coverImageUrl = itinerary.image || "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=2021&auto=format&fit=crop";

    try {
        const coverImg = await loadImage(coverImageUrl);
        // Add image covering the top 2/3
        const imgHeight = pageHeight * 0.65;
        doc.addImage(coverImg, 'JPEG', 0, 0, pageWidth, imgHeight, undefined, 'FAST');

        // Overlay gradient/darken
        doc.setFillColor(0, 0, 0);
        doc.setGState(new doc.GState({ opacity: 0.4 }));
        doc.rect(0, 0, pageWidth, imgHeight, 'F');
        doc.setGState(new doc.GState({ opacity: 1 }));
    } catch (e) {
        console.warn("Failed to load cover image", e);
        doc.setFillColor(...theme.primary);
        doc.rect(0, 0, pageWidth, pageHeight * 0.65, 'F');
    }

    // Bottom section background
    doc.setFillColor(...theme.primary);
    doc.rect(0, pageHeight * 0.65, pageWidth, pageHeight * 0.35, 'F');

    // 2. Branding (Logo)
    if (logoUrl) {
        try {
            const logoImg = await loadImage(logoUrl);
            const maxWidth = 50;
            const maxHeight = 30;
            let w = logoImg.width;
            let h = logoImg.height;

            if (w > maxWidth) {
                h = (maxWidth / w) * h;
                w = maxWidth;
            }
            if (h > maxHeight) {
                w = (maxHeight / h) * w;
                h = maxHeight;
            }

            doc.addImage(logoImg, 'PNG', margin, margin, w, h);
        } catch (e) {
            console.warn("Failed to load logo", e);
        }
    }

    // 3. Title & Details (Overlaid on image or in bottom section)
    const textStartY = pageHeight * 0.65 + 20;

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(32);
    const title = itinerary.title || itinerary.destination || 'Luxury Escape';
    const titleLines = doc.splitTextToSize(title.toUpperCase(), pageWidth - (margin * 2));
    doc.text(titleLines, margin, textStartY);

    let currentY = textStartY + (titleLines.length * 12) + 10;

    // Subtitle
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(14);
    doc.setTextColor(...theme.accent); // Dynamic Accent
    doc.text((itinerary.destination || '').toUpperCase(), margin, currentY);

    currentY += 10;
    doc.setTextColor(200, 200, 200);
    doc.setFontSize(12);
    const durationText = itinerary.duration ? `${itinerary.duration} Days` : '';
    let dateText = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    if (itinerary.start_date) {
        dateText = new Date(itinerary.start_date).toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
    }
    doc.text(`${durationText} | ${dateText}`, margin, currentY);

    // Prepared For
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text(`Prepared for: ${itinerary.client?.full_name || 'Valued Client'}`, margin, pageHeight - margin - 10);

    // Agency Name (White-Label)
    doc.text(agencyName.toUpperCase(), pageWidth - margin, pageHeight - margin - 10, { align: 'right' });

    // Footer Watermark (White-Label - REMOVED Triponic)
    doc.setFontSize(8);
    doc.setTextColor(...theme.muted);
    // Use agency website if available, else just agency name
    const footerText = branding.website || agencyName;
    doc.text(footerText, pageWidth / 2, pageHeight - 10, { align: 'center' });


    // --- CONTENT PAGES ---
    const details = itinerary.ai_generated_json?.detailedPlan || itinerary.ai_generated_json || {};

    // Helper: Header
    const addHeader = (title) => {
        doc.setFillColor(...theme.light);
        doc.rect(0, 0, pageWidth, 25, 'F');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(...theme.muted);
        doc.text(agencyName.toUpperCase(), margin, 17);

        doc.setTextColor(...theme.accent);
        doc.text(title.toUpperCase(), pageWidth - margin, 17, { align: 'right' });

        doc.setDrawColor(...theme.border);
        doc.line(0, 25, pageWidth, 25);

        // Footer Watermark
        doc.setFontSize(8);
        doc.setTextColor(...theme.border);
        doc.text(footerText, pageWidth / 2, pageHeight - 10, { align: 'center' });

        return 40; // Return Y start position
    };

    // 1. Overview Page
    doc.addPage();
    let yPos = addHeader('Trip Overview');

    // Summary
    const summaryText = details.description || details.summary || details.overview || (typeof itinerary.ai_generated_content === 'string' ? itinerary.ai_generated_content : '');
    if (summaryText) {
        doc.setFont('times', 'italic');
        doc.setFontSize(14);
        doc.setTextColor(...theme.text);
        const lines = doc.splitTextToSize(summaryText, pageWidth - (margin * 2));
        doc.text(lines, margin, yPos);
        yPos += (lines.length * 7) + 15;
    }

    // Highlights / Stats
    // Calculate Total Client Price dynamically if items exist
    let totalClientPrice = 0;
    if (itinerary.itinerary_items && itinerary.itinerary_items.length > 0) {
        totalClientPrice = itinerary.itinerary_items.reduce((sum, item) => sum + (parseFloat(item.final_price) || 0), 0);
    }

    let costDisplay = 'TBD';
    if (totalClientPrice > 0) {
        costDisplay = `$${totalClientPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    } else if (itinerary.estimated_total_cost || itinerary.price) {
        costDisplay = itinerary.estimated_total_cost || itinerary.price;
    }

    const stats = [
        { label: 'Destination', value: itinerary.destination },
        { label: 'Duration', value: `${itinerary.duration || '?'} Days` },
        { label: 'Total Value', value: costDisplay }
    ];

    const statWidth = (pageWidth - (margin * 2)) / 3;
    stats.forEach((stat, i) => {
        const x = margin + (statWidth * i);
        doc.setFillColor(...theme.light);
        doc.roundedRect(x + 2, yPos, statWidth - 4, 25, 2, 2, 'F');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(...theme.muted);
        doc.text(stat.label.toUpperCase(), x + (statWidth / 2), yPos + 8, { align: 'center' });

        doc.setFontSize(11);
        doc.setTextColor(...theme.primary);
        doc.text(stat.value || '-', x + (statWidth / 2), yPos + 18, { align: 'center' });
    });
    yPos += 40;

    // Logistics
    if (details.flights || details.hotel) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.setTextColor(...theme.primary);
        doc.text('Logistics', margin, yPos);
        yPos += 10;

        const boxHeight = 45;

        if (details.hotel) {
            doc.setDrawColor(...theme.border);
            doc.roundedRect(margin, yPos, pageWidth - (margin * 2), boxHeight, 2, 2, 'S');

            doc.setFillColor(...theme.light);
            doc.rect(margin, yPos, 5, boxHeight, 'F');

            doc.setFontSize(10);
            doc.setTextColor(...theme.accent);
            doc.text('ACCOMMODATION', margin + 15, yPos + 10);

            doc.setFontSize(12);
            doc.setTextColor(...theme.text);
            doc.text(toTitleCase(details.hotel.name) || 'Recommended Accommodation', margin + 15, yPos + 20);

            doc.setFontSize(10);
            doc.setTextColor(...theme.muted);
            const hotelSub = [details.hotel.type, details.hotel.location]
                .filter(Boolean)
                .map(s => toTitleCase(s))
                .join(' • ') || "4-Star Standard • Centrally Located";
            doc.text(hotelSub, margin + 15, yPos + 30);

            yPos += boxHeight + 10;
        }

        if (details.flights) {
            doc.setDrawColor(...theme.border);
            doc.roundedRect(margin, yPos, pageWidth - (margin * 2), boxHeight, 2, 2, 'S');

            doc.setFillColor(...theme.light);
            doc.rect(margin, yPos, 5, boxHeight, 'F');

            doc.setFontSize(10);
            doc.setTextColor(...theme.accent);
            doc.text('FLIGHTS', margin + 15, yPos + 10);

            doc.setFontSize(12);
            doc.setTextColor(...theme.text);
            doc.text(toTitleCase(details.flights.airline) || 'Major International Carriers', margin + 15, yPos + 20);

            doc.setFontSize(10);
            doc.setTextColor(...theme.muted);
            const flightSub = [
                details.flights.departure ? `From ${toTitleCase(details.flights.departure)}` : null,
                details.flights.price
            ].filter(Boolean).join(' • ') || "Round Trip • Check Current Rates";
            doc.text(flightSub, margin + 15, yPos + 30);

            yPos += boxHeight + 10;
        }
    }

    // 2. Daily Itinerary
    const days = details.dailyPlan || details.daily || details.days || [];
    if (days.length > 0) {
        doc.addPage();
        yPos = addHeader('Daily Itinerary');

        for (const [index, day] of days.entries()) {
            // Check page break for the whole day block roughly
            if (yPos > pageHeight - 100) {
                doc.addPage();
                yPos = addHeader('Daily Itinerary (Cont.)');
            }

            // --- Day Header ---
            // Draw Day Badge
            doc.setFillColor(...theme.primary);
            doc.roundedRect(margin, yPos, 20, 20, 4, 4, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(8);
            doc.text('DAY', margin + 10, yPos + 7, { align: 'center' });
            doc.setFontSize(14);
            doc.text(`${day.day}`, margin + 10, yPos + 16, { align: 'center' });

            // Title
            doc.setTextColor(...theme.primary);
            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            doc.text(day.title || `Day ${day.day}`, margin + 30, yPos + 12);

            yPos += 25;

            // --- Image (Left) & Content (Right) ---
            const contentStartX = margin + 65; // Image width 60 + space 5
            const contentWidth = pageWidth - contentStartX - margin;
            const contextText = (day.title + " " + (day.description || "")).toLowerCase();

            try {
                // Try to load and add image
                const imgResult = await loadImage(getDayImageUrl(contextText, index, itinerary.id || itinerary._id || 'default'));
                doc.addImage(imgResult, 'JPEG', margin, yPos, 60, 60, undefined, 'FAST');

                // Add a border/shadow effect to image
                doc.setDrawColor(...theme.border);
                doc.roundedRect(margin, yPos, 60, 60, 2, 2, 'S');

            } catch (e) {
                // Fallback placeholder rect
                doc.setFillColor(...theme.light);
                doc.roundedRect(margin, yPos, 60, 60, 2, 2, 'F');
            }

            // Morning / Afternoon / Evening Sections
            let textY = yPos;
            const sections = [
                { title: 'Morning', content: day.morning },
                { title: 'Afternoon', content: day.afternoon },
                { title: 'Evening', content: day.evening }
            ];

            // If no structured sections, fallback to description
            if (!day.morning && !day.afternoon && !day.evening) {
                sections.push({ title: 'Highlights', content: day.description || day.summary });
            }

            sections.forEach(sec => {
                if (sec.content) {
                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(10);
                    doc.setTextColor(...theme.accent);
                    doc.text(sec.title.toUpperCase(), contentStartX, textY + 4);

                    doc.setFont('helvetica', 'normal');
                    doc.setFontSize(10);
                    doc.setTextColor(...theme.text);
                    const lines = doc.splitTextToSize(sec.content, contentWidth);
                    doc.text(lines, contentStartX, textY + 10);

                    textY += (lines.length * 5) + 15;
                }
            });

            // Ensure yPos moves down by at least the image height (60) or the text height
            const heightUsed = Math.max(60, textY - yPos);
            yPos += heightUsed + 15; // + padding
        }
    }

    // 3. Tips & Cuisine
    const tips = details.travel_tips || details.tips || [];
    const cuisine = details.local_cuisine || details.cuisine || [];

    if (tips.length > 0 || cuisine.length > 0) {
        if (yPos > pageHeight - 100) {
            doc.addPage();
            yPos = addHeader('Travel Guide');
        } else {
            yPos += 10;
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(16);
            doc.setTextColor(...theme.primary);
            doc.text('Travel Guide', margin, yPos);
            yPos += 15;
        }

        if (tips.length > 0) {
            const boxHeight = (tips.length * 8) + 20;
            if (yPos + boxHeight > pageHeight - margin) {
                doc.addPage();
                yPos = addHeader('Travel Guide');
            }

            doc.setFillColor(255, 251, 235); // Amber-50
            doc.roundedRect(margin, yPos, pageWidth - (margin * 2), boxHeight, 2, 2, 'F');

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(12);
            doc.setTextColor(...theme.accent);
            doc.text('Travel Tips', margin + 10, yPos + 10);

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
            doc.setTextColor(...theme.text);

            tips.forEach((tip, i) => {
                doc.text(`• ${tip}`, margin + 10, yPos + 20 + (i * 8));
            });

            yPos += boxHeight + 10;
        }

        if (cuisine.length > 0) {
            const cuisineText = cuisine.join(', ');
            const lines = doc.splitTextToSize(cuisineText, pageWidth - (margin * 2) - 20);
            const boxHeight = (lines.length * 5) + 30;

            if (yPos + boxHeight > pageHeight - margin) {
                doc.addPage();
                yPos = addHeader('Travel Guide');
            }

            doc.setFillColor(255, 247, 237); // Orange-50
            doc.roundedRect(margin, yPos, pageWidth - (margin * 2), boxHeight, 2, 2, 'F');

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(12);
            doc.setTextColor(...theme.accent);
            doc.text('Local Cuisine', margin + 10, yPos + 10);

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
            doc.setTextColor(...theme.text);

            doc.text(lines, margin + 10, yPos + 20);
        }
    }

    return doc;
};

// --- TEMPLATE RENDERERS ---

const renderMinimalInvoice = (doc, invoice, branding, theme, pageWidth, pageHeight) => {
    const margin = 20;
    let yPos = 20;

    // Minimal uses whitespace and simple typography

    // Header: Logo Left, Address Right
    if (branding.logoUrl) {
        // We'll trust the load happened or will fail silently
    }

    // Agency Name (Large, Modern)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(...theme.primary);
    doc.text(branding.agencyName?.toUpperCase() || 'AGENCY', margin, yPos);

    // Minimal "INVOICE"
    doc.setFontSize(10);
    doc.setTextColor(...theme.secondary);
    doc.text('INVOICE #' + (invoice.invoice_number || invoice.id.slice(0, 8)), pageWidth - margin, yPos, { align: 'right' });

    yPos += 10;

    // Address (Single Line or Block)
    doc.setFontSize(8);
    doc.setTextColor(...theme.muted);
    const addressLines = [
        branding.addressLine1,
        branding.addressLine2,
        `${branding.city || ''} ${branding.state || ''} ${branding.zip || ''}`,
        branding.country
    ].filter(Boolean).join(', ');

    doc.text(addressLines, margin, yPos);

    // Dates Right Aligned
    doc.text(`Issued: ${new Date(invoice.created_at).toLocaleDateString()}`, pageWidth - margin, yPos, { align: 'right' });
    yPos += 5;
    doc.text(`Due: ${invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : 'Upon Receipt'}`, pageWidth - margin, yPos, { align: 'right' });

    yPos += 20;

    // Bill To
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...theme.primary);
    doc.text('Bill To:', margin, yPos);
    yPos += 5;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...theme.text);
    doc.text(invoice.client?.full_name || 'Valued Client', margin, yPos);

    yPos += 20;

    // Simple Table (Lines only)
    doc.setDrawColor(...theme.border);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 5;

    // Headers
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...theme.muted);
    doc.text('DESCRIPTION', margin, yPos);
    doc.text('AMOUNT', pageWidth - margin, yPos, { align: 'right' });

    yPos += 3;
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 10;

    // Items
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...theme.text);

    const items = invoice.invoice_items || invoice.items || [];
    items.forEach(item => {
        const price = parseFloat(item.amount || (item.quantity * item.unit_price) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 });
        doc.text(item.description || 'Item', margin, yPos);
        doc.text(price, pageWidth - margin, yPos, { align: 'right' });
        yPos += 10;
    });

    // Total
    yPos += 5;
    doc.setDrawColor(...theme.primary);
    doc.setLineWidth(0.5);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 10;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Total', pageWidth - 60, yPos);
    doc.text(`$${parseFloat(invoice.total).toLocaleString()}`, pageWidth - margin, yPos, { align: 'right' });

    return doc;
};

const renderClassicInvoice = (doc, invoice, branding, theme, pageWidth, pageHeight) => {
    // Serif Fonts, Centered Header
    const margin = 20;
    let yPos = 30;

    doc.setFont('times', 'bold'); // Serif
    doc.setFontSize(28);
    doc.setTextColor(0, 0, 0); // Black for classic
    doc.text(branding.agencyName || 'AGENCY', pageWidth / 2, yPos, { align: 'center' });

    yPos += 10;
    doc.setFontSize(10);
    doc.setFont('times', 'normal');
    doc.text('INVOICE', pageWidth / 2, yPos, { align: 'center' });

    yPos += 20;

    return doc;
};

export const downloadItineraryPDF = async (itinerary, companyName, logoUrl = '', options = {}) => {
    // Construct branding object from args + options
    const branding = {
        agencyName: companyName,
        logoUrl: logoUrl,
        brandColor: options.brandColor,
        secondaryColor: options.secondaryColor,
        website: options.website
    };

    const doc = await generateItineraryPDF(itinerary, branding);
    const fileName = `${itinerary.destination || 'Itinerary'}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
};


// --- FINAL INVOICE GENERATOR (CLEAN PREMIUM LAYOUT) ---
export const generateInvoicePDF = async (invoice, branding = {}) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

    // 1. Resolve Style Overrides
    // Priority: Option arg > Invoice Setting in Branding > Global Branding > Default
    const primaryHex = (branding.invoiceSettings?.primaryColor) || branding.brandColor;
    const secondaryHex = (branding.invoiceSettings?.secondaryColor) || branding.secondaryColor;

    const primaryColor = hexToRgb(primaryHex) || DEFAULT_COLORS.primary;
    const secondaryColor = hexToRgb(secondaryHex) || DEFAULT_COLORS.accent;

    const theme = {
        ...DEFAULT_COLORS,
        primary: primaryColor,
        accent: secondaryColor,
        // Helper to convert array to hex for some uses if needed
        primaryHex: primaryHex || '#0f172a',
        secondaryHex: secondaryHex || '#334155'
    };

    const agencyName = branding.agencyName || 'Triponic';
    const templateStyle = branding.invoiceSettings?.templateStyle || 'standard';
    const backgroundImageUrl = branding.invoiceSettings?.backgroundImageUrl || '';

    // --- BACKGROUND IMAGE (LETTERHEAD) ---
    if (backgroundImageUrl) {
        try {
            const bgImg = await loadImage(backgroundImageUrl);
            doc.addImage(bgImg, 'JPEG', 0, 0, pageWidth, pageHeight);
        } catch (e) {
            console.warn("Failed to load invoice background", e);
        }
    }

    // --- TEMPLATE FACTORY ---
    if (templateStyle === 'minimal') {
        return renderMinimalInvoice(doc, invoice, branding, theme, pageWidth, pageHeight);
    } else if (templateStyle === 'classic') {
        return renderClassicInvoice(doc, invoice, branding, theme, pageWidth, pageHeight);
    }

    // --- LAYOUT: CLEAN PREMIUM (QuickBooks Style) ---

    // 1. Top Accent Strip
    doc.setFillColor(...theme.primary);
    doc.rect(0, 0, pageWidth, 5, 'F');

    // 2. Header Section
    let yPos = 25;

    // Logo (Top Left)
    let hasLogo = false;
    if (branding.logoUrl) {
        try {
            const logoImg = await loadImage(branding.logoUrl);
            const maxLogoW = 60;
            const maxLogoH = 25;
            const ratio = Math.min(maxLogoW / logoImg.width, maxLogoH / logoImg.height);
            doc.addImage(logoImg, 'PNG', 20, 15, logoImg.width * ratio, logoImg.height * ratio);
            hasLogo = true;
            yPos += Math.max(logoImg.height * ratio, 20) + 10;
        } catch (e) {
            console.warn("Logo load failed", e);
        }
    }

    // Company Name (if no logo, or below logo?) 
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(...theme.primary);
    const agencyNameY = hasLogo ? 15 + 25 + 8 : 20;
    doc.text(agencyName, 20, agencyNameY);

    // INVOICE / PROPOSAL Title (Top Right)
    const docTitle = (invoice.title || (invoice.invoice_number ? "INVOICE" : "PROPOSAL")).toUpperCase();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(32);
    // Dark Grey for professional look
    doc.setTextColor(80, 80, 80);
    doc.text(docTitle, pageWidth - 20, 30, { align: 'right' });

    // Agency Address / Contact (Left Column, below name)
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);

    let leftInfoY = agencyNameY + 6;
    const addLine = (text) => {
        if (!text) return;
        doc.text(text, 20, leftInfoY);
        leftInfoY += 5;
    };

    if (branding.addressLine1) addLine(branding.addressLine1);
    if (branding.addressLine2) addLine(branding.addressLine2);
    const cityLine = [toTitleCase(branding.city), branding.state, branding.zip].filter(Boolean).join(', ');
    if (cityLine) addLine(cityLine);
    if (branding.country) addLine(branding.country);

    leftInfoY += 2;
    if (branding.phone) addLine(`Phone: ${branding.phone}`);
    if (branding.website) addLine(branding.website);
    if (branding.ticoRegistrationNumber) {
        doc.setFont('helvetica', 'bold');
        addLine(`TICO #: ${branding.ticoRegistrationNumber}`);
        doc.setFont('helvetica', 'normal');
    }

    // 3. Grey Info Bar (Bill To / Details)
    const greyBarY = Math.max(leftInfoY, 60) + 10;
    const greyBarHeight = 40;

    doc.setFillColor(247, 247, 247); // Very light grey
    doc.rect(20, greyBarY, pageWidth - 40, greyBarHeight, 'F');

    // Columns inside Grey Bar
    const col1X = 25; // Bill To
    const col2X = pageWidth / 2 + 10; // Details

    // Col 1: Bill To
    let infoY = greyBarY + 8;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...theme.primary);
    doc.text(invoice.invoice_number ? "BILL TO" : "PREPARED FOR", col1X, infoY);

    infoY += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(50, 50, 50);
    doc.text(invoice.client?.full_name || invoice.client?.name || 'Valued Client', col1X, infoY);
    infoY += 5;
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(9);
    doc.text(invoice.client?.email || '', col1X, infoY);

    // Col 2: Invoice Details
    infoY = greyBarY + 8;
    const detailRow = (label, value) => {
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...theme.primary);
        doc.text(label, col2X, infoY);

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(50, 50, 50);
        doc.text(value, col2X + 35, infoY);
        infoY += 6;
    };

    if (invoice.invoice_number) {
        detailRow("Invoice No:", invoice.invoice_number);
    } else {
        detailRow("Quote ID:", invoice.id?.slice(0, 8));
    }

    detailRow("Date:", new Date(invoice.created_at || invoice.issue_date || Date.now()).toLocaleDateString());
    detailRow(invoice.invoice_number ? "Due Date:" : "Valid Until:",
        invoice.due_date ? new Date(invoice.due_date).toLocaleDateString()
            : (invoice.valid_until ? new Date(invoice.valid_until).toLocaleDateString() : 'Upon Receipt')
    );
    // Status
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...theme.primary);
    doc.text("Status:", col2X, infoY);

    const statusColor = invoice.status === 'paid' || invoice.status === 'accepted' ? [16, 185, 129] : invoice.status === 'overdue' ? [239, 68, 68] : [100, 116, 139];
    doc.setTextColor(...statusColor);
    doc.text((invoice.status || 'Draft').toUpperCase(), col2X + 35, infoY);


    // 4. Introduction (for Proposals)
    let tableY = greyBarY + greyBarHeight + 15;

    if (invoice.introduction) {
        doc.setFont('times', 'italic');
        doc.setFontSize(10);
        doc.setTextColor(...theme.text);
        const introLines = doc.splitTextToSize(invoice.introduction, pageWidth - 40);
        doc.text(introLines, 20, tableY);
        tableY += (introLines.length * 5) + 10;
    }

    // 5. Table Header
    // Draw top line
    doc.setDrawColor(220, 220, 220);
    doc.line(20, tableY, pageWidth - 20, tableY);

    tableY += 8;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...theme.primary);

    doc.text("DESCRIPTION", 25, tableY);
    doc.text("QTY", pageWidth - 60, tableY, { align: 'right' });
    doc.text("PRICE", pageWidth - 40, tableY, { align: 'right' });
    doc.text("AMOUNT", pageWidth - 25, tableY, { align: 'right' });

    tableY += 4;
    doc.line(20, tableY, pageWidth - 20, tableY); // Bottom header line

    // 6. Items
    tableY += 8;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 50, 50);
    doc.setFontSize(9);

    const items = invoice.invoice_items || invoice.items || invoice.quote_items || [];
    let grandTotal = 0;

    if (items.length > 0) {
        items.forEach((item) => {
            const desc = item.description || 'App Services';
            const qty = parseFloat(item.quantity || 1);
            const price = parseFloat(item.unit_price || item.amount || 0);
            const amount = qty * price;
            grandTotal += amount;

            const descLines = doc.splitTextToSize(desc, pageWidth - 90);
            doc.text(descLines, 25, tableY);

            doc.text(qty.toString(), pageWidth - 60, tableY, { align: 'right' });
            doc.text(price.toLocaleString(undefined, { minimumFractionDigits: 2 }), pageWidth - 40, tableY, { align: 'right' });
            doc.text(amount.toLocaleString(undefined, { minimumFractionDigits: 2 }), pageWidth - 25, tableY, { align: 'right' });

            const rowHeight = Math.max(descLines.length * 5, 8);
            tableY += rowHeight;

            if (tableY > pageHeight - 60) {
                doc.addPage();
                tableY = 20;
            }
        });
    } else {
        grandTotal = parseFloat(invoice.total || 0);
        doc.text(invoice.notes || "Services", 25, tableY);
        doc.text(grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 }), pageWidth - 25, tableY, { align: 'right' });
        tableY += 10;
    }

    // 6. Footer / Totals
    tableY += 5;
    doc.line(pageWidth / 2, tableY, pageWidth - 20, tableY);
    tableY += 10;

    const totalLabelX = pageWidth - 60;
    const totalValX = pageWidth - 25;

    // Subtotal
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text("Subtotal", totalLabelX, tableY, { align: 'right' });
    doc.setTextColor(50, 50, 50);
    doc.text(grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 }), totalValX, tableY, { align: 'right' });

    // Tax
    const taxRate = parseFloat(invoice.tax_rate || 0);
    if (taxRate > 0) {
        tableY += 6;
        const taxVal = grandTotal * (taxRate / 100);
        grandTotal += taxVal;

        doc.setTextColor(100, 100, 100);
        doc.text(`Tax (${taxRate}%)`, totalLabelX, tableY, { align: 'right' });
        doc.setTextColor(50, 50, 50);
        doc.text(taxVal.toLocaleString(undefined, { minimumFractionDigits: 2 }), totalValX, tableY, { align: 'right' });
    }

    // Total
    tableY += 10;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(...theme.primary);
    doc.text("Total", totalLabelX, tableY, { align: 'right' });
    doc.text(`$${grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, totalValX, tableY, { align: 'right' });

    // Payment Instructions / Notes / Terms
    const notesY = tableY + 20;
    let currentNoteY = notesY;

    // Terms (Header Text from Quote)
    if (invoice.header_text) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...theme.primary);
        doc.text("Terms & Conditions", 25, currentNoteY);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);

        const termLines = doc.splitTextToSize(invoice.header_text, pageWidth - 50);
        doc.text(termLines, 25, currentNoteY + 6);
        currentNoteY += (termLines.length * 5) + 15;
    }

    if (branding.paymentInstructions || invoice.notes) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...theme.primary);
        doc.text("Payment Instructions / Notes", 25, currentNoteY);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);

        const pi = branding.paymentInstructions || "";
        const notes = invoice.notes ? `\n${invoice.notes}` : "";
        const combined = (pi + notes).trim();

        const noteLines = doc.splitTextToSize(combined, pageWidth - 100);
        doc.text(noteLines, 25, currentNoteY + 6);
    }

    // Footer Legal
    const footerY = pageHeight - 15;
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    // Use quote footer_text if available, else branding footer
    const footerTxt = invoice.footer_text || branding.customFooter || "Thank you for your business.";
    doc.text(footerTxt, pageWidth / 2, footerY, { align: 'center' });

    return doc;
};

// Backwards compatibility for invoices
// Backwards compatibility for invoices
export const downloadInvoicePDF = async (invoice, companyNameOrBranding, logoUrl = '', options = {}) => {
    let branding;

    // Polymorphic: Accept separate args OR a single branding object
    if (typeof companyNameOrBranding === 'object' && companyNameOrBranding !== null) {
        branding = companyNameOrBranding;
    } else {
        branding = {
            agencyName: companyNameOrBranding,
            logoUrl: logoUrl,
            brandColor: options.brandColor,
            secondaryColor: options.secondaryColor,
            customFooter: options.customFooter,
            customNotes: options.customNotes,
            paymentInstructions: options.paymentInstructions,

            addressLine1: options.addressLine1,
            addressLine2: options.addressLine2,
            city: options.city,
            state: options.state,
            zip: options.zip,
            country: options.country,
            phone: options.phone,
            ticoRegistrationNumber: options.ticoRegistrationNumber,

            // Pass full invoice settings if available, or construct from individual options
            invoiceSettings: options.invoiceSettings || {
                templateStyle: options.templateStyle,
                primaryColor: options.primaryColor,
                backgroundImageUrl: options.backgroundImageUrl
            }
        };
    }

    const doc = await generateInvoicePDF(invoice, branding);
    const fileName = `Invoice_${invoice.invoice_number || invoice.id.slice(0, 8)}.pdf`;
    doc.save(fileName);
};

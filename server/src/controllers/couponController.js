import { supabase } from '../config/supabase.js';

/* Redeem a coupon code */
export const redeemCoupon = async (req, res) => {
    try {
        const { code } = req.body;
        const { agency_id } = req.user;

        if (!code) return res.status(400).json({ error: 'Coupon code is required' });

        // 1. Find Coupon
        const { data: coupon, error: couponError } = await supabase
            .from('coupons')
            .select('*')
            .eq('code', code.toUpperCase()) // Case insensitive code
            .eq('is_active', true)
            .single();

        if (couponError || !coupon) {
            return res.status(404).json({ error: 'Invalid or inactive coupon code.' });
        }

        // 2. Check Global Limit
        if (coupon.max_uses > 0 && coupon.used_count >= coupon.max_uses) {
            return res.status(400).json({ error: 'This coupon has reached its maximum usage limit.' });
        }

        // 3. Check if agency already used it
        const { data: existing, error: checkError } = await supabase
            .from('agency_coupons')
            .select('id')
            .eq('agency_id', agency_id)
            .eq('coupon_id', coupon.id)
            .single();

        if (existing) {
            return res.status(400).json({ error: 'You have already redeemed this coupon.' });
        }

        // 4. REDEEM: Transaction (Conceptually)

        // A. Record Usage
        const { error: recordError } = await supabase
            .from('agency_coupons')
            .insert({ agency_id, coupon_id: coupon.id });

        if (recordError) throw recordError;

        // B. Increment Coupon Global Count
        await supabase.rpc('increment_coupon_usage', { coupon_id: coupon.id }); // Assuming RPC or simple update 
        // Fallback: simple update if rpc not exists
        await supabase.from('coupons').update({ used_count: coupon.used_count + 1 }).eq('id', coupon.id);

        // C. Add Credits to Agency
        // Get current credits first
        const { data: agency } = await supabase.from('agencies').select('itinerary_credits').eq('id', agency_id).single();
        const currentCredits = agency?.itinerary_credits || 0;
        const newCredits = currentCredits + coupon.credits_value;

        const { error: updateError } = await supabase
            .from('agencies')
            .update({ itinerary_credits: newCredits })
            .eq('id', agency_id);

        if (updateError) throw updateError;

        return res.json({
            success: true,
            message: `Coupon redeemed! Added ${coupon.credits_value} credits.`,
            new_credits: newCredits
        });

    } catch (err) {
        console.error('Coupon redemption error:', err);
        return res.status(500).json({ error: 'Redemption failed', details: err.message });
    }
};

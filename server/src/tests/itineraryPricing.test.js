import { calculateItemPrice, validatePricing, calculateItineraryTotals } from '../services/pricingService.js';

describe('Itinerary Pricing Logic', () => {

    // 1. Calculation Tests
    describe('calculateItemPrice', () => {
        test('calculates percentage markup correctly', () => {
            const cost = 100;
            const markup = 10; // 10%
            const price = calculateItemPrice(cost, 'percentage', markup);
            expect(price).toBe(110.00);
        });

        test('calculates flat fee markup correctly', () => {
            const cost = 100;
            const markup = 50; // $50 flat
            const price = calculateItemPrice(cost, 'flat', markup);
            expect(price).toBe(150.00);
        });

        test('handles decimal values correctly', () => {
            const cost = 33.33;
            const markup = 10; // 10% -> 3.333
            const price = calculateItemPrice(cost, 'percentage', markup);
            // 33.33 * 1.1 = 36.663 -> 36.66
            expect(price).toBe(36.66);
        });

        test('handles zero values', () => {
            expect(calculateItemPrice(0, 'percentage', 10)).toBe(0);
            expect(calculateItemPrice(100, 'percentage', 0)).toBe(100);
        });
    });

    // 2. Validation Tests
    describe('validatePricing', () => {
        test('rejects negative cost', () => {
            const item = { cost_price: -10, markup_type: 'percentage', markup_value: 10 };
            const result = validatePricing(item);
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Cost price cannot be negative');
        });

        test('rejects invalid markup type', () => {
            const item = { cost_price: 100, markup_type: 'random', markup_value: 10 };
            const result = validatePricing(item);
            expect(result.isValid).toBe(false);
            // Check that at least one error string contains "Invalid markup type"
            expect(result.errors.some(e => e.includes('Invalid markup type'))).toBe(true);
        });

        test('calculates and returns valid price on success', () => {
            const item = { cost_price: 200, markup_type: 'flat', markup_value: 20 };
            const result = validatePricing(item);
            expect(result.isValid).toBe(true);
            expect(result.calculatedPrice).toBe(220);
        });
    });

    // 3. Totals Aggregation
    describe('calculateItineraryTotals', () => {
        test('sums up multiple items correctly', () => {
            const items = [
                { cost_price: 100, final_price: 110 }, // Profit 10
                { cost_price: 50, final_price: 75 }    // Profit 25
            ];
            const totals = calculateItineraryTotals(items);

            expect(totals.totalCost).toBe(150);
            expect(totals.totalPrice).toBe(185);
            expect(totals.totalProfit).toBe(35);
        });

        test('handles empty list', () => {
            const totals = calculateItineraryTotals([]);
            expect(totals.totalCost).toBe(0);
            expect(totals.totalPrice).toBe(0);
        });
    });

});

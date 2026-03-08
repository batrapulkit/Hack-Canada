// server/src/services/pricingService.js

export const VALIDATION_RULES = {
    MIN_COST: 0,
    MARKUP_TYPES: ['percentage', 'flat'],
};

export const calculateItemPrice = (cost, markupType, markupValue) => {
    const costNum = parseFloat(cost) || 0;
    const markupNum = parseFloat(markupValue) || 0;

    let finalPrice = costNum;

    if (markupType === 'percentage') {
        // e.g. 20% markup = cost * 1.20
        // OR Margin based? usually Markup = Cost * (1 + %)
        finalPrice = costNum * (1 + (markupNum / 100));
    } else if (markupType === 'flat') {
        finalPrice = costNum + markupNum;
    }

    return parseFloat(finalPrice.toFixed(2));
};

export const validatePricing = (item) => {
    const errors = [];

    if (item.cost_price < 0) {
        errors.push('Cost price cannot be negative');
    }

    if (!VALIDATION_RULES.MARKUP_TYPES.includes(item.markup_type)) {
        errors.push(`Invalid markup type. Must be one of: ${VALIDATION_RULES.MARKUP_TYPES.join(', ')}`);
    }

    if (item.markup_value < 0) {
        errors.push('Markup value cannot be negative');
    }

    // Safety check: Price should usually be >= Cost (unless intentional loss leader)
    const calculated = calculateItemPrice(item.cost_price, item.markup_type, item.markup_value);
    if (calculated < item.cost_price) {
        errors.push('Final price is less than cost price');
    }

    return {
        isValid: errors.length === 0,
        errors,
        calculatedPrice: calculated
    };
};

export const calculateItineraryTotals = (items) => {
    return items.reduce((acc, item) => {
        const itemPrice = item.final_price || calculateItemPrice(item.cost_price, item.markup_type, item.markup_value);
        const itemCost = parseFloat(item.cost_price) || 0;

        return {
            totalPrice: acc.totalPrice + itemPrice,
            totalCost: acc.totalCost + itemCost,
            totalProfit: acc.totalProfit + (itemPrice - itemCost)
        };
    }, { totalPrice: 0, totalCost: 0, totalProfit: 0 });
};

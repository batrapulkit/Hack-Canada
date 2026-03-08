// server/src/services/stateMachine.js

const STATE_TRANSITIONS = {
    LEAD: {
        'new': ['contacted', 'qualified', 'proposal', 'won', 'lost'],
        'contacted': ['new', 'qualified', 'proposal', 'won', 'lost'],
        'qualified': ['new', 'contacted', 'proposal', 'won', 'lost'],
        'proposal': ['new', 'contacted', 'qualified', 'won', 'lost', 'negotiation'],
        'negotiation': ['new', 'contacted', 'qualified', 'proposal', 'won', 'lost'],
        'won': ['converted', 'new', 'contacted', 'qualified', 'proposal'], // Allow undoing won
        'lost': ['new', 'contacted', 'qualified', 'proposal'], // Reactivation
        'converted': []
    },
    ITINERARY: {
        'draft': ['proposed', 'archived'],
        'proposed': ['confirmed', 'draft', 'archived'],
        'confirmed': ['booked'],
        'booked': ['completed', 'cancelled'],
        'completed': [],
        'cancelled': ['draft'],
        'archived': ['draft']
    },
    QUOTE: {
        'draft': ['sent', 'cancelled'],
        'sent': ['accepted', 'rejected', 'expired'],
        'accepted': ['invoiced'],
        'rejected': ['draft', 'cancelled'],
        'expired': ['draft', 'cancelled'],
        'invoiced': [],
        'cancelled': []
    },
    INVOICE: {
        'draft': ['sent', 'void'],
        'sent': ['paid', 'overdue', 'void', 'partial'],
        'partial': ['paid', 'overdue', 'void'],
        'paid': ['refunded'],
        'overdue': ['paid', 'void', 'sent'], // sent = reminder
        'void': [],
        'refunded': []
    }
};

export const validateTransition = (entityType, fromState, toState) => {
    const entityTransitions = STATE_TRANSITIONS[entityType.toUpperCase()];
    if (!entityTransitions) {
        throw new Error(`Unknown entity type: ${entityType}`);
    }

    // Allow staying in same state (idempotency)
    if (fromState === toState) return true;

    const allowedNextStates = entityTransitions[fromState] || [];

    if (!allowedNextStates.includes(toState)) {
        throw new Error(`Invalid transition for ${entityType}: '${fromState}' -> '${toState}'. Allowed: [${allowedNextStates.join(', ')}]`);
    }

    return true;
};

export const getNextStates = (entityType, currentState) => {
    const entityTransitions = STATE_TRANSITIONS[entityType.toUpperCase()];
    return entityTransitions ? (entityTransitions[currentState] || []) : [];
};

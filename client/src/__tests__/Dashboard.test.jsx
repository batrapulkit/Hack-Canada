import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import Dashboard from '../pages/Dashboard'; // Corrected path
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock dependencies
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: false,
        },
    },
});

vi.mock('../contexts/AuthContext', async () => {
    return {
        useAuth: () => ({
            user: { name: 'Test User', email: 'test@example.com' },
            agency: { agency_name: 'Test Agency' }
        })
    };
});

describe.skip('Dashboard Component', () => {
    it('renders dashboard overview', () => {
        render(
            <QueryClientProvider client={queryClient}>
                <BrowserRouter>
                    <Dashboard />
                </BrowserRouter>
            </QueryClientProvider>
        );

        expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
    });
});

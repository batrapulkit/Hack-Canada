import { jest } from '@jest/globals';

const mockSupabase = {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
};

jest.unstable_mockModule('@supabase/supabase-js', () => ({
    createClient: jest.fn(() => mockSupabase)
}));

const mockScanQueue = jest.fn().mockResolvedValue([]);
jest.unstable_mockModule('../src/services/amadeusEnterpriseService.js', () => ({
    default: jest.fn().mockImplementation(() => ({
        authenticate: jest.fn().mockResolvedValue('token'),
        scanQueue: mockScanQueue,
        retrieveBooking: jest.fn(),
        removeFromQueue: jest.fn(),
        signOut: jest.fn(),
    }))
}));

jest.unstable_mockModule('../src/services/bookingImportService.js', () => ({
    importBookingData: jest.fn()
}));

const { forceSync } = await import('../src/cron/pnrSync.js');

describe('PNR Sync Logic Verification', () => {

    it('should include filters for API keys in the Supabase query', async () => {
        mockSupabase.select.mockResolvedValueOnce({
            data: [
                { id: 1, agency_id: 'a1', amadeus_client_id: 'key', amadeus_client_secret: 'secret' }
            ],
            error: null
        });

        await forceSync();

        expect(mockSupabase.from).toHaveBeenCalledWith('agency_gds_config');
        expect(mockSupabase.eq).toHaveBeenCalledWith('sync_status', 'active');
        // Expect 4 neq calls: client_id null, client_secret null, client_id empty, client_secret empty
        expect(mockSupabase.neq).toHaveBeenCalledWith('amadeus_client_id', null);
        expect(mockSupabase.neq).toHaveBeenCalledWith('amadeus_client_secret', null);
        expect(mockSupabase.neq).toHaveBeenCalledWith('amadeus_client_id', '');
        expect(mockSupabase.neq).toHaveBeenCalledWith('amadeus_client_secret', '');
    });
});

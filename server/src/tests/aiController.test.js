import { jest } from '@jest/globals';

// Mock dependencies BEFORE importing the module
const mockGenerateContent = jest.fn();
const mockGetModel = jest.fn(() => ({
    generateContent: mockGenerateContent
}));

jest.unstable_mockModule('../config/gemini.js', () => ({
    getModel: mockGetModel,
    getSearchEnabledModel: mockGetModel // Reuse mock
}));

jest.unstable_mockModule('../services/resortService.js', () => ({
    searchResorts: jest.fn().mockResolvedValue([])
}));

jest.unstable_mockModule('../config/supabase.js', () => ({
    supabase: {
        from: jest.fn(() => ({
            select: jest.fn(() => ({
                eq: jest.fn(() => ({
                    limit: jest.fn(() => ({ data: [] }))
                }))
            })),
            insert: jest.fn(() => ({
                select: jest.fn(() => ({ single: jest.fn(() => ({ data: {}, error: null })) }))
            }))
        }))
    }
}));

jest.unstable_mockModule('fs', () => ({
    default: { appendFileSync: jest.fn() },
    appendFileSync: jest.fn()
}));

jest.unstable_mockModule('path', () => ({
    default: {
        dirname: () => 'mock/dir',
        join: () => 'mock/path',
        resolve: () => 'mock/resolve'
    },
    dirname: () => 'mock/dir',
    join: () => 'mock/path',
    resolve: () => 'mock/resolve'
}));

jest.unstable_mockModule('url', () => ({
    fileURLToPath: () => 'mock/file/path'
}));

jest.unstable_mockModule('../services/emailService.js', () => ({ sendEmail: jest.fn() }));
jest.unstable_mockModule('../services/pdfService.js', () => ({ generateInvoicePDF: jest.fn() }));

// Import the module AFTER mocking
const { detectIntent, createDayWiseItinerary, parseLeadFromText } = await import('../controllers/aiController.js');


describe('AI Controller Logic', () => {
    beforeEach(() => {
        mockGenerateContent.mockClear();
    });

    describe('detectIntent', () => {
        it('should extract business trip details correctly', async () => {
            const mockResponse = {
                response: {
                    text: () => JSON.stringify({
                        intent: 'itinerary',
                        destination: 'London',
                        duration: '3 days',
                        trip_type: 'business',
                        preferences: 'stay near Canary Wharf',
                        travelers: '1',
                        budget: 'luxury'
                    }),
                    usageMetadata: {}
                }
            };
            mockGenerateContent.mockResolvedValue(mockResponse);

            const input = "Create a 3-day business trip to London, stay near Canary Wharf, budget luxury";
            const result = await detectIntent(input);

            expect(result.trip_type).toBe('business');
            expect(result.preferences).toContain('Canary Wharf');
            expect(result.budget).toBe('luxury');
            expect(result.intent).toBe('itinerary');
        });

        it('should extract family trip details correctly with specific travelers', async () => {
            const mockResponse = {
                response: {
                    text: () => JSON.stringify({
                        intent: 'itinerary',
                        destination: 'Orlando',
                        duration: '1 week',
                        trip_type: 'family',
                        travelers: 'Kids aged 8 and 10',
                        budget: 'moderate'
                    }),
                    usageMetadata: {}
                }
            };
            mockGenerateContent.mockResolvedValue(mockResponse);

            const input = "1 week family trip to Disney World Orlando, kids aged 8 and 10";
            const result = await detectIntent(input);

            expect(result.travelers).toBe('Kids aged 8 and 10');
        });

        it('should extract client name correctly', async () => {
            const mockResponse = {
                response: {
                    text: () => JSON.stringify({
                        intent: 'itinerary',
                        client_name: 'Client A',
                        destination: 'Paris',
                        duration: '5 days'
                    }),
                    usageMetadata: {}
                }
            };
            mockGenerateContent.mockResolvedValue(mockResponse);

            const input = "Create a 5-day trip to Paris for Client A";
            const result = await detectIntent(input);

            expect(result.client_name).toBe('Client A');
            expect(result.destination).toBe('Paris');
        });
    });

    describe('createDayWiseItinerary', () => {
        it('should include new fields in the prompt', async () => {
            const mockResponse = {
                response: {
                    text: () => JSON.stringify({
                        content: "Sure, here is a trip.",
                        detailedPlan: {
                            destination: "London",
                            duration: "3 days",
                            dailyPlan: []
                        }
                    }),
                    usageMetadata: {}
                }
            };
            mockGenerateContent.mockResolvedValue(mockResponse);

            const params = {
                destination: 'London',
                duration: '3 days',
                interests: ['Tech'],
                travelers: '2 adults',
                budget: 'high',
                client: { address: 'NY' },
                trip_type: 'business',
                preferences: 'Near subway'
            };

            await createDayWiseItinerary(params);

            // Verify the prompt sent to Gemini contains our new fields
            const callArgs = mockGenerateContent.mock.calls[0][0];
            expect(callArgs).toContain('Trip Type: business');
            expect(callArgs).toContain('Specific Preferences: Near subway');
            expect(callArgs).toContain('Travelers: 2 adults');
        });

        it('should handle null client gracefully', async () => {
            const mockResponse = {
                response: {
                    text: () => JSON.stringify({
                        content: "Trip for no client.",
                        detailedPlan: {
                            destination: "Paris",
                            duration: "2 days",
                            dailyPlan: []
                        }
                    }),
                    usageMetadata: {}
                }
            };
            mockGenerateContent.mockResolvedValue(mockResponse);

            const params = {
                destination: 'Paris',
                duration: '2 days',
                client: null
            };

            await createDayWiseItinerary(params);

            const callArgs = mockGenerateContent.mock.calls[0][0]; // 1st call in this isolation
            expect(callArgs).toContain('User City: unknown');
            expect(callArgs).toContain('Destination: Paris');
        });
    });

    describe('parseLeadFromText', () => {
        let req, res;

        // Import parseLeadFromText dynamically since it's not in the initial destructure
        // But since we are inside a module that we already imported dynamically, we can just grab it
        // However, the cleanest way is just to add it to the import destructuring at the top, but since we are replacing the end of file,
        // let's re-import or assume we modify the top.
        // Actually, better strategy: Modify the import line at the top first, then add this block.
        // But replacing the whole file content is Safer.
        // Wait, I can just use one tool call to replace the import line, and another to append the test.
    });

    describe('parseLeadFromText', () => {
        it('should extract lead info from text', async () => {
            const req = { body: { text: "Details: John Doe, john@example.com, trip to Paris for $5000" } };
            const res = {
                json: jest.fn(),
                status: jest.fn().mockReturnThis()
            };

            const mockResponse = {
                response: {
                    text: () => JSON.stringify({
                        full_name: "John Doe",
                        email: "john@example.com",
                        destination: "Paris",
                        budget_max: 5000
                    }),
                    usageMetadata: {}
                }
            };
            mockGenerateContent.mockResolvedValue(mockResponse);

            await parseLeadFromText(req, res);

            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                data: expect.objectContaining({
                    full_name: "John Doe",
                    destination: "Paris",
                    budget_max: 5000
                })
            }));
        });
    });
});

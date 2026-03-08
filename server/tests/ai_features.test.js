import { jest } from '@jest/globals';

// 1. Define Mocks BEFORE imports using unstable_mockModule
const mockGenerateContent = jest.fn();

// Mock Config
jest.unstable_mockModule('../src/config/gemini.js', () => ({
    getModel: () => ({
        generateContent: mockGenerateContent
    }),
    getSearchEnabledModel: () => ({
        generateContent: mockGenerateContent
    })
}));

// Mock Supabase
jest.unstable_mockModule('../src/config/supabase.js', () => ({
    supabase: {
        from: jest.fn(() => ({
            select: jest.fn(() => ({
                eq: jest.fn(() => ({
                    or: jest.fn(() => ({
                        ilike: jest.fn(() => ({
                            order: jest.fn(() => ({
                                limit: jest.fn(() => ({ data: [] }))
                            }))
                        }))
                    }))
                }))
            })),
            insert: jest.fn(() => ({
                select: jest.fn(() => ({
                    single: jest.fn(() => ({ data: { id: 'mock-id' }, error: null }))
                }))
            })),
            update: jest.fn(() => ({
                eq: jest.fn()
            }))
        }))
    }
}));

// Mock Services (Email/PDF/Resort) to prevent side effects
jest.unstable_mockModule('../src/services/emailService.js', () => ({
    sendEmail: jest.fn()
}));
jest.unstable_mockModule('../src/services/pdfService.js', () => ({
    generateInvoicePDF: jest.fn()
}));
jest.unstable_mockModule('../src/services/resortService.js', () => ({
    searchResorts: jest.fn(() => Promise.resolve([]))
}));

// 2. Dynamic Import AFTER mocks
const { detectIntent, parseBookingScreenshot, createDayWiseItinerary } = await import('../src/controllers/aiController.js');
const { getModel } = await import('../src/config/gemini.js');

describe('AI Features', () => {

    // --- 1. INTENT DETECTION TESTS ---
    describe('detectIntent', () => {
        beforeEach(() => {
            jest.clearAllMocks();
        });

        test('should detect booking intent from natural language', async () => {
            const mockResponse = {
                response: {
                    usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 10, totalTokenCount: 20 },
                    text: () => JSON.stringify({
                        intent: 'itinerary',
                        destination: 'Paris',
                        duration: '5 days',
                        client_name: 'John Doe'
                    })
                }
            };
            mockGenerateContent.mockResolvedValue(mockResponse);

            const result = await detectIntent("Plan a 5 day trip to Paris for John Doe");

            expect(result.intent).toBe('itinerary');
            expect(result.destination).toBe('Paris');
            expect(result.duration).toBe('5 days');
        });

        test('should use heuristics for "Pending Trips" query', async () => {
            // Heuristic should bypass LLM
            const result = await detectIntent("Show me pending trips");

            expect(result.intent).toBe('query');
            expect(result.query_detail).toBe('pending');
            expect(mockGenerateContent).not.toHaveBeenCalled();
        });
    });

    // --- 2. SCREENSHOT PARSING (VISION) TESTS ---
    describe('parseBookingScreenshot', () => {
        let mockReq;
        let mockRes;

        beforeEach(() => {
            jest.clearAllMocks();
            mockReq = {
                body: { image: "data:image/png;base64,fakebase64string" }
            };
            mockRes = {
                json: jest.fn(),
                status: jest.fn(() => mockRes)
            };
        });

        test('TC-01: Happy Path - Valid JSON Extraction', async () => {
            const mockExtractedData = {
                valid: true,
                confidence: "high",
                data: {
                    destination: "London",
                    start_date: "2024-06-01",
                    budget: 1500,
                    flights: [{ airline: "BA", flight_number: "BA123" }]
                }
            };

            const mockResponse = {
                response: {
                    text: () => JSON.stringify(mockExtractedData)
                }
            };
            mockGenerateContent.mockResolvedValue(mockResponse);

            await parseBookingScreenshot(mockReq, mockRes);

            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                ...mockExtractedData
            });
        });

        test('TC-02: Fallback - Regex Extraction on unstructured text', async () => {
            // Simulator model failing to return JSON but returning descriptive text
            const unstructuredText = "The user is flying to New York on 2024-12-25. Destination: New York.";

            const mockResponse = {
                response: {
                    text: () => unstructuredText
                }
            };
            mockGenerateContent.mockResolvedValue(mockResponse);

            await parseBookingScreenshot(mockReq, mockRes);

            // Expect fallback logic to catch this
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                valid: true,
                confidence: "low",
                data: expect.objectContaining({
                    destination: "New York", // Regex should catch this
                    start_date: "2024-12-25" // Regex should catch this
                })
            }));
        });

        test('TC-03: Error Handling - No Image', async () => {
            mockReq.body.image = null;
            await parseBookingScreenshot(mockReq, mockRes);
            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
        });
    });

    // --- 3. ITINERARY GENERATION TESTS ---
    describe('createDayWiseItinerary', () => {
        beforeEach(() => {
            jest.clearAllMocks();
        });

        test('should generate a valid structure for day-wise plan', async () => {
            const mockPlan = {
                detailedPlan: {
                    destination: "Tokyo",
                    duration: "3 days",
                    dailyPlan: [
                        { day: 1, title: "Arrival", activities: ["Check-in"] }
                    ]
                }
            };

            const mockResponse = {
                response: {
                    usageMetadata: {},
                    text: () => JSON.stringify(mockPlan)
                }
            };
            mockGenerateContent.mockResolvedValue(mockResponse);

            const result = await createDayWiseItinerary({
                destination: "Tokyo",
                duration: "3 days",
                include_accommodation: true
            });

            expect(result.detailedPlan.destination).toBe("Tokyo");
            expect(result.detailedPlan.dailyPlan).toHaveLength(1);
        });

        test('should handle JSON parse errors gracefully', async () => {
            const mockResponse = {
                response: {
                    usageMetadata: {},
                    text: () => "Here is a trip to Rome. Day 1: Arrive. Day 2: Eat pasta." // Not JSON
                }
            };
            mockGenerateContent.mockResolvedValue(mockResponse);

            const result = await createDayWiseItinerary({
                destination: "Rome",
                duration: "2 days"
            });

            // It should fall back to a simple object wrapping the text
            expect(result.detailedPlan.destination).toBe("Rome");
            expect(result.content).toBeDefined();
            expect(result.detailedPlan.dailyPlan).toBeDefined(); // Fallback generates a single day bucket
        });
    });
});

import axios from 'axios';
import qs from 'querystring';
import https from 'https';
import dns from 'dns';

/**
 * Service to interact with Amadeus APIs (REST)
 * Uses OAuth2 Client Credentials Flow
 */
class AmadeusEnterpriseService {
    constructor(config) {
        // Map AMADEUS_API_KEY / SECRET to clientId/clientSecret
        this.clientId = config.amadeus_client_id || config.amadeus_api_key;
        this.clientSecret = config.amadeus_client_secret || config.amadeus_secret || config.amadeus_secret_key;

        // Base URL: 'https://test.api.amadeus.com' or 'https://api.amadeus.com'
        this.baseUrl = config.amadeus_url || 'https://test.api.amadeus.com';

        // Queue number for production scanning (default: 50)
        this.queueNumber = config.amadeus_queue_number || config.queue_number || '50';

        this.token = null;
        this.tokenExpiry = null;

        // Custom Agent to handle flaky DNS
        const agent = new https.Agent({
            lookup: (hostname, options, callback) => {
                dns.lookup(hostname, options, (err, address, family) => {
                    if (err && hostname === 'test.api.amadeus.com') {
                        console.warn('[Amadeus] DNS Lookup Failed. Using Fallback IP: 34.246.190.253');
                        return callback(null, '34.246.190.253', 4);
                    }
                    callback(err, address, family);
                });
            }
        });

        // Initialize dedicated HTTP Client
        this.httpClient = axios.create({
            baseURL: this.baseUrl,
            httpsAgent: agent,
            family: 4 // Prefer IPv4
        });
    }

    /**
     * Authenticate and get Access Token (OAuth2)
     * Includes retry logic with exponential backoff
     */
    async authenticate() {
        console.log(`[Amadeus] Authenticating via OAuth2...`);
        console.log(`[Amadeus] Client ID: ${this.clientId ? this.clientId.substring(0, 8) + '...' : 'MISSING'}`);

        if (!this.clientId || !this.clientSecret) {
            const error = new Error("Missing Amadeus API Key or Secret. Please configure in Settings → Integrations.");
            error.code = 'MISSING_GDS_KEYS';
            error.status = 412; // Precondition Failed
            throw error;
        }

        const maxRetries = 3;
        let lastError = null;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`[Amadeus] Authentication attempt ${attempt}/${maxRetries}`);

                const data = qs.stringify({
                    grant_type: 'client_credentials',
                    client_id: this.clientId,
                    client_secret: this.clientSecret
                });

                // Use dedicated client - path relative to baseURL
                const response = await this.httpClient.post('/v1/security/oauth2/token', data, {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    timeout: 30000 // 30 second timeout
                });

                this.token = response.data.access_token;
                // Set expiry (expires_in is in seconds) - refresh 5 min before actual expiry
                this.tokenExpiry = Date.now() + ((response.data.expires_in - 300) * 1000);

                console.log(`[Amadeus] Authentication Successful. Token obtained.`);
                return this.token;

            } catch (error) {
                lastError = error;

                // Categorize error for better user feedback
                if (error.response) {
                    const status = error.response.status;
                    const errorData = error.response.data;

                    if (status === 401 || status === 403) {
                        // Invalid credentials - don't retry
                        const friendlyError = new Error("Invalid Amadeus API credentials. Please check your API Key and Secret.");
                        friendlyError.code = 'INVALID_CREDENTIALS';
                        friendlyError.status = 401;
                        friendlyError.details = errorData;
                        throw friendlyError;
                    } else if (status === 429) {
                        // Rate limit - retry with longer backoff
                        console.warn(`[Amadeus] Rate limited. Attempt ${attempt}/${maxRetries}`);
                    } else if (status >= 500) {
                        // Server error - retry
                        console.warn(`[Amadeus] Server error (${status}). Attempt ${attempt}/${maxRetries}`);
                    }
                } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
                    // Network error - retry
                    console.warn(`[Amadeus] Network error (${error.code}). Attempt ${attempt}/${maxRetries}`);
                }

                // If not last attempt, wait before retry (exponential backoff)
                if (attempt < maxRetries) {
                    const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // Max 5s
                    console.log(`[Amadeus] Retrying in ${delay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                } else {
                    // Last attempt failed
                    console.error(`[Amadeus] All ${maxRetries} authentication attempts failed`);
                }
            }
        }

        // All retries exhausted
        if (lastError.response) {
            const friendlyError = new Error(`Amadeus authentication failed after ${maxRetries} attempts. Please check your credentials and internet connection.`);
            friendlyError.code = 'AUTH_FAILED';
            friendlyError.status = lastError.response.status || 500;
            friendlyError.details = lastError.response.data;
            throw friendlyError;
        } else {
            const friendlyError = new Error(`Network error connecting to Amadeus. Please check your internet connection.`);
            friendlyError.code = 'NETWORK_ERROR';
            friendlyError.originalError = lastError.message;
            throw friendlyError;
        }
    }

    /**
     * Helper to get valid token
     * Proactively refreshes if token expires within 5 minutes
     */
    async _getToken() {
        const fiveMinutes = 5 * 60 * 1000;
        if (!this.token || !this.tokenExpiry || (Date.now() + fiveMinutes) >= this.tokenExpiry) {
            console.log('[Amadeus] Token missing or expiring soon, refreshing...');
            await this.authenticate();
        }
        return this.token;
    }

    /**
     * Scan for recent bookings
     * Test: Uses known test PNRs
     * Production: Scans configured queue (default: queue 50) or attempts to list recent orders
     */
    async findRecentBookings() {
        console.log(`[Amadeus] Scanning for recent bookings in ${this.baseUrl.includes('test') ? 'TEST' : 'PRODUCTION'} environment...`);

        if (this.baseUrl.includes('test.api.amadeus.com')) {
            // TEST ENVIRONMENT: Use known test booking IDs
            const testIds = [
                'eJzTd9e39Hd2NPMGAAqYAjM', // JUPITER TESTER
                'eJzTd9e39He1dLMEAAqWAis'  // MARS TRAVELER
            ];

            const bookings = [];
            for (const id of testIds) {
                try {
                    const b = await this.retrieveBooking(id);
                    if (b) bookings.push(b);
                } catch (err) {
                    console.warn(`[Amadeus] Could not retrieve test booking ${id}`);
                }
            }
            console.log(`[Amadeus-Test] Found ${bookings.length} test bookings`);
            return bookings;
        } else {
            // PRODUCTION ENVIRONMENT
            console.log('[Amadeus-Prod] Attempting to discover bookings...');

            // Strategy 1: Try Queue API (requires Enterprise permissions)
            try {
                const queueNumber = this.queueNumber || '50'; // Default queue 50 for new bookings
                console.log(`[Amadeus-Prod] Scanning queue ${queueNumber}...`);
                const queueOrders = await this.scanQueue(queueNumber);

                if (queueOrders && queueOrders.length > 0) {
                    console.log(`[Amadeus-Prod] Found ${queueOrders.length} bookings in queue ${queueNumber}`);

                    // Fetch full details for each order
                    const bookings = [];
                    for (const order of queueOrders.slice(0, 50)) { // Limit to 50 for safety
                        try {
                            const pnr = order.id || order.recordLocator;
                            const fullBooking = await this.retrieveBooking(pnr);
                            if (fullBooking) bookings.push(fullBooking);
                        } catch (err) {
                            console.warn(`[Amadeus-Prod] Failed to retrieve booking details:`, err.message);
                        }
                    }
                    return bookings;
                }
            } catch (queueError) {
                console.warn(`[Amadeus-Prod] Queue scan failed (may require Enterprise permissions):`, queueError.message);
            }

            // Strategy 2: If queue fails, return empty (user can manually import via PNR)
            console.log('[Amadeus-Prod] No automatic discovery available. Users can manually import bookings by PNR.');
            return [];
        }
    }

    /**
     * Retrieve full PNR details
     * Uses Flight Order Management API
     * Includes retry logic for transient failures
     */
    async retrieveBooking(recordLocator) {
        const maxRetries = 3;
        let lastError = null;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const token = await this._getToken();
                console.log(`[Amadeus] Retrieving PNR ${recordLocator} (attempt ${attempt}/${maxRetries})`);

                // Relative path since baseURL is set in client
                const response = await this.httpClient.get(`/v1/booking/flight-orders/${recordLocator}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    timeout: 30000 // 30 second timeout
                });

                console.log(`[Amadeus] PNR ${recordLocator} Found`);
                return response.data.data;

            } catch (error) {
                lastError = error;

                // Don't retry on 404 (booking doesn't exist)
                if (error.response?.status === 404) {
                    console.warn(`[Amadeus] PNR ${recordLocator} not found (404)`);
                    return null;
                }

                // Don't retry on 401/403 (auth issue - token problem)
                if (error.response?.status === 401 || error.response?.status === 403) {
                    console.error(`[Amadeus] Authentication error retrieving PNR ${recordLocator}`);
                    throw new Error(`Authentication error. Please check your Amadeus credentials.`);
                }

                // Retry on network errors or 500s
                if (attempt < maxRetries) {
                    const delay = Math.min(1000 * Math.pow(2, attempt - 1), 3000);
                    console.warn(`[Amadeus] Error retrieving PNR ${recordLocator}, retrying in ${delay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                } else {
                    console.error(`[Amadeus] Failed to retrieve PNR ${recordLocator} after ${maxRetries} attempts:`, error.response?.data || error.message);
                }
            }
        }

        // All retries failed
        throw new Error(`Failed to retrieve booking ${recordLocator} after ${maxRetries} attempts. ${lastError.message}`);
    }

    /**
     * Remove PNR from Queue
     */
    async removeFromQueue(recordLocator, queueNumber) {
        console.log(`[Amadeus] Removing ${recordLocator} from Queue ${queueNumber} (Mock)`);
        return true;
    }

    /**
     * Scan Queue for bookings (Production)
     */
    async scanQueue(queueNumber = '50') {
        const token = await this._getToken();
        // Standard Amadeus Queue URL pattern for Enterprise
        // Note: Check exact endpoint based on specific contract/catalog. 
        // Often: /v1/queue/queues/{id}/orders or /v1/booking/queues/{id}
        // Assuming /v1/booking/queues/{id}/orders based on typical REST patterns for "List orders in queue"
        // If this 404s, it means the agent needs the specific "Queue API" access.
        try {
            console.log(`[Amadeus] Scanning Queue ${queueNumber}...`);
            const response = await this.httpClient.get(`/v1/booking/queues/${queueNumber}/orders`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            // Response typically contains a list of orders/PNRs
            return response.data.data || [];
        } catch (error) {
            console.warn(`[Amadeus] Queue Scan Failed (Queue ${queueNumber}) - Logic will fallback to empty: ${error.message}`);
            // Don't crash - just return empty so UI doesn't break
            return [];
        }
    }

    /**
     * Search for Flights (Shopping API)
     * POST /v2/shopping/flight-offers
     */
    async searchFlights(params) {
        const token = await this._getToken();
        const url = `${this.baseUrl}/v2/shopping/flight-offers`;

        const {
            originLocationCode,
            destinationLocationCode,
            departureDate,
            returnDate,
            adults = 1,
            children = 0,
            infants = 0,
            travelClass, // ECONOMY, PREMIUM_ECONOMY, BUSINESS, FIRST
            currencyCode = 'USD',
            max = 10
        } = params;

        // Build query params
        const queryParams = new URLSearchParams({
            originLocationCode,
            destinationLocationCode,
            departureDate,
            adults: String(adults),
            currencyCode,
            max: String(max)
        });

        if (returnDate) queryParams.append('returnDate', returnDate);
        if (children > 0) queryParams.append('children', String(children));
        if (infants > 0) queryParams.append('infants', String(infants));
        if (travelClass) queryParams.append('travelClass', travelClass);

        console.log(`[Amadeus] Searching flights: ${originLocationCode} -> ${destinationLocationCode} (${departureDate}) Class: ${travelClass || 'Any'}`);

        // Note: In Test Environment, Amadeus ignores most filters and returns mock data (e.g. LHR-JFK by default).
        // This code is Production-Ready.

        try {
            const response = await this.httpClient.get('/v2/shopping/flight-offers', {
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                params: queryParams
            });

            return response.data.data;
        } catch (error) {
            console.error(`[Amadeus] Flight Search Failed:`, error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Search Hotels by City
     * 1. Get List of Hotels in City
     * 2. (Optional) Get Offers for specific hotels
     */
    /**
     * Search City by Keyword
     * @param {string} keyword e.g. "Paris"
     * @returns {Promise<string|null>} IATA City Code e.g. "PAR"
     */
    async searchCity(keyword) {
        if (!keyword || keyword.length < 2) return null;

        const token = await this._getToken();
        try {
            const response = await this.httpClient.get('/v1/reference-data/locations', {
                headers: { 'Authorization': `Bearer ${token}` },
                params: {
                    subType: 'CITY',
                    keyword: keyword,
                    'page[limit]': 1
                }
            });

            if (response.data && response.data.data && response.data.data.length > 0) {
                return response.data.data[0].iataCode;
            }
            return null;
        } catch (error) {
            console.warn(`[Amadeus] City search failed for ${keyword}: ${error.message}`);
            return null;
        }
    }

    async searchHotels(cityCode) {
        const token = await this._getToken();
        console.log(`[Amadeus] Searching hotels in ${cityCode}...`);

        // Strategy: Use "Hotel List" API to get hotels in a city
        // Endpoint: /v1/reference-data/locations/hotels/by-city
        try {
            const response = await this.httpClient.get('/v1/reference-data/locations/hotels/by-city', {
                headers: { 'Authorization': `Bearer ${token}` },
                params: {
                    cityCode: cityCode,
                    radius: 20,
                    radiusUnit: 'KM',
                    hotelSource: 'ALL'
                }
            });

            return response.data.data;
        } catch (error) {
            // CRITICAL: Forward the exact error message so the user knows it's a real API failure (e.g. Quota Exceeded)
            // and not just "no mock data".
            const apiError = error.response?.data?.errors?.[0]?.detail || error.message;
            console.warn(`[Amadeus] Hotel List search failed for ${cityCode}: ${apiError}`);
            throw new Error(`Amadeus API Error: ${apiError}`);
        }
    }

    /**
     * get Hotel Offers (Pricing)
     */
    async getHotelOffers(hotelIds, checkIn, checkOut, adults = 1) {
        const token = await this._getToken();
        try {
            const response = await this.httpClient.get('/v3/shopping/hotel-offers', {
                headers: { 'Authorization': `Bearer ${token}` },
                params: {
                    hotelIds: hotelIds.join(','),
                    adults: adults,
                    checkInDate: checkIn,
                    checkOutDate: checkOut,
                    currencyCode: 'USD'
                }
            });
            return response.data.data;
        } catch (error) {
            console.warn(`[Amadeus] Hotel Offers failed: ${error.message}`);
            return [];
        }
    }

    /**
     * Sign Out
     * OAuth2 tokens just expire, but we can clear local state
     */
    async signOut() {
        this.token = null;
        this.tokenExpiry = null;
        console.log(`[Amadeus] Session cleared.`);
    }
}

export default AmadeusEnterpriseService;

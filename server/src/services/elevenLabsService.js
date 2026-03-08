import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';

// Default voice: Rachel (natural, warm female voice)
const DEFAULT_VOICE_ID = '21m00Tcm4TlvDq8ikWAM';

/**
 * Generate a personalized AI voiceover greeting for an itinerary.
 * Returns an audio buffer (MP3).
 */
export const generateItineraryVoiceover = async (destination, agencyName, travelerName = null) => {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    console.log(`[ElevenLabs] Attempting to generate audio for ${destination}. API Key present: ${!!apiKey}`);

    try {
        if (!apiKey) {
            console.warn('[ElevenLabs] No API key configured. Returning null.');
            return null;
        }

        const client = new ElevenLabsClient({ apiKey });

        const greeting = travelerName
            ? `Welcome, ${travelerName}! Get ready for an unforgettable journey to ${destination}. This exclusive itinerary has been personally curated for you by the team at ${agencyName}. We can't wait to make this trip the trip of a lifetime. Let's get started.`
            : `Welcome! Get ready for an unforgettable journey to ${destination}. This exclusive itinerary has been personally curated for you by the team at ${agencyName}. We can't wait to make this trip the trip of a lifetime. Let's get started.`;

        // Get raw response with headers for metadata tracking
        const { data, rawResponse } = await client.textToSpeech
            .convert(DEFAULT_VOICE_ID, {
                text: greeting,
                model_id: 'eleven_turbo_v2_5',
                voice_settings: {
                    stability: 0.5,
                    similarity_boost: 0.8,
                    style: 0.3,
                    use_speaker_boost: true,
                },
            })
            .withRawResponse();

        // Optional: Access character cost from headers (useful for internal tracking)
        const charCost = rawResponse.headers.get('x-character-count');
        const requestId = rawResponse.headers.get('request-id');

        console.log(`[ElevenLabs] Success! Generated voiceover. Cost: ${charCost} chars. RequestID: ${requestId}`);

        // data is a stream/buffer depending on implementation, 
        // with the SDK it's usually a readable stream that we convert to a buffer
        const chunks = [];
        for await (const chunk of data) {
            chunks.push(chunk);
        }
        return Buffer.concat(chunks);

    } catch (err) {
        console.error('[ElevenLabs] SDK Error:', err.message);
        // Fallback to more detailed error if available
        if (err.body) {
            console.error('[ElevenLabs] Error Details:', err.body);
        }
        return null;
    }
};

import axios from 'axios';
import qrcode from 'qrcode';

// ─────────────────────────────────────────────────────────────────────────────
// STEP 1 — Product catalogue (tag → Shopify variant URL)
// The first entry is the Reactiv-enabled product (App Clip ready).
// ─────────────────────────────────────────────────────────────────────────────
const triponicProducts = [
  {
    tag: 'international-arrival',
    url: 'https://triponic.myshopify.com/products/the-telecom-crisis-solver?variant=44068862886023',
  },
  {
    tag: 'west-coast-summer',
    url: 'https://triponic.myshopify.com/products/the-climate-disruption-guarantee?variant=44068872061063',
  },
  {
    tag: 'urban-foodie',
    url: 'https://triponic.myshopify.com/products/vip-access-local-indigenous-culinary-tasting?variant=44068875305095',
  },
  {
    tag: 'winter-sports',
    url: 'https://triponic.myshopify.com/products/banff-whistler-skip-the-line-lift-pass-warmth-bundle?variant=44068878024839',
  },
  {
    tag: 'budget-friendly',
    url: 'https://triponic.myshopify.com/products/farm-to-hotel-premium-local-snack-basket?variant=44068881170567',
  },
];

const FALLBACK_URL = triponicProducts[0].url; // eSIM as universal default

// ─────────────────────────────────────────────────────────────────────────────
// STEP 2–4 — Backboard.io AI routing
// Uses the OpenAI-compatible endpoint. Falls back to Gemini if not configured.
// ─────────────────────────────────────────────────────────────────────────────
export const analyzeItinerary = async (itinerary_text) => {
  const backboardKey = process.env.BACKBOARD_API_KEY;
  // Backboard is OpenAI-compatible — try their endpoint, fall back to Gemini
  const backboardUrl = process.env.BACKBOARD_API_URL || 'https://api.backboard.io/v1';

  // STEP 3 — Exact system prompt as specified
  const systemPrompt = `Read the provided itinerary text. Classify the itinerary into exactly ONE of these five tags based on the context:
1. 'international-arrival' (flying into Canada, mentions of cell service, data, landing)
2. 'west-coast-summer' (BC, Alberta, nature, summer, hiking)
3. 'urban-foodie' (cities, dining, restaurants, cultural tours)
4. 'winter-sports' (skiing, mountains, snow, Whistler, Banff)
5. 'budget-friendly' (families, road trips, general hotels, standard travel)

Return ONLY a raw JSON object in this exact format: {"tag": "selected-tag"}. Do not output markdown blocks, backticks, conversational text, or explanations. If you cannot decide, default to 'budget-friendly'.`;

  let selectedTag = 'budget-friendly';

  try {
    if (!backboardKey) {
      console.warn('[Backboard] No API key set. Falling back to Gemini routing.');
      throw new Error('no_backboard_key');
    }

    console.log(`[Backboard] Calling Assistants API...`);

    const headers = {
      'X-API-Key': backboardKey,
      'Content-Type': 'application/json'
    };

    // 1. Create Assistant
    const astRes = await axios.post(
      `${backboardUrl}/assistants`,
      { name: "Reactiv Classifier", system_prompt: systemPrompt },
      { headers }
    );
    const assistant_id = astRes.data.assistant_id;

    // 2. Create Thread
    const thRes = await axios.post(
      `${backboardUrl}/assistants/${assistant_id}/threads`,
      {},
      { headers }
    );
    const thread_id = thRes.data.thread_id;

    // 3. Send Message (Synchronous response)
    const msgRes = await axios.post(
      `${backboardUrl}/threads/${thread_id}/messages`,
      { role: "user", content: itinerary_text },
      { headers, timeout: 8000 }
    );

    const messages = msgRes.data.data || msgRes.data;
    const assistantMessage = Array.isArray(messages)
      ? messages.find(m => m.role === 'assistant')
      : messages;

    let rawText = '';

    if (assistantMessage && assistantMessage.content) {
      if (typeof assistantMessage.content === 'string') {
        rawText = assistantMessage.content.trim();
      } else if (Array.isArray(assistantMessage.content) && assistantMessage.content[0]?.text?.value) {
        rawText = assistantMessage.content[0].text.value.trim();
      }
    } else {
      rawText = JSON.stringify(msgRes.data);
    }

    // BACKBOARD BUG FIX: The API currently returns "Message added" instead of generating text.
    if (rawText === "Message added" || rawText.length < 5) {
      throw new Error("Backboard API returned invalid structural response format.");
    }

    const parsed = JSON.parse(rawText.replace(/```json|```/g, '').trim());
    selectedTag = parsed.tag || 'budget-friendly';

  } catch (err) {
    if (err.message !== 'no_backboard_key') {
      console.error('[Backboard] API error:', err?.response?.data || err.message);
    }

    // ── Gemini fallback ────────────────────────────────────────────────
    try {
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({
        model: process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite',
      });
      const result = await model.generateContent(
        `${systemPrompt}\n\n${itinerary_text}`
      );
      const text = result.response.text().replace(/```json|```/g, '').trim();
      const fallback = JSON.parse(text);
      selectedTag = fallback.tag || 'budget-friendly';
      console.log('[Gemini Fallback] Selected tag:', selectedTag);
    } catch (geminiErr) {
      console.error('[Gemini Fallback] Also failed:', geminiErr.message);
    }
  }

  // STEP 4 — Match tag → product URL
  const match = triponicProducts.find(p => p.tag === selectedTag);
  const checkoutUrl = match ? match.url : FALLBACK_URL;

  console.log(`[Reactiv Routing] tag="${selectedTag}" → ${checkoutUrl}`);
  return { tag: selectedTag, checkoutUrl };
};

// ─────────────────────────────────────────────────────────────────────────────
// QR code generator — encodes the checkout URL into a scannable PNG data URI
// ─────────────────────────────────────────────────────────────────────────────
export const generateCheckoutQrCode = async (itineraryId, itinerary_text) => {
  try {
    const { tag, checkoutUrl } = await analyzeItinerary(itinerary_text || '');

    const qrDataUri = await qrcode.toDataURL(checkoutUrl, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      margin: 1,
      color: {
        dark: '#1e1b4b',  // Deep indigo — brand colour
        light: '#ffffff',
      },
    });

    return { qrDataUri, tag, checkoutUrl };

  } catch (err) {
    console.error('[Reactiv] QR generation failed:', err.message);
    return { qrDataUri: null, tag: 'budget-friendly', checkoutUrl: FALLBACK_URL };
  }
};

const axios = require('axios');
const logger = require('../utils/logger');

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

// ─── Call Gemini API ─────────────────────────────────────────────────────────
async function callGemini(prompt, systemInstruction = '') {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    throw new Error('GEMINI_API_KEY not set. Get a free key at https://aistudio.google.com/app/apikey');
  }

  const body = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 1500,
    },
  };

  if (systemInstruction) {
    body.systemInstruction = { parts: [{ text: systemInstruction }] };
  }

  const res = await axios.post(`${GEMINI_URL}?key=${apiKey}`, body, { timeout: 30000 });
  return res.data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

// ─── Analyze Product with AI ─────────────────────────────────────────────────
async function analyzeProductWithAI(productData) {
  const system = `You are TrueCheck, an expert AI system that detects fake and counterfeit products on Indian e-commerce platforms. 
You analyze products on Amazon India, Flipkart, Myntra, and Ajio.
Always respond ONLY with valid JSON, no markdown, no explanation outside the JSON.`;

  const prompt = `Analyze this product listing for authenticity and return a JSON object:

Product: ${productData.productName}
Platform: ${productData.platform}
Price: ${productData.price}
Original Price: ${productData.originalPrice || 'N/A'}
Seller: ${productData.seller}
Rating: ${productData.rating}/5
Review Count: ${productData.reviewCount}
Fulfillment: ${productData.fulfillment || 'Unknown'}
Warranty Info: ${productData.warrantyText || 'Not mentioned'}
Return Policy: ${productData.returnText || 'Not mentioned'}
Sample Reviews: ${productData.reviews?.slice(0, 5).join(' | ') || 'No reviews'}

Return ONLY this JSON (no markdown):
{
  "authenticityScore": <integer 0-100>,
  "verdict": "<genuine|suspicious|fake>",
  "aiSummary": "<2-3 sentence analysis explaining the key findings>",
  "recommendation": "<one clear sentence advising the user whether to buy>",
  "signals": [
    {
      "id": "seller",
      "label": "Seller Credibility",
      "score": <0-100>,
      "status": "<good|warn|bad>",
      "detail": "<short finding about seller>",
      "icon": "seller"
    },
    {
      "id": "reviews",
      "label": "Review Authenticity",
      "score": <0-100>,
      "status": "<good|warn|bad>",
      "detail": "<finding about review patterns>",
      "icon": "reviews"
    },
    {
      "id": "price",
      "label": "Price Intelligence",
      "score": <0-100>,
      "status": "<good|warn|bad>",
      "detail": "<finding about pricing>",
      "icon": "price"
    },
    {
      "id": "warranty",
      "label": "Warranty Available",
      "score": <0-100>,
      "status": "<good|warn|bad>",
      "detail": "<finding about warranty>",
      "icon": "warranty"
    },
    {
      "id": "returns",
      "label": "Return Policy",
      "score": <0-100>,
      "status": "<good|warn|bad>",
      "detail": "<finding about returns>",
      "icon": "returns"
    },
    {
      "id": "authenticity",
      "label": "Brand Authenticity",
      "score": <0-100>,
      "status": "<good|warn|bad>",
      "detail": "<finding about brand authenticity signals>",
      "icon": "authenticity"
    }
  ]
}`;

  logger.info('Calling Gemini for product analysis...');
  const raw = await callGemini(prompt, system);

  // Clean up any accidental markdown fences
  const cleaned = raw.replace(/```json|```/g, '').trim();
  return JSON.parse(cleaned);
}

// ─── Analyze Screenshot with AI ──────────────────────────────────────────────
async function analyzeImageWithAI(base64Image) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    throw new Error('GEMINI_API_KEY not set.');
  }

  const body = {
    contents: [{
      role: 'user',
      parts: [
        {
          inlineData: {
            mimeType: 'image/jpeg',
            data: base64Image,
          },
        },
        {
          text: `You are TrueCheck, an AI product authenticity checker for Indian e-commerce.
Analyze this screenshot of a product listing and return ONLY this JSON (no markdown):
{
  "productName": "<extracted product name>",
  "platform": "<Amazon India|Flipkart|Myntra|Ajio|Unknown>",
  "price": "<extracted price with ₹>",
  "originalPrice": "<original price or null>",
  "seller": "<extracted seller name>",
  "rating": <number>,
  "reviewCount": <number>,
  "authenticityScore": <0-100>,
  "verdict": "<genuine|suspicious|fake>",
  "aiSummary": "<2-3 sentence analysis>",
  "recommendation": "<one clear buying advice>",
  "signals": [
    {"id":"seller","label":"Seller Credibility","score":<0-100>,"status":"<good|warn|bad>","detail":"<finding>","icon":"seller"},
    {"id":"reviews","label":"Review Authenticity","score":<0-100>,"status":"<good|warn|bad>","detail":"<finding>","icon":"reviews"},
    {"id":"price","label":"Price Intelligence","score":<0-100>,"status":"<good|warn|bad>","detail":"<finding>","icon":"price"},
    {"id":"warranty","label":"Warranty Available","score":<0-100>,"status":"<good|warn|bad>","detail":"<finding>","icon":"warranty"},
    {"id":"returns","label":"Return Policy","score":<0-100>,"status":"<good|warn|bad>","detail":"<finding>","icon":"returns"},
    {"id":"authenticity","label":"Brand Authenticity","score":<0-100>,"status":"<good|warn|bad>","detail":"<finding>","icon":"authenticity"}
  ]
}`,
        },
      ],
    }],
    generationConfig: { temperature: 0.2, maxOutputTokens: 1500 },
  };

  logger.info('Calling Gemini Vision for screenshot analysis...');
  const res = await axios.post(`${GEMINI_URL}?key=${apiKey}`, body, { timeout: 30000 });
  const raw = res.data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  const cleaned = raw.replace(/```json|```/g, '').trim();
  return JSON.parse(cleaned);
}

// ─── Chat with AI ─────────────────────────────────────────────────────────────
async function chatAboutProduct(messages, productContext) {
  const system = `You are TrueCheck AI, a friendly and knowledgeable assistant that helps Indian shoppers verify product authenticity on e-commerce platforms like Amazon India, Flipkart, Myntra, and Ajio.
Be concise, helpful, and specific. Focus on practical advice for Indian shoppers.
${productContext ? `\nCurrent product context:\nProduct: ${productContext.productName}\nPlatform: ${productContext.platform}\nScore: ${productContext.authenticityScore}/100\nVerdict: ${productContext.verdict}\nSummary: ${productContext.aiSummary}` : ''}`;

  const conversationText = messages
    .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
    .join('\n');

  const reply = await callGemini(conversationText, system);
  return reply.trim();
}

module.exports = { analyzeProductWithAI, analyzeImageWithAI, chatAboutProduct };

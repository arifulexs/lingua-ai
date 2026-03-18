/**
 * LinguaAI — Gemini API Proxy
 * Supports: text-only and multimodal (image + text) requests
 * Model: gemini-1.5-flash (free tier)
 */
module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { prompt, systemInstruction, imageBase64, imageMimeType } = req.body;
  const API_KEY = process.env.GEMINI_API_KEY;

  if (!API_KEY) {
    return res.status(500).json({ error: 'Server misconfigured: missing API key.' });
  }
  if (!prompt) {
    return res.status(400).json({ error: 'Missing prompt.' });
  }

  // Build parts — multimodal if image is provided
  const parts = [];

  if (imageBase64 && imageMimeType) {
    parts.push({
      inlineData: {
        mimeType: imageMimeType,
        data: imageBase64,
      },
    });
  }

  parts.push({ text: prompt });

  const requestBody = {
    system_instruction: {
      parts: [{ text: systemInstruction || 'You are a helpful English tutor. Return ONLY valid JSON.' }],
    },
    contents: [{ parts }],
    generationConfig: {
      temperature: 0.4,
      maxOutputTokens: 1024,
      responseMimeType: 'application/json',
    },
    safetySettings: [
      { category: 'HARM_CATEGORY_HARASSMENT',        threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH',       threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
    ],
  };

  try {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      }
    );

    if (!geminiRes.ok) {
      const errBody = await geminiRes.text();
      // Pass rate-limit status through so the client can handle it
      if (geminiRes.status === 429) {
        return res.status(429).json({ error: 'Rate limit exceeded. Please wait a moment.' });
      }
      return res.status(geminiRes.status).json({ error: `Gemini error: ${errBody}` });
    }

    const data = await geminiRes.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      const finishReason = data?.candidates?.[0]?.finishReason;
      return res.status(500).json({ error: `Empty AI response. Finish reason: ${finishReason || 'unknown'}` });
    }

    return res.status(200).json({ text });

  } catch (err) {
    console.error('Gemini proxy error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}

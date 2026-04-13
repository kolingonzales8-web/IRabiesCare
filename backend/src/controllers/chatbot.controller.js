const { GoogleGenerativeAI } = require('@google/generative-ai');

const SYSTEM_PROMPT = `...`; // keep your existing prompt

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Two models — primary and fallback
const PRIMARY_MODEL  = 'gemini-2.0-flash';
const FALLBACK_MODEL = 'gemini-1.5-flash-latest';

async function generateWithRetry(modelName, systemPrompt, chatHistory, message, retries = 3) {
  const model = genAI.getGenerativeModel({
    model: modelName,
    systemInstruction: systemPrompt,
  });

  const chat = model.startChat({
    history: chatHistory,
    generationConfig: {
      temperature:     0.7,
      maxOutputTokens: 512,
    },
  });

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const result = await chat.sendMessage(message);
      return result.response.text();
    } catch (error) {
      const isRetryable = error.status === 503 || error.status === 429 || error.status === 500;

      if (isRetryable && attempt < retries) {
        const delay = attempt * 2000; // 2s, 4s, 6s
        console.warn(`[Chatbot] Attempt ${attempt} failed (${error.status}). Retrying in ${delay}ms...`);
        await new Promise(res => setTimeout(res, delay));
        continue;
      }

      throw error; // give up after all retries
    }
  }
}

exports.chat = async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    if (!message) return res.status(400).json({ message: 'Message is required.' });

    const chatHistory = history.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }],
    }));

    let reply;

    try {
      // Try primary model first
      reply = await generateWithRetry(PRIMARY_MODEL, SYSTEM_PROMPT, chatHistory, message);
    } catch (primaryError) {
      console.warn(`[Chatbot] Primary model failed. Trying fallback... Error: ${primaryError.message}`);
      try {
        // Try fallback model
        reply = await generateWithRetry(FALLBACK_MODEL, SYSTEM_PROMPT, chatHistory, message);
      } catch (fallbackError) {
        console.error(`[Chatbot] Both models failed. Error: ${fallbackError.message}`);
        return res.status(503).json({
          message: 'Chatbot is temporarily unavailable. Please try again in a moment.',
        });
      }
    }

    if (!reply) return res.status(500).json({ message: 'No response from AI.' });

    res.json({ reply });

  } catch (error) {
    console.error('[Chatbot] Unexpected error:', error.message);
    res.status(500).json({ message: 'Chatbot is currently unavailable. Please try again.' });
  }
};
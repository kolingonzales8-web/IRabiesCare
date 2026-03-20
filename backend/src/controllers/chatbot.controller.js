const axios = require('axios');

const SYSTEM_PROMPT = `You are RabiesCarePH, a helpful health assistant for the iRabiesCare Rabies Case Management System in the Philippines. 

You only answer questions related to:
- Rabies disease (symptoms, transmission, prevention)
- Animal bites and wound care
- Post-Exposure Prophylaxis (PEP) — vaccine schedule (Day 0, 3, 7, 14, 28), what to do if a dose is missed
- Pre-Exposure Prophylaxis (PrEP)
- Rabies-related first aid
- When to go to a health center
- General guidance for patients registered in the system

You do NOT answer questions unrelated to rabies or health.
If asked something outside your scope, politely say you can only help with rabies and health-related questions.

Keep responses clear, concise, and easy to understand for Filipino patients.
Use simple language. You may occasionally use Tagalog words if it helps clarity.
Always recommend visiting the nearest health center for urgent concerns.`;

exports.chat = async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    if (!message) return res.status(400).json({ message: 'Message is required.' });

    // Build conversation history for Gemini
    const contents = [
      // Include previous messages
      ...history.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }],
      })),
      // Add current message
      {
        role: 'user',
        parts: [{ text: message }],
      },
    ];

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        system_instruction: {
          parts: [{ text: SYSTEM_PROMPT }],
        },
        contents,
        generationConfig: {
          temperature:     0.7,
          maxOutputTokens: 512,
        },
      },
      { headers: { 'Content-Type': 'application/json' } }
    );

    const reply = response.data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!reply) return res.status(500).json({ message: 'No response from AI.' });

    res.json({ reply });
  } catch (error) {
    console.error('[Chatbot] Error:', error.response?.data || error.message);
    res.status(500).json({ message: 'Chatbot is currently unavailable. Please try again.' });
  }
};
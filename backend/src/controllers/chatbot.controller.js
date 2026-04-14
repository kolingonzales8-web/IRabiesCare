const Groq = require('groq-sdk');

const SYSTEM_PROMPT = `...`; // ← paste your existing prompt here, don't change it

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

exports.chat = async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    if (!message) return res.status(400).json({ message: 'Message is required.' });

    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.text,
      })),
      { role: 'user', content: message },
    ];

    const response = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages,
      max_tokens: 512,
      temperature: 0.7,
    });

    const reply = response.choices[0]?.message?.content;

    if (!reply) return res.status(500).json({ message: 'No response from AI.' });

    res.json({ reply });

  } catch (error) {
    console.error('[Chatbot] Error:', error.message);
    res.status(500).json({ message: 'Chatbot is currently unavailable. Please try again.' });
  }
};
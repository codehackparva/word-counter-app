export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { word, langHint } = req.body;

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: `Give the meaning of this word: "${word}". It is in ${langHint}. Respond ONLY with raw JSON, no markdown fences, in this exact shape:
{"language":"detected language name","meaningNative":"meaning explained in the word's own language/script","meaningEnglish":"meaning in simple English","example":"one simple example sentence using the word, in the original script"}`
                        }]
                    }]
                })
            }
        );

        const data = await response.json();

        // Extract Gemini's text response and reshape it to match what the frontend expects
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
        const clean = rawText.replace(/```json|```/g, '').trim();

        res.status(200).json({
            content: [{ type: 'text', text: clean }]
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch meaning' });
    }
}
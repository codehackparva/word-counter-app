export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { word, langHint } = req.body;

    try {
        const response = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": process.env.ANTHROPIC_API_KEY,
                "anthropic-version": "2023-06-01"
            },
            body: JSON.stringify({
                model: "claude-sonnet-4-6",
                max_tokens: 400,
                messages: [{
                    role: "user",
                    content: `Give the meaning of this word: "${word}". It is in ${langHint}. Respond ONLY with raw JSON, no markdown fences, in this exact shape:
{"language":"detected language name","meaningNative":"meaning explained in the word's own language/script","meaningEnglish":"meaning in simple English","example":"one simple example sentence using the word, in the original script"}`
                }]
            })
        });

        const data = await response.json();
        res.status(200).json(data);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch meaning' });
    }
}
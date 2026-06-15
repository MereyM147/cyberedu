export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST only" });
  }

  try {
    const prompt = String(req.body?.prompt || "").slice(0, 4000);

    if (!prompt) {
      return res.status(400).json({ error: "Сұрақ бос келді" });
    }

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "OPENAI_API_KEY Vercel Environment Variables ішінде жоқ"
      });
    }

    const system = `
Сен CyberEdu ЖИ ассистентісің.
Қазақ тілінде түсінікті, нақты жауап бер.
Информатика, Python, алгоритмдеу, киберқауіпсіздік, сабақ жоспары,
миссия құру, бағалау критерийі, Firebase, Vercel және сайт жұмысы бойынша көмектес.
`;

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
        input: [
          {
            role: "system",
            content: [{ type: "input_text", text: system }]
          },
          {
            role: "user",
            content: [{ type: "input_text", text: prompt }]
          }
        ],
        max_output_tokens: 900
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.error?.message || "OpenAI қатесі"
      });
    }

    const reply =
      data.output_text ||
      data.output?.flatMap(item => item.content || [])
        .map(c => c.text || "")
        .join("\\n") ||
      "Жауап бос келді.";

    return res.status(200).json({ reply });
  } catch (error) {
    return res.status(500).json({
      error: error.message || "ЖИ сервер қатесі"
    });
  }
}

import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const translateText = async (req, res) => {
  try {
    const { text, targetLang } = req.body;

    if (!text || !targetLang) {
      return res.status(400).json({ message: "Text or language missing" });
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash"
    });

    const prompt = `Translate the following text into ${targetLang}.
Return ONLY translated text.

TEXT:
${text}`;

    const result = await model.generateContent(prompt);

    // ✅ SAFE extraction (works for all Gemini responses)
    let translated = "";

    if (result?.response?.candidates?.length > 0) {
      const parts = result.response.candidates[0].content.parts;
      translated = parts.map(p => p.text).join("");
    }

    if (!translated) {
      return res.status(500).json({ message: "Empty translation" });
    }

    res.json({ translated });

  } catch (err) {
    console.log("TRANSLATE ERROR:", err.message);
    res.status(500).json({ message: err.message });
  }
};

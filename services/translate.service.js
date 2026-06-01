import axios from "axios";

export const translateText = async (text, from, to) => {
  try {
    const res = await axios.post("https://libretranslate.de/translate", {
      q: text,
      source: from,
      target: to,
      format: "text"
    });

    return res.data.translatedText;
  } catch (err) {
    console.log("Translation error:", err.message);
    return text; // fallback
  }
};

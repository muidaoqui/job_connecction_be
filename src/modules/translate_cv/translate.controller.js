import { translateText, summarizeText } from "./translate.service.js";

export const translateController = async (req, res) => {
  try {
    const { text, input_language = "English", output_language = "Vietnamese" } = req.body;
    if (!text) return res.status(400).json({ message: "Missing text" });
    const result = await translateText(text, input_language, output_language);
    res.json({ result });
  } catch (err) {
    res.status(500).json({ message: "Translation error", error: err.message });
  }
};
// curl -X POST http://localhost:8080/api/translate \
//   -H "Content-Type: application/json" \
//   -d "{\"text\": \"Hello, how are you?\", \"input_language\": \"English\", \"output_language\": \"Vietnamese\"}"
export const summarizeController = async (req, res) => {
  try {
    const { text, language = "Vietnamese" } = req.body;
    if (!text) return res.status(400).json({ message: "Missing text" });
    const result = await summarizeText(text, language);
    res.json({ result });
  } catch (err) {
    res.status(500).json({ message: "Summarization error", error: err.message });
  }
};
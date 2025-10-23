
import { GoogleGenAI } from "@google/genai";
import { Asset } from '../types';

// Use Vite environment variable for browser apps
// Set VITE_GEMINI_API_KEY in .env.local file
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
  console.warn("VITE_GEMINI_API_KEY environment variable not set. Gemini features will be disabled.");
}

// Only construct the client when we have a key to avoid runtime errors in environments
// where the key is intentionally not provided (local dev, CI, etc.).
let ai: GoogleGenAI | null = null;
if (API_KEY) {
  ai = new GoogleGenAI({ apiKey: API_KEY });
}

export const getAiSummary = async (assets: Asset[], query: string): Promise<string> => {
  if (!API_KEY || !ai) {
    return "API kľúč pre Gemini nie je nastavený. Funkcia AI asistenta je deaktivovaná.";
  }

  const model = 'gemini-2.5-flash';
  
  const prompt = `Ste odborný asistent pre správu elektrických revízií náradia a spotrebičov.\n\n` +
    `Na základe nasledujúcich údajov vo formáte JSON o majetku a revíziách odpovedzte na otázku používateľa. ` +
    `Odpovedajte stručne, v slovenčine a formátujte odpoveď pomocou Markdown.\n\n` +
    `Dáta o majetku:\n${JSON.stringify(assets, null, 2)}\n\n` +
    `Otázka používateľa:\n"${query}"`;

  try {
    const response = await ai.models.generateContent({
        model,
        contents: prompt
    });
    return response.text || "AI asistent nevrátil žiadnu odpoveď.";
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return "Nastala chyba pri komunikácii s AI asistentom. Skúste to prosím znova.";
  }
};

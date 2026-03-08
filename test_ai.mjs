import { GoogleGenAI } from '@google/genai';

async function test() {
  const apiKey = 'AIzaSyB7uxdActVIpMkktjgqnyYIO6V1zKOsY8A';
  const ai = new GoogleGenAI({ apiKey: apiKey });

  const prompt = "Please test the I Ching integration.";
  console.log("Calling Gemini 2.5 Flash...");
  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });
    console.log("Response:", response.text);
  } catch (err) {
    console.error("Error from 2.5-flash:", err.message || err);
  }

  console.log("Calling Gemini 1.5 Flash...");
  try {
    const response = await ai.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: prompt,
    });
    console.log("Response:", response.text);
  } catch (err) {
    console.error("Error from 1.5-flash:", err.message || err);
  }
}

test();

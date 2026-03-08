import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import fetch, { Headers, Request, Response } from 'node-fetch';

if (!globalThis.fetch) {
  globalThis.fetch = fetch;
  globalThis.Headers = Headers;
  globalThis.Request = Request;
  globalThis.Response = Response;
}

import wilhelmData from '../src/data/iching_wilhelm.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure we have an API key. 
const apiKey = process.env.GEMINI_API_KEY || 'AIzaSyB7uxdActVIpMkktjgqnyYIO6V1zKOsY8A'; 
const ai = new GoogleGenAI({ apiKey: apiKey });

async function translateHexagram(hexagram, retries = 3) {
  const prompt = `
You are an expert translator specializing in the I Ching (Book of Changes).
Translate the following JSON object representing an I Ching hexagram from English to Simplified Chinese.
Maintain the exact same JSON key structure. Only translate the string values.
For the 'english', 'wilhelm_above.symbolic', 'wilhelm_below.symbolic', 'wilhelm_above.alchemical', and 'wilhelm_below.alchemical' fields, please provide the standard Chinese translations.
For the longer text fields like 'wilhelm_symbolic', 'wilhelm_judgment.text', 'wilhelm_judgment.comments', 'wilhelm_image.text', 'wilhelm_image.comments', and all the line texts and comments, provide a high-quality, philosophically accurate translation into Simplified Chinese.

Here is the JSON object to translate:
${JSON.stringify(hexagram, null, 2)}

Return ONLY valid JSON. Do not include markdown code block syntax (\`\`\`json) in your response, just the raw JSON object.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      }
    });
    
    // Attempt to parse the response text to ensure it's valid JSON
    const translatedJson = JSON.parse(response.text);
    return translatedJson;
  } catch (error) {
    if (error.status === 429 && retries > 0) {
        console.warn(`Rate limited on hexagram ${hexagram.hex}. Retrying in 15 seconds... (${retries} retries left)`);
        await new Promise(resolve => setTimeout(resolve, 15000));
        return translateHexagram(hexagram, retries - 1);
    } else if (error.status === 429) {
        console.error(`Rate limited on hexagram ${hexagram.hex} and exhausted retries! Returning original.`);
    } else {
        console.error(`Error translating hexagram ${hexagram.hex}:`, error);
    }
    // Return original if translation fails so we don't break the whole file
    return hexagram; 
  }
}

async function main() {
  // Initialize with the original English data so the UI doesn't break for untranslated hexagrams
  const translatedData = { ...wilhelmData };
  const total = Object.keys(wilhelmData).length;
  
  console.log(`Starting translation of ${total} hexagrams...`);
  
  const entries = Object.entries(wilhelmData);
  
  for (let i = 0; i < entries.length; i++) {
    const [key, hexagram] = entries[i];
    console.log(`[${i + 1}/${total}] Translating hexagram ${key}: ${hexagram.english}...`);
    
    // Add 10-second delay between every request even on success to prevent spiking RPM.
    if (i > 0) {
      await new Promise(resolve => setTimeout(resolve, 10000));
    }

    const translated = await translateHexagram(hexagram);
    translatedData[key] = translated;
    
    // Save partial progress
    const outputPath = path.join(__dirname, '..', 'src', 'data', 'iching_zh.js');
    const fileContent = `export default ${JSON.stringify(translatedData, null, 2)};\n`;
    fs.writeFileSync(outputPath, fileContent, 'utf-8');
    
    console.log(`Finished hexagram ${key}.`);
  }

  console.log('Translation complete! Saved to src/data/iching_zh.js');
}

main().catch(console.error);

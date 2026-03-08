import { GoogleGenAI } from '@google/genai';

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { question, hexagramData, language } = req.body;

  if (!question || !hexagramData) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Read the API Key securely from Vercel Environment Variables
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.error("Server is missing GEMINI_API_KEY");
    return res.status(500).json({ error: 'Server configuration error' });
  }

  const ai = new GoogleGenAI({ apiKey: apiKey });
  
  const langInstruction = language === 'zh' 
    ? 'Please provide the response ENTIRELY in Simplified Chinese.' 
    : 'Please provide the response in English.';

  const prompt = `
You are an expert in the I Ching (Book of Changes).
The user has asked the following question: "${question}"

They have cast the following hexagram:
Name: ${hexagramData.hex}. ${hexagramData.english} (${hexagramData.pinyin})
Judgment: ${hexagramData.wilhelm_judgment?.text || ''}
Image: ${hexagramData.wilhelm_image?.text || ''}

Please provide a personalized interpretation of this hexagram as it relates directly to their question. 
Keep the tone wise, contemplative, and premium. Format the response in standard markdown.
Limit the response to 2-3 concise paragraphs.

${langInstruction}
`;

  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });
    return res.status(200).json({ text: response.text });
  } catch (error) {
    console.error("Error generating reading:", error);
    return res.status(500).json({ error: 'Failed to generate reading' });
  }
}

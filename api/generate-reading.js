import { GoogleGenAI } from '@google/genai';

export const config = {
  runtime: 'edge', // Use Edge runtime for better performance, fetch support, and ES module compatibility
};

export default async function handler(req) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405 });
  }

  let body;
  try {
    body = await req.json();
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Invalid JSON body', details: err.message }), { 
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const { question, hexagramData, language } = body;

  if (!question || !hexagramData) {
    return new Response(JSON.stringify({ error: 'Missing required fields' }), { 
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Read the API Key securely from Vercel Environment Variables
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.error("Server is missing GEMINI_API_KEY");
    return new Response(JSON.stringify({ error: 'Server configuration error: Missing GEMINI_API_KEY' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
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
    return new Response(JSON.stringify({ text: response.text }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error("Error generating reading:", error);
    return new Response(JSON.stringify({ 
      error: 'Failed to generate reading', 
      details: error.message,
      stack: error.stack
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

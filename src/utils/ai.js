import { GoogleGenAI } from '@google/genai';

export async function generatePersonalizedReading(apiKey, question, hexagramData, language = 'en') {
  if (!apiKey) {
    throw new Error("API Key is required");
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
    return response.text;
  } catch (error) {
    console.error("Error generating reading:", error);
    throw error;
  }
}

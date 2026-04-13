
import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { Recommendation } from "../types";

const parseDataUrl = (dataUrl: string) => {
  const matches = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!matches) {
    return { mimeType: 'image/png', data: dataUrl };
  }
  return { mimeType: matches[1], data: matches[2] };
};

export const generateTryOnImage = async (userImageBase64: string, garmentImageBase64: string): Promise<string> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("Missing API Key.");

  const ai = new GoogleGenAI({ apiKey });
  const userImg = parseDataUrl(userImageBase64);
  const garmentImg = parseDataUrl(garmentImageBase64);

  const promptText = `
    VIRTUAL TRY-ON SYSTEM:
    OBJECTIVE: Synthesize the garment from Input 2 onto the subject in Input 1.
    
    CONSTRAINTS:
    - Maintain subject's physiological features, posture, and facial identity exactly.
    - Replace only the current apparel with the new item.
    - Ensure realistic physics, shadows, and fabric interaction with the subject's anatomy.
    - Preserve background and environmental lighting.
    
    OUTPUT: Return only the high-resolution composite image.
  `;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { inlineData: { mimeType: userImg.mimeType, data: userImg.data } },
          { inlineData: { mimeType: garmentImg.mimeType, data: garmentImg.data } },
          { text: promptText },
        ],
      },
      config: { imageConfig: { aspectRatio: "1:1" } }
    });

    const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
    if (!part?.inlineData) throw new Error("Synthesis engine failed to generate image.");
    return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
  } catch (error: any) {
    throw new Error(error.message || "Visualization process failed.", { cause: error });
  }
};

export const getFashionRecommendations = async (userImageBase64: string, garmentImageBase64: string): Promise<Recommendation[]> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return [];

  const ai = new GoogleGenAI({ apiKey });
  const userImg = parseDataUrl(userImageBase64);
  const garmentImg = parseDataUrl(garmentImageBase64);

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: {
        parts: [
          { inlineData: { mimeType: userImg.mimeType, data: userImg.data } },
          { inlineData: { mimeType: garmentImg.mimeType, data: garmentImg.data } },
          { text: "Analyze the subject's silhouette and the selected garment. Recommend 3 complementary high-end fashion items. For each item, provide a descriptive product name, styling rationale, a Google Shopping search link, and a direct URL to a representative image of such an item. CRITICAL: The imageUrl MUST be a real, high-quality direct image link (ending in .jpg, .png, etc.) from a reputable fashion retailer or image CDN that accurately represents the recommended item. Do not hallucinate URLs. Return structured JSON." }
        ]
      },
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              item: { type: Type.STRING },
              reason: { type: Type.STRING },
              category: { type: Type.STRING, enum: ['Top', 'Bottom', 'Outerwear', 'Footwear', 'Accessory'] },
              searchLink: { type: Type.STRING },
              imageUrl: { type: Type.STRING, description: "URL to a representative product image" },
              brandSuggestion: { type: Type.STRING }
            },
            required: ["item", "reason", "category", "searchLink", "imageUrl"]
          }
        }
      }
    });

    return JSON.parse(response.text || "[]");
  } catch (e) {
    console.error("Style analysis failed:", e);
    return [];
  }
};

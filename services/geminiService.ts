
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

/**
 * Utility to extract MIME type and data from a data URL
 */
const parseDataUrl = (dataUrl: string) => {
  const matches = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!matches) {
    // Fallback if it's already a raw base64 string
    return { mimeType: 'image/png', data: dataUrl };
  }
  return { mimeType: matches[1], data: matches[2] };
};

/**
 * Sends the user image and product image to Gemini for virtual try-on.
 * Uses gemini-2.5-flash-image for fast and efficient garment rendering.
 */
export const generateTryOnImage = async (userImageBase64: string, garmentImageBase64: string): Promise<string> => {
  const apiKey = process.env.API_KEY;
  
  if (!apiKey) {
    throw new Error("API_KEY not found in environment. Please ensure the key is correctly set.");
  }

  // Create instance right before call as per instructions
  const ai = new GoogleGenAI({ apiKey });
  
  const userImg = parseDataUrl(userImageBase64);
  const garmentImg = parseDataUrl(garmentImageBase64);

  // Highly specific prompt for gemini-2.5-flash-image
  const promptText = `
    INSTRUCTION: 
    Apply the garment from the second image onto the person in the first image.
    
    RULES:
    - Keep the person's face, hair, and body shape identical.
    - Replace only the clothing.
    - Make the fit look natural with realistic folds and lighting.
    - Return ONLY the final edited image.
  `;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: userImg.mimeType,
              data: userImg.data,
            },
          },
          {
            inlineData: {
              mimeType: garmentImg.mimeType,
              data: garmentImg.data,
            },
          },
          { text: promptText },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1"
        }
      }
    });

    const candidate = response.candidates?.[0];
    
    if (!candidate || !candidate.content?.parts) {
      throw new Error("No response generated. The model may have filtered the content due to safety settings.");
    }

    let generatedBase64: string | null = null;
    
    // Iterate through parts to find the image part
    for (const part of candidate.content.parts) {
      if (part.inlineData) {
        generatedBase64 = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        break;
      }
    }

    if (!generatedBase64) {
      // Check if there's any text explaining why an image wasn't returned
      const refusalText = candidate.content.parts.find(p => p.text)?.text;
      throw new Error(refusalText || "The AI didn't return an image. Try using clearer photos.");
    }

    return generatedBase64;
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    
    // Friendly error messages for common API issues
    const msg = error.message || "";
    if (msg.includes("401") || msg.includes("API key not valid")) {
      throw new Error("Invalid API Key. Please check the key provided in your environment.");
    } else if (msg.includes("429")) {
      throw new Error("Too many requests. Please wait a moment before trying again.");
    } else if (msg.includes("500")) {
      throw new Error("Gemini server error. The AI is temporarily unavailable.");
    }
    
    throw new Error(msg || "Failed to generate try-on. Ensure your images are clear and suitable.");
  }
};

import { ExtractionResult } from '../types';

export const extractProductImage = async (url: string): Promise<ExtractionResult> => {
  try {
    const response = await fetch('/api/extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to extract image');
    }

    return await response.json();
  } catch (err: any) {
    console.error("Extraction failed:", err);
    return {
      imageUrl: null,
      title: null,
      error: err.message || 'Product image could not be found automatically.'
    };
  }
};

export const imageUrlToBase64 = async (url: string): Promise<string> => {
  try {
    const response = await fetch(`/api/proxy-image?url=${encodeURIComponent(url)}`);
    if (!response.ok) throw new Error('Failed to fetch image via proxy');
    
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        if (result.includes('base64,')) {
          resolve(result.split(',')[1]);
        } else {
          reject('Invalid image data');
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (err: any) {
    console.error("Image proxy failed:", err);
    throw new Error("Unable to fetch the product image data. Please upload it manually.", { cause: err });
  }
};

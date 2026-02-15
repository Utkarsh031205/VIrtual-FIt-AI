
import { ExtractionResult } from '../types';

/**
 * Resilient and diverse CORS proxies to bypass retailer blocking.
 */
const EXTRACTION_STRATEGIES = [
  {
    // High reliability but sometimes throttled
    url: (url: string) => `https://api.allorigins.win/get?url=${encodeURIComponent(url)}&_=${Date.now()}`,
    parser: async (res: Response) => {
      const data = await res.json();
      return data.contents;
    }
  },
  {
    // Direct proxy fallback
    url: (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
    parser: async (res: Response) => res.text()
  },
  {
    // Alternative proxy for better coverage
    url: (url: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
    parser: async (res: Response) => res.text()
  }
];

const BLACKLIST = ['logo', 'icon', 'sprite', 'banner', 'nav', 'footer', 'social', 'avatar', 'loading', 'pixel', 'tracking', 'ads', 'spinner'];

/**
 * Specifically parses Amazon's 'data-a-dynamic-image' attribute or fallback high-res attributes.
 */
const parseAmazonImages = (doc: Document): string | null => {
  // Check for common Amazon high-res containers
  const selectors = [
    '#landingImage', 
    '#main-image', 
    'img[data-a-dynamic-image]', 
    'img[data-old-hires]',
    'img[data-zoom-image]',
    '.a-dynamic-image'
  ];

  for (const selector of selectors) {
    const img = doc.querySelector(selector);
    if (!img) continue;

    // 1. Try dynamic image JSON
    const dynamicAttr = img.getAttribute('data-a-dynamic-image');
    if (dynamicAttr) {
      try {
        const data = JSON.parse(dynamicAttr);
        const urls = Object.keys(data);
        return urls.sort((a, b) => b.length - a.length)[0];
      } catch (e) {}
    }

    // 2. Try explicit high-res attributes
    const hiRes = img.getAttribute('data-old-hires') || img.getAttribute('data-zoom-image');
    if (hiRes) return hiRes;

    // 3. Try src or srcset
    const src = img.getAttribute('src');
    if (src && !src.includes('base64')) return src;
  }
  
  return null;
};

export const extractProductImage = async (url: string): Promise<ExtractionResult> => {
  let lastError = 'Product image could not be found automatically.';

  for (const strategy of EXTRACTION_STRATEGIES) {
    try {
      const response = await fetch(strategy.url(url));
      if (!response.ok) continue;
      
      const html = await strategy.parser(response);
      if (!html || typeof html !== 'string') continue;

      // Detection for Bot Protection
      if (html.toLowerCase().includes('robot check') || html.toLowerCase().includes('captcha')) {
        lastError = 'Retailer (Amazon) is blocking the automated fetch. Please use manual upload.';
        continue;
      }

      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const candidates: string[] = [];

      // 1. Specialized Retailer Logic
      const amazonImg = parseAmazonImages(doc);
      if (amazonImg) candidates.push(amazonImg);

      // 2. Open Graph & Meta Tags (Standard)
      ['og:image', 'twitter:image', 'image', 'thumbnail'].forEach(name => {
        const meta = doc.querySelector(`meta[property="${name}"], meta[name="${name}"], meta[property="og:image:secure_url"]`)?.getAttribute('content');
        if (meta) candidates.push(meta);
      });

      // 3. Generic Product Selectors
      const selectors = [
        '#landingImage', '#main-image', '.product-image img', 
        '.pdp-image', 'img.main', '.gallery-image', 
        '[data-testid="pdp-main-image"]', '.product__img',
        '.img-responsive', '.product-main-image img'
      ];
      selectors.forEach(s => {
        const src = doc.querySelector(s)?.getAttribute('src');
        if (src) candidates.push(src);
      });

      // 4. Heuristic: Find largest non-blacklisted image
      const allImgs = Array.from(doc.querySelectorAll('img'))
        .filter(img => {
          const width = parseInt(img.getAttribute('width') || '0');
          const height = parseInt(img.getAttribute('height') || '0');
          return (width > 200 && height > 200) || (!width && !height);
        })
        .map(i => i.src || i.getAttribute('data-src') || i.getAttribute('data-lazy-src'))
        .filter(Boolean) as string[];
      
      candidates.push(...allImgs);

      // Normalize and Validate
      const valid = candidates
        .filter(Boolean)
        .map(c => {
          if (c.startsWith('//')) return `https:${c}`;
          if (c.startsWith('/')) {
            try {
              const base = new URL(url);
              return `${base.protocol}//${base.host}${c}`;
            } catch { return c; }
          }
          return c;
        })
        .filter(c => {
          try {
            const u = new URL(c);
            return u.protocol.startsWith('http') && 
                   !BLACKLIST.some(b => u.pathname.toLowerCase().includes(b));
          } catch { return false; }
        });

      if (valid.length > 0) {
        // Return unique first candidate that isn't a tracking pixel
        const bestCandidate = valid.find(c => !c.toLowerCase().includes('pixel') && !c.toLowerCase().includes('.gif')) || valid[0];
        return { imageUrl: bestCandidate, title: doc.title };
      }
    } catch (e) {
      console.warn("Strategy failed:", e);
    }
  }

  return { 
    imageUrl: null, 
    title: null, 
    error: lastError 
  };
};

export const imageUrlToBase64 = async (url: string): Promise<string> => {
  // Use AllOrigins raw proxy to avoid CORS issues for images on retailer CDNs
  const proxies = [
    `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
    `https://corsproxy.io/?${encodeURIComponent(url)}`,
    url // Try direct as last resort
  ];

  for (const proxyUrl of proxies) {
    try {
      const response = await fetch(proxyUrl);
      if (!response.ok) continue;
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
    } catch (e) {}
  }
  throw new Error("Unable to fetch the product image data. Please upload it manually.");
};

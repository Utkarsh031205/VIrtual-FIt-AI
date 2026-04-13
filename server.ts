import express from "express";
import { createServer as createViteServer } from "vite";
import puppeteer from "puppeteer";
import path from "path";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route for Product Extraction
  app.post("/api/extract", async (req, res) => {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }

    let browser;
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });
      const page = await browser.newPage();
      
      // Set a realistic user agent
      await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");

      await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });

      // Extract image candidates
      const data = await page.evaluate(() => {
        const candidates: string[] = [];
        
        // 1. Amazon specific
        const amazonImg = document.querySelector('#landingImage, #main-image, img[data-a-dynamic-image]');
        if (amazonImg) {
          const dynamicAttr = amazonImg.getAttribute('data-a-dynamic-image');
          if (dynamicAttr) {
            try {
              const parsed = JSON.parse(dynamicAttr);
              const urls = Object.keys(parsed);
              candidates.push(urls.sort((a, b) => b.length - a.length)[0]);
            } catch (e) {
              console.error("Failed to parse dynamic image attribute", e);
            }
          }
          const src = amazonImg.getAttribute('src');
          if (src) candidates.push(src);
        }

        // 2. Open Graph
        const ogImg = document.querySelector('meta[property="og:image"]')?.getAttribute('content');
        if (ogImg) candidates.push(ogImg);

        // 3. Large images
        const imgs = Array.from(document.querySelectorAll('img'));
        const largeImgs = imgs
          .filter(img => {
            const rect = img.getBoundingClientRect();
            return rect.width > 200 && rect.height > 200;
          })
          .map(img => img.src);
        
        candidates.push(...largeImgs);

        return {
          title: document.title,
          candidates: Array.from(new Set(candidates.filter(Boolean)))
        };
      });

      await browser.close();

      if (data.candidates.length > 0) {
        res.json({ imageUrl: data.candidates[0], title: data.title });
      } else {
        res.status(404).json({ error: "No suitable product image found." });
      }
    } catch (error: any) {
      if (browser) await browser.close();
      console.error("Extraction error:", error);
      res.status(500).json({ error: "Failed to extract image: " + error.message });
    }
  });

  // API Route for Image Proxy (to bypass CORS)
  app.get("/api/proxy-image", async (req, res) => {
    const { url } = req.query;
    if (!url || typeof url !== 'string') {
      return res.status(400).send("URL is required");
    }

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);
      
      const contentType = response.headers.get("content-type");
      if (contentType) res.setHeader("Content-Type", contentType);
      
      const arrayBuffer = await response.arrayBuffer();
      res.send(Buffer.from(arrayBuffer));
    } catch (error) {
      console.error("Proxy error:", error);
      res.status(500).send("Failed to proxy image");
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(process.cwd(), "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(process.cwd(), "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

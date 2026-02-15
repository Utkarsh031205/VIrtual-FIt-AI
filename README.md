<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# VirtualFit AI

VirtualFit AI is a high-end virtual try-on web application that uses Google Gemini AI to realistically render garments on user-uploaded photos. Instantly visualize how you would look in clothing from Amazon, Zara, and other retailers—all in your browser.

---

## Features

- **Virtual Try-On:** Upload your portrait and a garment image or product link to see a realistic try-on result.
- **AI-Powered:** Utilizes Gemini 2.5 Flash for advanced neural rendering and garment transfer.
- **Retailer Integration:** Paste product links from Amazon, Zara, H&M, Myntra, and more. The app automatically extracts the product image.
- **Manual Upload:** If automatic extraction fails (e.g., due to retailer blocking), you can upload a garment image manually.
- **Comparison Slider:** Compare your original photo and the AI-generated try-on result with an interactive slider.
- **Download Results:** Save your virtual try-on image for sharing or reference.

---

## How It Works

1. **Upload Your Photo:**
   - Use a clear, front-facing portrait for best results.
2. **Choose a Garment:**
   - Paste a product link (Amazon, Zara, etc.) or upload a garment image manually.
3. **Visualize the Fit:**
   - Click "Visualize This Fit" to generate your try-on image using Gemini AI.
4. **Compare & Download:**
   - Use the slider to compare before/after, and download your result.

---

## Technologies Used

- **React**: Frontend UI
- **Vite**: Fast development/build tooling
- **TypeScript**: Type safety
- **@google/genai**: Gemini AI API client
- **Tailwind CSS**: Modern styling

---

## Setup & Running Locally

**Prerequisites:**
- Node.js (v18+ recommended)
- A Google Gemini API key ([get one here](https://aistudio.google.com/app/apikey))

**Steps:**

1. **Clone the repository:**
   ```sh
   git clone <your-repo-url>
   cd virtualfit-ai
   ```
2. **Install dependencies:**
   ```sh
   npm install
   ```
3. **Set up your API key:**
   - Create a `.env.local` file in the project root:
     ```env
     GEMINI_API_KEY=your_gemini_api_key_here
     ```
4. **Run the app:**
   ```sh
   npm run dev
   ```
   The app will be available at [http://localhost:3000](http://localhost:3000).

---

## Troubleshooting

- **API Key Issues:**
  - Make sure your `.env.local` file uses `GEMINI_API_KEY` (not `API_KEY`).
  - If you see "Too many requests", you may have hit the Gemini API rate limit. Wait a few minutes or try a different network/account.
- **Retailer Blocking:**
  - Some retailers (especially Amazon) may block automated image extraction. Use manual upload if this happens.
- **Image Quality:**
  - For best results, use clear, well-lit, front-facing photos.

---

## License

This project is for educational and demonstration purposes only. Commercial use may require additional licensing for the Gemini API and retailer content.

---

## Credits

- Gemini AI by Google
- UI inspired by modern e-commerce and AI demo apps

# VirtualFit AI  
### Project-Based Learning (PBL-2)  
### Manipal University Jaipur  

**Name:** Utkarsh Vohra  
**Registration Number:** 2427030571  
**Course:** Project-Based Learning – 2 (PBL-2)  
**Year:** 2026  

---

## 1. Introduction

VirtualFit AI is an AI-powered virtual try-on web application that enables users to realistically visualize garments on their own uploaded photographs. The system integrates generative artificial intelligence to render clothing items onto a user’s image, simulating how the garment would appear when worn.

The project demonstrates the practical integration of Artificial Intelligence APIs with modern frontend technologies to solve a real-world problem in the e-commerce industry.

---

## 2. Problem Statement

Online fashion retail faces a significant challenge: customers cannot accurately visualize how a garment will look on their own body type before purchasing. This results in:

- High product return rates  
- Customer dissatisfaction  
- Increased logistics costs  
- Reduced purchase confidence  

The goal of this project is to design and implement an AI-based virtual try-on system that enhances user confidence and reduces uncertainty in online shopping.

---

## 3. Objectives

- Develop a responsive web-based application for virtual try-on.
- Integrate generative AI for realistic garment transfer.
- Enable garment input via product URL or manual image upload.
- Provide an interactive before/after comparison interface.
- Explore real-world AI deployment in frontend systems.
- Ensure secure handling of API credentials.

---

## 4. System Overview

VirtualFit AI allows users to:

1. Upload a clear front-facing portrait.
2. Provide a garment image or a retailer product link.
3. Automatically extract the product image (where permitted).
4. Generate a realistic try-on image using AI.
5. Compare original and generated images via an interactive slider.
6. Download the generated output.

---

## 5. System Architecture

### Workflow

1. User uploads portrait image.
2. User inputs garment image or retailer product URL.
3. Application extracts garment image (if URL provided).
4. AI model processes:
   - User image
   - Garment image
5. Rendered try-on output is generated.
6. Frontend displays:
   - Original image
   - Generated image
   - Interactive comparison slider
   - Download option

### Technology Stack

- **React** – Frontend user interface
- **Vite** – Development and build tool
- **TypeScript** – Type-safe development
- **Gemini 2.5 Flash (Google AI API)** – Generative AI rendering engine
- **Tailwind CSS** – UI styling and responsiveness

---

## 6. AI Integration

The system integrates Google Gemini’s generative image capabilities to perform garment transfer and neural rendering.

The AI model:
- Accepts a portrait image and garment image
- Generates a new composite image
- Preserves facial identity and body structure
- Adjusts garment placement realistically

API keys are stored securely using environment variables and are not exposed in the repository.

---

## 7. Setup and Execution

### Prerequisites

- Node.js (v18+ recommended)
- Google Gemini API key

### Installation Steps

1. Clone the repository:
   ```sh
   git clone <your-repo-url>
   cd virtualfit-ai
   ```
2. Install dependencies:
   ```sh
   npm install
   ```
3. Create a `.env.local` file in the project root:
   ```env
   GEMINI_API_KEY=your_api_key_here
   ```
4. Run the development server:
   ```sh
   npm run dev
   ```
5. Open:
   ```
   http://localhost:3000
   ```

---

## 8. Challenges Faced
- Retailer websites blocking automated image extraction.
- API rate limits during testing.
- Ensuring realistic garment placement.
- Maintaining image quality during AI processing.
- Secure management of API credentials.

---

## 9. Applications
- Online fashion retail platforms
- E-commerce personalization systems
- Virtual styling platforms
- Fashion-tech startups

---

## 10. Future Scope
- Integration of pose detection for better garment alignment.
- 3D garment simulation for enhanced realism.
- AR-based real-time try-on via webcam.
- Personalized outfit recommendations using ML.
- Size estimation using body landmark detection.
- Multi-garment layering simulation.

---

## 11. Learning Outcomes
Through this project, the following concepts were explored:
- API integration in frontend systems
- Generative AI deployment
- Image processing workflows
- Web application architecture
- Secure credential management
- Real-world AI problem solving

---

## 12. License
This project is developed strictly for academic purposes under PBL-2 at Manipal University Jaipur. Commercial deployment would require appropriate licensing for AI APIs and retailer content.

---

## 13. Acknowledgements
- Dr. Arpita Baronia - PBL-2 Guide
- Google Gemini AI
- Modern AI and web development frameworks

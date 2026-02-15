
import React, { useState, useEffect, useRef } from 'react';
import { AppStatus, ImageState } from './types';
import { extractProductImage, imageUrlToBase64 } from './services/extractionService';
import { generateTryOnImage } from './services/geminiService';
import Uploader from './components/Uploader';
import ComparisonSlider from './components/ComparisonSlider';

const LOADING_MESSAGES = [
  "Reading fabric textures...",
  "Analyzing silhouette...",
  "Simulating fabric physics...",
  "Rendering highlights...",
  "Applying final lighting...",
];

const App: React.FC = () => {
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [images, setImages] = useState<ImageState>({
    original: null,
    product: null,
    generated: null
  });
  const [url, setUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loadIdx, setLoadIdx] = useState(0);
  const garmentInputRef = useRef<HTMLInputElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);

  // Cycle through loading messages
  useEffect(() => {
    let interval: any;
    if (status === AppStatus.GENERATING) {
      interval = setInterval(() => {
        setLoadIdx(prev => (prev + 1) % LOADING_MESSAGES.length);
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [status]);

  // Scroll to error if it appears
  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [error]);

  const handleFetchProduct = async () => {
    if (!url) return;
    setStatus(AppStatus.EXTRACTING);
    setError(null);
    
    try {
      const result = await extractProductImage(url);
      if (result.imageUrl) {
        setImages(prev => ({ ...prev, product: result.imageUrl }));
        setStatus(AppStatus.IDLE);
      } else {
        setError(result.error || 'Retailers often block scrapers. Please upload a screenshot manually.');
        setStatus(AppStatus.ERROR);
      }
    } catch (err) {
      setError('Connection error. Amazon or other retailers might be blocking the request. Use manual upload.');
      setStatus(AppStatus.ERROR);
    }
  };

  const handleManualGarmentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImages(prev => ({ ...prev, product: reader.result as string }));
        setStatus(AppStatus.IDLE);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!images.original || !images.product) return;
    
    setStatus(AppStatus.GENERATING);
    setError(null);

    try {
      // Ensure garment image is processed as base64
      let garmentData = images.product;
      if (!garmentData.startsWith('data:')) {
        const base64 = await imageUrlToBase64(garmentData);
        garmentData = `data:image/png;base64,${base64}`;
      }

      const result = await generateTryOnImage(images.original, garmentData);
      
      setImages(prev => ({ ...prev, generated: result }));
      setStatus(AppStatus.SUCCESS);
    } catch (err: any) {
      console.error("App: Generation Error", err);
      setError(err.message || 'Generation failed. Check your API key and network.');
      setStatus(AppStatus.ERROR);
    }
  };

  const reset = () => {
    setImages({ original: null, product: null, generated: null });
    setStatus(AppStatus.IDLE);
    setUrl('');
    setError(null);
  };

  const handleDownload = () => {
    if (!images.generated) return;
    const link = document.createElement('a');
    link.href = images.generated;
    link.download = 'virtualfit-ai-result.png';
    link.click();
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-gray-900 pb-20 selection:bg-blue-100">
      <nav className="sticky top-0 z-50 glass border-b border-gray-200/50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 13V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6m4 8h10a2 2 0 002-2v-6H3v6a2 2 0 002 2z" />
            </svg>
          </div>
          <span className="font-bold text-xl tracking-tight">VirtualFit <span className="text-blue-600">AI</span></span>
        </div>
        <button 
          onClick={reset}
          className="text-sm font-semibold text-gray-400 hover:text-gray-900 transition-colors px-4 py-2 hover:bg-gray-100 rounded-full"
        >
          Reset Session
        </button>
      </nav>

      <main className="max-w-6xl mx-auto px-6 pt-12">
        <header className="text-center mb-12 space-y-4">
          <div className="inline-block px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-sm">
            Powered by Gemini 2.5 Flash
          </div>
          <h1 className="text-4xl md:text-7xl font-black tracking-tighter text-gray-900 leading-[1.1]">
            Virtual Fit <br/><span className="text-blue-600">Tailored</span> For You.
          </h1>
          <p className="text-lg text-gray-500 max-w-xl mx-auto font-medium">
            Upload your photo, link a garment from Amazon or Zara, and see how you look instantly.
          </p>
        </header>

        {status === AppStatus.SUCCESS && images.generated && images.original ? (
          <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in zoom-in duration-700">
            <ComparisonSlider before={images.original} after={images.generated} />
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={handleDownload}
                className="bg-gray-900 hover:bg-black text-white px-10 py-5 rounded-2xl font-bold shadow-2xl transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download Result
              </button>
              <button 
                onClick={reset}
                className="bg-white border border-gray-200 text-gray-700 px-10 py-5 rounded-2xl font-bold hover:bg-gray-50 transition-all shadow-sm"
              >
                Try Another Outfit
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-5xl mx-auto">
            <div className="space-y-6">
              <h2 className="text-lg font-bold flex items-center gap-2 text-gray-800">
                <span className="w-7 h-7 bg-blue-600 text-white rounded-xl flex items-center justify-center text-xs shadow-md">1</span>
                Upload Your Photo
              </h2>
              <Uploader 
                label="Clear, front-facing portrait"
                preview={images.original}
                onUpload={(b) => setImages(p => ({ ...p, original: b }))}
              />
            </div>

            <div className="space-y-6">
              <h2 className="text-lg font-bold flex items-center gap-2 text-gray-800">
                <span className="w-7 h-7 bg-blue-600 text-white rounded-xl flex items-center justify-center text-xs shadow-md">2</span>
                Choose Garment
              </h2>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <input 
                    type="text"
                    placeholder="Paste product link here..."
                    className="flex-1 bg-white border border-gray-200 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm font-medium text-sm placeholder:text-gray-300"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                  />
                  <button 
                    onClick={handleFetchProduct}
                    disabled={!url || status === AppStatus.EXTRACTING}
                    className="bg-blue-600 text-white px-8 rounded-2xl font-bold hover:bg-blue-700 disabled:opacity-50 transition-all shadow-lg shadow-blue-100 flex items-center justify-center min-w-[100px]"
                  >
                    {status === AppStatus.EXTRACTING ? (
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : 'Fetch'}
                  </button>
                </div>

                <div className="flex justify-center">
                   <button 
                     onClick={() => garmentInputRef.current?.click()}
                     className="text-[10px] font-black text-blue-600 hover:text-blue-800 uppercase tracking-widest transition-colors flex items-center gap-2 py-1"
                   >
                     <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                     </svg>
                     Or Upload Manually (Recommended for Amazon)
                   </button>
                   <input 
                     type="file" 
                     ref={garmentInputRef} 
                     className="hidden" 
                     accept="image/*" 
                     onChange={handleManualGarmentUpload} 
                   />
                </div>
                
                <div className="relative w-full aspect-square rounded-3xl border border-gray-200 bg-white shadow-sm flex items-center justify-center overflow-hidden transition-all group">
                  {images.product ? (
                    <img 
                      src={images.product} 
                      alt="Product" 
                      className="w-full h-full object-contain p-6 animate-in fade-in zoom-in duration-500" 
                    />
                  ) : (
                    <div className="text-center text-gray-300 p-8 space-y-3">
                      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto transition-transform group-hover:scale-110">
                        <svg className="w-8 h-8 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                      </div>
                      <p className="text-xs font-bold uppercase tracking-widest opacity-60">Waiting for Garment</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {status !== AppStatus.SUCCESS && (
          <div className="mt-16 text-center space-y-8">
            {error && (
              <div ref={errorRef} className="p-5 bg-red-50 text-red-600 rounded-3xl text-[11px] font-bold border border-red-100 flex items-center justify-center gap-4 max-w-lg mx-auto shadow-sm animate-in fade-in slide-in-from-top-2">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-left leading-relaxed">{error}</span>
              </div>
            )}
            
            <button 
              disabled={!images.original || !images.product || status === AppStatus.GENERATING}
              onClick={handleGenerate}
              className={`
                px-20 py-7 rounded-[2rem] text-2xl font-black shadow-2xl transition-all transform
                ${images.original && images.product 
                  ? 'bg-blue-600 text-white hover:bg-blue-700 hover:-translate-y-1 active:scale-95 shadow-blue-200' 
                  : 'bg-gray-100 text-gray-300 cursor-not-allowed'}
              `}
            >
              {status === AppStatus.GENERATING ? (
                <div className="flex flex-col items-center">
                  <span className="flex items-center gap-3">
                    <svg className="animate-spin h-6 w-6 text-white" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Dressing You Up...
                  </span>
                  <span className="text-xs font-medium opacity-60 mt-1 uppercase tracking-[0.2em]">{LOADING_MESSAGES[loadIdx]}</span>
                </div>
              ) : 'Visualize This Fit'}
            </button>
          </div>
        )}
      </main>

      <footer className="mt-32 border-t border-gray-100 pt-16 pb-24 text-center">
        <div className="max-w-4xl mx-auto space-y-6 opacity-40">
           <div className="flex justify-center gap-8 text-gray-400">
             <span className="font-bold tracking-[0.3em] text-[10px]">AMAZON</span>
             <span className="font-bold tracking-[0.3em] text-[10px]">ZARA</span>
             <span className="font-bold tracking-[0.3em] text-[10px]">H&M</span>
             <span className="font-bold tracking-[0.3em] text-[10px]">MYNTRA</span>
           </div>
           <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">
             VirtualFit AI Studio &copy; 2024 — High Precision Neural Rendering
           </p>
        </div>
      </footer>
    </div>
  );
};

export default App;


import React, { useState, useEffect, useRef } from 'react';
import { AppStatus, ImageState, GalleryItem, Recommendation } from './types';
import { extractProductImage, imageUrlToBase64 } from './services/extractionService';
import { generateTryOnImage, getFashionRecommendations } from './services/geminiService';
import Uploader from './components/Uploader';

const LOADING_MESSAGES = [
  "Getting your outfit ready...",
  "Adjusting the fit...",
  "Checking the lighting...",
  "Finalizing the look...",
  "Adding finishing touches...",
];

const App: React.FC = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [images, setImages] = useState<ImageState>({
    original: null,
    product: null,
    generated: null
  });
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [history, setHistory] = useState<GalleryItem[]>([]);
  const [url, setUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loadIdx, setLoadIdx] = useState(0);
  
  const errorRef = useRef<HTMLDivElement>(null);
  const galleryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('virtualfit_history');
    if (saved) {
      try { setHistory(JSON.parse(saved)); } catch (e) { console.error("Failed to parse history:", e); }
    }
    const savedTheme = localStorage.getItem('virtualfit_theme') as 'light' | 'dark';
    if (savedTheme) setTheme(savedTheme);
  }, []);

  useEffect(() => {
    localStorage.setItem('virtualfit_history', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    localStorage.setItem('virtualfit_theme', theme);
  }, [theme]);

  useEffect(() => {
    let interval: any;
    if (status === AppStatus.GENERATING) {
      interval = setInterval(() => {
        setLoadIdx(prev => (prev + 1) % LOADING_MESSAGES.length);
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [status]);

  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [error]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

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
        setError(result.error || 'Could not fetch image. Please upload it manually.');
        setStatus(AppStatus.ERROR);
      }
    } catch (err: any) {
      console.error("Fetch product failed:", err);
      setError('Connection failed. Please upload the clothing photo manually.');
      setStatus(AppStatus.ERROR);
    }
  };

  const handleGenerate = async () => {
    if (!images.original || !images.product) return;
    setStatus(AppStatus.GENERATING);
    setError(null);
    setRecommendations([]);

    try {
      let garmentData = images.product;
      if (!garmentData.startsWith('data:')) {
        const base64 = await imageUrlToBase64(garmentData);
        garmentData = `data:image/png;base64,${base64}`;
      }

      const [result, recs] = await Promise.all([
        generateTryOnImage(images.original, garmentData),
        getFashionRecommendations(images.original, garmentData)
      ]);
      
      const newItem: GalleryItem = {
        id: crypto.randomUUID(),
        original: images.original,
        generated: result,
        product: garmentData,
        recommendations: recs,
        timestamp: Date.now()
      };

      setHistory(prev => [newItem, ...prev]);
      setImages(prev => ({ ...prev, generated: result }));
      setRecommendations(recs);
      setStatus(AppStatus.SUCCESS);
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try clearer photos.');
      setStatus(AppStatus.ERROR);
    }
  };

  const reset = () => {
    setImages({ original: null, product: null, generated: null });
    setRecommendations([]);
    setStatus(AppStatus.IDLE);
    setUrl('');
    setError(null);
  };

  const tryAnotherItem = () => {
    setImages(prev => ({ ...prev, product: null, generated: null }));
    setRecommendations([]);
    setStatus(AppStatus.IDLE);
    setUrl('');
    setError(null);
  };

  const layerOnLook = () => {
    if (!images.generated) return;
    setImages({
      original: images.generated,
      product: null,
      generated: null
    });
    setRecommendations([]);
    setStatus(AppStatus.IDLE);
    setUrl('');
    setError(null);
  };

  const isDark = theme === 'dark';

  return (
    <div className={`min-h-screen transition-colors duration-500 ${isDark ? 'bg-[#050505] text-white' : 'bg-white text-black'} pb-32 selection:bg-current selection:text-white`}>
      {/* Navigation */}
      <nav className={`sticky top-0 z-50 border-b px-10 py-6 flex items-center justify-between backdrop-blur-md ${isDark ? 'bg-black/80 border-white/10' : 'bg-white/80 border-black/10'}`}>
        <div className="flex items-center gap-4">
          <div className={`w-8 h-8 flex items-center justify-center ${isDark ? 'bg-white' : 'bg-black'}`}>
            <div className={`w-4 h-4 border rotate-45 ${isDark ? 'border-black' : 'border-white'}`} />
          </div>
          <span className="font-black text-xl uppercase tracking-[0.5em]">VirtualFit</span>
        </div>
        <div className="flex gap-8 items-center">
          <button 
            onClick={toggleTheme}
            className={`p-2 rounded-full transition-colors flex items-center justify-center ${isDark ? 'hover:bg-white/10 text-white' : 'hover:bg-black/10 text-black'}`}
            title="Toggle Theme"
          >
            {isDark ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M16.243 17.657l.707.707M7.757 7.757l.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" /></svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
            )}
          </button>
          <button onClick={() => galleryRef.current?.scrollIntoView({ behavior: 'smooth' })} className={`text-[10px] font-black uppercase tracking-[0.3em] transition-opacity hidden md:block ${isDark ? 'text-white/60 hover:text-white' : 'text-black/60 hover:text-black'}`}>
            Saved Outfits
          </button>
          <button onClick={reset} className={`px-6 py-2 text-[10px] font-black uppercase tracking-[0.3em] transition-all ${isDark ? 'bg-white text-black hover:bg-white/80' : 'bg-black text-white hover:bg-black/80'}`}>
            Start Over
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-10 pt-12">
        {/* Header Section */}
        <header className="mb-16 space-y-4 max-w-4xl">
          <div className="flex items-center gap-4 mb-1">
            <div className={`h-px w-12 ${isDark ? 'bg-white/30' : 'bg-black/30'}`} />
            <span className={`text-[9px] font-black uppercase tracking-[0.4em] ${isDark ? 'text-white/60' : 'text-black/60'}`}>Your AI Dressing Room</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-[0.9] uppercase">
            Style <br/><span className={isDark ? 'text-white/20' : 'text-black/10'}>Unlocked.</span>
          </h1>
          <p className={`text-lg font-light leading-relaxed max-w-2xl ${isDark ? 'text-white/70' : 'text-black/70'}`}>
            See how any piece of clothing looks on you instantly. Just upload your photo and a link to the outfit.
          </p>
        </header>

        {status === AppStatus.SUCCESS && images.generated && images.original ? (
          <div className="space-y-20 animate-in fade-in duration-1000">
            {/* Main Visualizer - Side by Side */}
            <div className="max-w-5xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className={`text-[9px] font-black uppercase tracking-[0.3em] ${isDark ? 'text-white/60' : 'text-black/60'}`}>Original Photo</div>
                  <div className={`aspect-[3/4] border overflow-hidden flex items-center justify-center ${isDark ? 'border-white/10 bg-black/40' : 'border-black/10 bg-gray-100'}`}>
                    <img src={images.original} alt="Original" className="w-full h-full object-contain" />
                  </div>
                </div>
                <div className="space-y-3">
                  <div className={`text-[9px] font-black uppercase tracking-[0.3em] ${isDark ? 'text-white/60' : 'text-black/60'}`}>Generated Result</div>
                  <div className={`aspect-[3/4] border overflow-hidden flex items-center justify-center ${isDark ? 'border-white/20 bg-black/60 shadow-xl' : 'border-black/20 bg-white shadow-xl'}`}>
                    <img src={images.generated} alt="Generated" className="w-full h-full object-contain" />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Recommendations Section - Restored and High Contrast */}
            {recommendations.length > 0 && (
              <div className={`space-y-12 py-16 border-y ${isDark ? 'border-white/10' : 'border-black/10'}`}>
                <div className="flex items-end justify-between">
                  <div className="space-y-4">
                    <h3 className="text-3xl font-black tracking-tight uppercase">Complete Your Look</h3>
                    <p className={`text-[9px] tracking-[0.4em] uppercase ${isDark ? 'text-white/60' : 'text-black/60'}`}>Suggestions from our AI Stylist</p>
                  </div>
                  <div className={`h-px flex-1 mx-12 mb-4 ${isDark ? 'bg-white/10' : 'bg-black/10'}`} />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                  {recommendations.map((rec, i) => (
                    <div key={i} className={`flex flex-col border transition-all group overflow-hidden ${isDark ? 'bg-[#0d0d0d] border-white/10 hover:border-white/30' : 'bg-gray-50 border-black/10 hover:border-black/30'}`}>
                      <div className="aspect-[4/5] bg-black overflow-hidden relative">
                         <img 
                          src={rec.imageUrl || 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=800'} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000 opacity-70 group-hover:opacity-100" 
                          alt={rec.item}
                        />
                        <div className={`absolute top-6 left-6 px-3 py-1 backdrop-blur text-[9px] font-black uppercase tracking-widest border ${isDark ? 'bg-white/20 text-white border-white/20' : 'bg-black/20 text-black border-black/20'}`}>{rec.category}</div>
                      </div>
                      <div className="p-10 space-y-6 flex-1 flex flex-col justify-between">
                        <div className="space-y-4">
                          <h4 className="font-black text-2xl uppercase tracking-tight">{rec.item}</h4>
                          <p className={`text-sm font-medium leading-relaxed transition-colors ${isDark ? 'text-white/70 group-hover:text-white' : 'text-black/70 group-hover:text-black'}`}>{rec.reason}</p>
                        </div>
                        <div className={`pt-6 border-t flex items-center justify-between ${isDark ? 'border-white/10' : 'border-black/10'}`}>
                          <span className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-white/40' : 'text-black/40'}`}>{rec.brandSuggestion || 'Recommended'}</span>
                          <a 
                            href={rec.searchLink} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className={`text-[10px] font-black uppercase tracking-widest border-b transition-all pb-1 ${isDark ? 'border-white hover:border-white/60' : 'border-black hover:border-black/60'}`}
                          >
                            View Product
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col md:flex-row justify-center items-center gap-6">
              <button onClick={() => window.print()} className={`w-full md:w-auto border px-10 py-4 text-[9px] font-black uppercase tracking-[0.3em] transition-all ${isDark ? 'border-white/30 hover:bg-white hover:text-black' : 'border-black/30 hover:bg-black hover:text-white'}`}>
                Save Result
              </button>
              <button onClick={layerOnLook} className={`w-full md:w-auto px-10 py-4 text-[9px] font-black uppercase tracking-[0.3em] transition-all ${isDark ? 'bg-blue-600 text-white hover:bg-blue-500' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
                Layer on this look
              </button>
              <button onClick={tryAnotherItem} className={`w-full md:w-auto px-10 py-4 text-[9px] font-black uppercase tracking-[0.3em] transition-all ${isDark ? 'bg-white text-black hover:bg-white/80' : 'bg-black text-white hover:bg-black/80'}`}>
                Try Another Item
              </button>
              <button onClick={reset} className={`w-full md:w-auto px-10 py-4 text-[9px] font-black uppercase tracking-[0.3em] transition-all opacity-40 hover:opacity-100 ${isDark ? 'text-white' : 'text-black'}`}>
                Start Over
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
              {/* Step 1: Your Photo */}
              <div className="space-y-4 h-full flex flex-col">
                <div className="flex flex-col">
                   <label className={`text-[9px] font-black uppercase tracking-[0.3em] mb-1 ${isDark ? 'text-white/60' : 'text-black/60'}`}>Step 1</label>
                   <h3 className="text-lg font-black uppercase tracking-wider">Your Photo</h3>
                </div>
                <div className="flex-1">
                  <Uploader 
                    label="Upload a clear photo of yourself"
                    preview={images.original}
                    theme={theme}
                    onUpload={(b) => setImages(p => ({ ...p, original: b }))}
                    icon={<div className={`w-10 h-10 border ${isDark ? 'border-white/20' : 'border-black/20'}`} />}
                  />
                </div>
              </div>

              {/* Step 2: Clothing Item */}
              <div className="space-y-4 h-full flex flex-col">
                <div className="flex flex-col gap-2">
                  <label className={`text-[9px] font-black uppercase tracking-[0.3em] ${isDark ? 'text-white/60' : 'text-black/60'}`}>Step 2</label>
                  <div className="flex gap-3">
                    <input 
                      type="text"
                      placeholder="PASTE PRODUCT LINK..."
                      className={`flex-1 border px-6 py-3 text-[9px] font-black uppercase tracking-[0.2em] outline-none transition-all placeholder:opacity-50 ${isDark ? 'bg-[#0d0d0d] border-white/20 focus:border-white/50 text-white' : 'bg-gray-50 border-black/20 focus:border-black/50 text-black'}`}
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                    />
                    <button 
                      onClick={handleFetchProduct} 
                      disabled={!url || status === AppStatus.EXTRACTING}
                      className={`px-8 py-3 text-[9px] font-black uppercase tracking-[0.2em] transition-all disabled:opacity-30 ${isDark ? 'bg-white text-black hover:bg-white/80' : 'bg-black text-white hover:bg-black/80'}`}
                    >
                      {status === AppStatus.EXTRACTING ? "Wait" : "Find"}
                    </button>
                  </div>
                </div>
                <div className="flex-1">
                  <Uploader 
                    label="Photo of the clothing" 
                    preview={images.product} 
                    theme={theme}
                    onUpload={(b) => setImages(p => ({ ...p, product: b }))}
                    icon={<div className={`w-10 h-10 border ${isDark ? 'border-white/10' : 'border-black/10'}`} />}
                  />
                </div>
              </div>
            </div>

            {/* CTA Section */}
            <div className="text-center space-y-12 py-10">
              {error && (
                <div ref={errorRef} className={`text-[9px] font-black uppercase tracking-[0.3em] max-w-md mx-auto p-4 border ${isDark ? 'text-red-500 border-red-500/30 bg-red-500/5' : 'text-red-600 border-red-600/30 bg-red-50/50'}`}>
                  Note: {error}
                </div>
              )}
              <div className="flex justify-center">
                <button 
                  disabled={!images.original || !images.product || status === AppStatus.GENERATING}
                  onClick={handleGenerate}
                  className={`px-24 py-8 text-2xl font-black uppercase tracking-[0.05em] transition-all transform ${images.original && images.product ? (isDark ? 'bg-white text-black hover:scale-[1.02] active:scale-95 shadow-[0_0_80px_rgba(255,255,255,0.15)]' : 'bg-black text-white hover:scale-[1.02] active:scale-95 shadow-[0_0_80px_rgba(0,0,0,0.15)]') : (isDark ? 'bg-white/10 text-white/30 cursor-not-allowed border border-white/10' : 'bg-black/10 text-black/30 cursor-not-allowed border border-black/10')}`}
                >
                  {status === AppStatus.GENERATING ? (
                    <div className="flex flex-col items-center gap-4">
                      <div className="flex items-center gap-4">
                        <div className={`w-6 h-6 border-2 rounded-full animate-spin ${isDark ? 'border-black/30 border-t-black' : 'border-white/30 border-t-white'}`} />
                        <span>Working...</span>
                      </div>
                      <span className={`text-[9px] font-bold uppercase tracking-[0.5em] ${isDark ? 'text-black/60' : 'text-white/60'}`}>{LOADING_MESSAGES[loadIdx]}</span>
                    </div>
                  ) : 'Try it on'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Saved Section */}
        <section ref={galleryRef} className={`mt-32 border-t pt-20 ${isDark ? 'border-white/10' : 'border-black/10'}`}>
          <div className="flex items-center justify-between mb-12">
            <h2 className="text-4xl font-black uppercase tracking-tight">Collection</h2>
            <div className={`h-px flex-1 mx-12 ${isDark ? 'bg-white/10' : 'bg-black/10'}`} />
            <span className={`text-[10px] font-black tracking-widest ${isDark ? 'text-white/40' : 'text-black/40'}`}>{history.length} SAVED</span>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
            {history.map((item) => (
              <div key={item.id} className="group space-y-4">
                <div className={`aspect-[3/4] overflow-hidden border flex flex-col relative transition-all duration-500 ${isDark ? 'bg-[#0d0d0d] border-white/10' : 'bg-gray-50 border-black/10'}`}>
                  <img src={item.generated} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[1.5s] opacity-90 group-hover:opacity-100" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all flex items-center justify-center">
                    <button onClick={() => window.open(item.generated)} className="opacity-0 group-hover:opacity-100 border border-white text-white px-6 py-2 text-[9px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all">View</button>
                  </div>
                </div>
                <div className="flex items-start justify-between px-1">
                  <div className="space-y-1">
                    <p className={`text-[9px] font-black uppercase tracking-[0.3em] ${isDark ? 'text-white' : 'text-black'}`}>{new Date(item.timestamp).toLocaleDateString()}</p>
                    <p className={`text-[9px] font-medium uppercase tracking-widest ${isDark ? 'text-white/40' : 'text-black/40'}`}>Saved Outfit</p>
                  </div>
                  <div className={`w-8 h-8 border flex items-center justify-center transition-opacity ${isDark ? 'border-white/10 opacity-40 group-hover:opacity-100' : 'border-black/10 opacity-50 group-hover:opacity-100'}`}>
                    <div className={`w-1 h-1 rounded-full ${isDark ? 'bg-white' : 'bg-black'}`} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer Section */}
      <footer className={`mt-40 px-10 py-16 border-t ${isDark ? 'border-white/10 bg-[#080808]' : 'border-black/10 bg-gray-50'}`}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-12 opacity-60 hover:opacity-100 transition-opacity duration-700">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className={`w-5 h-5 border flex items-center justify-center rotate-45 ${isDark ? 'border-white' : 'border-black'}`} />
              <span className="text-[10px] font-black uppercase tracking-[0.5em]">VirtualFit AI</span>
            </div>
            <p className="text-[10px] font-medium max-w-sm leading-loose uppercase tracking-widest">Our AI technology lets you see yourself in new clothes before you buy. Simple, private, and fast.</p>
          </div>
          <div className="flex gap-20">
            <div className="space-y-4">
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Features</span>
              <ul className="text-[9px] font-medium space-y-2 uppercase tracking-[0.2em]">
                <li>Virtual Try-on</li>
                <li>Saved Outfits</li>
                <li>Style Advice</li>
              </ul>
            </div>
            <div className="space-y-4">
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Powered By</span>
              <ul className="text-[9px] font-medium space-y-2 uppercase tracking-[0.2em]">
                <li>Gemini AI</li>
                <li>Search Engine</li>
                <li>Fashion Models</li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;

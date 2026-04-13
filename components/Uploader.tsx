
import React, { useRef } from 'react';

interface UploaderProps {
  onUpload: (base64: string) => void;
  preview: string | null;
  label: string;
  theme?: 'light' | 'dark';
  icon?: React.ReactNode;
}

const Uploader: React.FC<UploaderProps> = ({ onUpload, preview, label, theme = 'light', icon }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isDark = theme === 'dark';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => onUpload(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col gap-3 h-full">
      <div 
        className={`relative w-full aspect-[3/4] rounded-none border transition-all flex flex-col items-center justify-center overflow-hidden group
          ${isDark ? 'bg-[#0d0d0d]' : 'bg-gray-50'}
          ${preview 
            ? (isDark ? 'border-white/40' : 'border-black/40') 
            : (isDark ? 'border-white/20 border-dashed hover:border-white/40 hover:bg-[#111]' : 'border-black/20 border-dashed hover:border-black/40 hover:bg-gray-100')
          }`}
      >
        {preview ? (
          <>
            <img 
              src={preview} 
              alt="Preview" 
              draggable="false"
              className="w-full h-full object-contain p-4" 
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/70 transition-all flex items-center justify-center">
              <button 
                onClick={() => fileInputRef.current?.click()}
                className={`opacity-0 group-hover:opacity-100 px-8 py-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-2xl
                  ${isDark ? 'bg-white text-black' : 'bg-black text-white'}`}
              >
                Change Image
              </button>
            </div>
          </>
        ) : (
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="text-center p-8 space-y-6 cursor-pointer w-full h-full flex flex-col justify-center items-center"
          >
            <div className={`w-14 h-14 flex items-center justify-center opacity-30 group-hover:opacity-100 transition-opacity`}>
              {icon || (
                <svg className={`w-10 h-10 ${isDark ? 'text-white' : 'text-black'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4v16m8-8H4" />
                </svg>
              )}
            </div>
            <div className="space-y-2">
              <p className={`text-[10px] font-black uppercase tracking-[0.3em] ${isDark ? 'text-white' : 'text-black'}`}>Choose Image</p>
              <p className={`text-[9px] font-bold uppercase tracking-widest ${isDark ? 'text-white/60' : 'text-black/60'}`}>{label}</p>
            </div>
          </div>
        )}
        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
      </div>
    </div>
  );
};

export default Uploader;

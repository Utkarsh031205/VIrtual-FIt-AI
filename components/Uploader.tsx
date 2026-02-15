
import React, { useRef } from 'react';

interface UploaderProps {
  onUpload: (base64: string) => void;
  preview: string | null;
  label: string;
}

const Uploader: React.FC<UploaderProps> = ({ onUpload, preview, label }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpload(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-semibold text-gray-500 ml-1 uppercase tracking-wider text-[10px]">{label}</label>
      <div 
        onClick={() => fileInputRef.current?.click()}
        className={`relative w-full aspect-square rounded-3xl border-2 border-dashed transition-all flex items-center justify-center cursor-pointer overflow-hidden group
          ${preview ? 'border-transparent shadow-xl' : 'border-gray-200 hover:border-blue-400 bg-white hover:bg-blue-50/30'}`}
      >
        {preview ? (
          <img 
            src={preview} 
            alt="Preview" 
            draggable="false"
            className="w-full h-full object-cover transition-transform group-hover:scale-105" 
          />
        ) : (
          <div className="text-center p-6 space-y-4">
            <div className="bg-gray-50 w-16 h-16 rounded-3xl flex items-center justify-center mx-auto transition-transform group-hover:rotate-6 group-hover:scale-110 shadow-sm border border-gray-100">
              <svg className="w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-gray-700">Drop your photo</p>
              <p className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">JPG, PNG up to 10MB</p>
            </div>
          </div>
        )}
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/*" 
          onChange={handleFileChange} 
        />
      </div>
    </div>
  );
};

export default Uploader;

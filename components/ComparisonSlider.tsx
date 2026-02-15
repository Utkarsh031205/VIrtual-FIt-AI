
import React, { useState, useRef, useCallback } from 'react';

interface ComparisonSliderProps {
  before: string;
  after: string;
}

const ComparisonSlider: React.FC<ComparisonSliderProps> = ({ before, after }) => {
  const [sliderPos, setSliderPos] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const position = (x / rect.width) * 100;
    setSliderPos(Math.min(Math.max(position, 0), 100));
  }, []);

  const onMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    handleMove(e.clientX);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    isDragging.current = true;
    handleMove(e.touches[0].clientX);
  };

  const onMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isDragging.current) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
    handleMove(clientX);
  }, [handleMove]);

  const onEnd = useCallback(() => {
    isDragging.current = false;
  }, []);

  // Use global listeners for better drag experience even if mouse leaves container
  React.useEffect(() => {
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onEnd);
    window.addEventListener('touchmove', onMove);
    window.addEventListener('touchend', onEnd);

    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onEnd);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
    };
  }, [onMove, onEnd]);

  return (
    <div 
      ref={containerRef}
      className="relative w-full aspect-square md:aspect-video rounded-3xl overflow-hidden cursor-col-resize select-none border border-gray-200 shadow-2xl touch-none"
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
    >
      {/* After Image (Base) */}
      <img 
        src={after} 
        alt="After" 
        draggable="false"
        className="absolute top-0 left-0 w-full h-full object-cover pointer-events-none"
      />

      {/* Before Image (Revealer) */}
      <div 
        className="absolute top-0 left-0 h-full overflow-hidden border-r-4 border-white z-10"
        style={{ width: `${sliderPos}%` }}
      >
        <img 
          src={before} 
          alt="Before" 
          draggable="false"
          className="absolute top-0 left-0 h-full object-cover pointer-events-none"
          style={{ 
            width: containerRef.current ? `${containerRef.current.offsetWidth}px` : '100vw',
            maxWidth: 'none'
          }}
        />
      </div>

      {/* Slider Handle */}
      <div 
        className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_15px_rgba(0,0,0,0.3)] pointer-events-none z-20"
        style={{ left: `${sliderPos}%` }}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full shadow-2xl flex items-center justify-center border-4 border-blue-500/10">
          <div className="flex gap-1">
             <svg className="w-4 h-4 text-blue-600 fill-current" viewBox="0 0 24 24">
                <path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6 1.41-1.41z" />
             </svg>
             <svg className="w-4 h-4 text-blue-600 fill-current" viewBox="0 0 24 24">
                <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" />
             </svg>
          </div>
        </div>
      </div>
      
      {/* Labels */}
      <div className="absolute top-6 left-6 z-30 px-4 py-1.5 bg-black/40 backdrop-blur-md border border-white/20 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg">
        Original
      </div>
      <div className="absolute top-6 right-6 z-30 px-4 py-1.5 bg-blue-600/60 backdrop-blur-md border border-white/20 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg">
        Virtual Fit
      </div>
    </div>
  );
};

export default ComparisonSlider;

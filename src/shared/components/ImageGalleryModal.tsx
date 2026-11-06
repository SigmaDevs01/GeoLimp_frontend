import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react';

interface ImageGalleryModalProps {
  isOpen: boolean;
  photos: string[];
  initialIndex?: number;
  title?: string;
  onClose: () => void;
}

export function ImageGalleryModal({
  isOpen,
  photos,
  initialIndex = 0,
  title,
  onClose,
}: ImageGalleryModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
    }
  }, [isOpen, initialIndex]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : photos.length - 1));
  }, [photos.length]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev < photos.length - 1 ? prev + 1 : 0));
  }, [photos.length]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, handlePrev, handleNext]);

  if (!isOpen || !photos || photos.length === 0) return null;

  const currentPhoto = photos[currentIndex] || photos[0];

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      data-modal="true"
      className="image-gallery-modal fixed inset-0 z-[300] flex flex-col items-center justify-between bg-black/90 p-4 animate-in fade-in duration-200 pointer-events-auto select-none"
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Top Bar: Title, Counter and Close Button */}
      <div
        className="w-full flex items-center justify-between px-2 sm:px-6 py-2 text-white z-10"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-white/10">
            <ImageIcon size={20} className="text-primary" />
          </div>
          <div>
            <h4 className="text-sm sm:text-base font-semibold leading-tight text-white drop-shadow">
              {title || 'Fotos da Denúncia'}
            </h4>
            {photos.length > 1 && (
              <p className="text-xs text-white/70">
                Foto {currentIndex + 1} de {photos.length}
              </p>
            )}
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors"
          title="Fechar (Esc)"
        >
          <X size={22} />
        </button>
      </div>

      {/* Main Image Area with Prev / Next Navigation */}
      <div
        className="relative flex-1 w-full max-w-5xl flex items-center justify-center my-2 overflow-hidden"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Previous Button */}
        {photos.length > 1 && (
          <button
            onClick={handlePrev}
            className="absolute left-2 sm:left-4 z-20 p-2.5 sm:p-3 rounded-full bg-black/60 hover:bg-black/90 text-white/90 hover:text-white transition-all hover:scale-105 active:scale-95 border border-white/10"
            title="Foto anterior (Seta esquerda)"
          >
            <ChevronLeft size={26} />
          </button>
        )}

        {/* Current Image */}
        <div className="w-full h-full flex items-center justify-center p-2">
          <img
            key={currentPhoto}
            src={currentPhoto}
            alt={`Foto ${currentIndex + 1} da denúncia`}
            className="max-w-full max-h-[72vh] object-contain rounded-2xl shadow-2xl transition-all duration-300 animate-in zoom-in-95"
          />
        </div>

        {/* Next Button */}
        {photos.length > 1 && (
          <button
            onClick={handleNext}
            className="absolute right-2 sm:right-4 z-20 p-2.5 sm:p-3 rounded-full bg-black/60 hover:bg-black/90 text-white/90 hover:text-white transition-all hover:scale-105 active:scale-95 border border-white/10"
            title="Próxima foto (Seta direita)"
          >
            <ChevronRight size={26} />
          </button>
        )}
      </div>

      {/* Bottom Thumbnail Strip */}
      {photos.length > 1 && (
        <div
          className="w-full max-w-xl flex items-center justify-center gap-2 px-4 py-2 overflow-x-auto custom-scrollbar z-10"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          {photos.map((photo, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`relative h-14 w-14 sm:h-16 sm:w-16 rounded-xl overflow-hidden shrink-0 border-2 transition-all ${
                idx === currentIndex
                  ? 'border-primary ring-2 ring-primary/40 scale-105 shadow-lg'
                  : 'border-white/20 opacity-60 hover:opacity-100 hover:border-white/50'
              }`}
            >
              <img
                src={photo}
                alt={`Miniatura ${idx + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>,
    document.body
  );
}


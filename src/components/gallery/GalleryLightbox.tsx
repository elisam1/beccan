import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useEffect } from 'react';
import { GalleryItem } from '../../types/school';
import { SchoolImage } from '../common/SchoolImage';

interface GalleryLightboxProps {
  items: GalleryItem[];
  activeIndex: number | null;
  onClose: () => void;
  onChangeIndex: (nextIndex: number) => void;
}

export function GalleryLightbox({
  items,
  activeIndex,
  onClose,
  onChangeIndex,
}: GalleryLightboxProps) {
  const isOpen = activeIndex !== null && items[activeIndex] !== undefined;
  const activeItem = isOpen ? items[activeIndex] : null;

  useEffect(() => {
    if (!isOpen || activeIndex === null) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      } else if (event.key === 'ArrowLeft') {
        const prev = (activeIndex - 1 + items.length) % items.length;
        onChangeIndex(prev);
      } else if (event.key === 'ArrowRight') {
        const next = (activeIndex + 1) % items.length;
        onChangeIndex(next);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, activeIndex, items.length, onClose, onChangeIndex]);

  if (!isOpen || activeIndex === null || !activeItem) return null;

  const handlePrev = () => {
    onChangeIndex((activeIndex - 1 + items.length) % items.length);
  };

  const handleNext = () => {
    onChangeIndex((activeIndex + 1) % items.length);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#0A1629]/85 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-label={`Gallery viewer: ${activeItem.title}`}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl bg-[#FBF9F5] border border-[#E6DFD3] shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3.5 bg-[#0F213E] text-[#FBF9F5]">
          <p className="text-xs uppercase tracking-[0.16em] text-[#D4B46E] tabular-nums">
            Fig. {activeIndex + 1} of {items.length} · {activeItem.category}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="min-w-[40px] min-h-[40px] inline-flex items-center justify-center text-[#FBF9F5] hover:text-[#D4B46E] transition-colors"
            aria-label="Close lightbox"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          <div className="bg-[#0A1629]">
            <SchoolImage
              src={activeItem.imageUrl}
              alt={activeItem.imageAlt || activeItem.title}
              title={activeItem.title}
              verificationStatus={activeItem.verificationStatus}
              placeholderLabel={
                activeItem.verificationStatus === 'safeguarding-hold'
                  ? 'Safeguarding Hold · Parental Consent Required'
                  : 'Official Photography Slot Reserved'
              }
              aspectRatioClass="aspect-[16/10] max-h-[56vh] mx-auto"
              imgClassName="object-contain bg-[#0A1629]"
            />
          </div>

          <div className="p-6 sm:p-7 space-y-3">
            <h3 className="font-serif text-2xl font-semibold text-[#0F213E]">
              {activeItem.title}
            </h3>
            <p className="text-sm sm:text-base text-[#333D4D] leading-relaxed">
              {activeItem.caption}
            </p>
            {activeItem.safeguardingNote && (
              <p className="text-xs font-medium text-[#8D6A26]">
                Safeguarding Policy: {activeItem.safeguardingNote}
              </p>
            )}
            <p className="text-xs text-[#5B6472] pt-2 border-t border-[#E6DFD3]">
              Source: {activeItem.sourceAttribution} · {activeItem.dateLabel}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between px-5 py-3 bg-[#F4EFE6] border-t border-[#E6DFD3]">
          <button
            type="button"
            onClick={handlePrev}
            className="min-h-[44px] inline-flex items-center gap-2 px-4 py-2 bg-[#FFFFFF] border border-[#D4C8B4] text-sm font-medium text-[#0F213E] hover:border-[#0F213E] transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>
          <span className="hidden sm:inline text-xs text-[#5B6472]">
            Use arrow keys to navigate or Esc to close
          </span>
          <button
            type="button"
            onClick={handleNext}
            className="min-h-[44px] inline-flex items-center gap-2 px-4 py-2 bg-[#FFFFFF] border border-[#D4C8B4] text-sm font-medium text-[#0F213E] hover:border-[#0F213E] transition-colors"
          >
            <span>Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

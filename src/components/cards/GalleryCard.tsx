import { Maximize2 } from 'lucide-react';
import { GalleryItem } from '../../types/school';
import { SchoolImage } from '../common/SchoolImage';

interface GalleryCardProps {
  item: GalleryItem;
  onSelect: (item: GalleryItem) => void;
}

export function GalleryCard({ item, onSelect }: GalleryCardProps) {
  return (
    <article className="bg-[#FFFFFF] border border-[#E6DFD3] flex flex-col group">
      <button
        type="button"
        onClick={() => onSelect(item)}
        className="relative text-left w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B58E43] cursor-pointer"
        aria-label={`Inspect ${item.title}`}
      >
        <SchoolImage
          src={item.imageUrl}
          alt={item.imageAlt || item.title}
          title={item.title}
          aspectRatioClass="aspect-[4/3]"
          imgClassName="transition-transform duration-300 group-hover:scale-[1.03]"
        />
        <span className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0F213E]/90 text-[#FBF9F5] text-xs font-medium">
          <Maximize2 className="w-3.5 h-3.5" />
          <span>Inspect</span>
        </span>
      </button>

      <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-[#5B6472] mb-2">
            <span className="uppercase tracking-[0.14em] text-[#8D6A26] font-medium">
              {item.category}
            </span>
            <span aria-hidden="true">·</span>
            <span>{item.dateLabel}</span>
          </div>

          <h3 className="font-serif text-xl font-semibold text-[#0F213E] leading-snug">
            {item.title}
          </h3>
          <p className="mt-2 text-sm text-[#333D4D] leading-relaxed">
            {item.caption}
          </p>
        </div>
      </div>
    </article>
  );
}

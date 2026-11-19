import { Building2 } from 'lucide-react';
import { useState } from 'react';

interface SchoolImageProps {
  src?: string;
  alt: string;
  title: string;
  aspectRatioClass?: string;
  className?: string;
  imgClassName?: string;
}

export function SchoolImage({
  src,
  alt,
  title,
  aspectRatioClass = 'aspect-[4/3]',
  className = '',
  imgClassName = '',
}: SchoolImageProps) {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return (
      <div
        className={`relative overflow-hidden bg-[#F4EFE6] border border-[#E6DFD3] flex flex-col items-center justify-center text-center p-6 ${aspectRatioClass} ${className}`}
        role="img"
        aria-label={alt}
      >
        <div
          className="absolute inset-4 border border-[#E6DFD3] pointer-events-none"
          aria-hidden="true"
        />
        <div className="relative z-10 max-w-xs space-y-2.5">
          <div className="mx-auto w-10 h-10 flex items-center justify-center border border-[#D4C8B4] bg-[#FBF9F5] text-[#0F213E]">
            <Building2 className="w-5 h-5 text-[#0F213E]" />
          </div>
          <p className="font-serif text-lg text-[#0F213E] leading-snug">{title}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden bg-[#F4EFE6] ${aspectRatioClass} ${className}`}
    >
      <img
        src={src}
        alt={alt}
        loading="lazy"
        referrerPolicy="no-referrer"
        onError={() => setHasError(true)}
        className={`w-full h-full object-cover ${imgClassName}`}
      />
    </div>
  );
}

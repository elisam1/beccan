import { FacilityItem } from '../../types/school';
import { SchoolImage } from '../common/SchoolImage';

interface FacilityCardProps {
  facility: FacilityItem;
}

export function FacilityCard({ facility }: FacilityCardProps) {
  return (
    <article className="bg-[#FFFFFF] border border-[#E6DFD3] flex flex-col">
      {facility.imageUrl && (
        <SchoolImage
          src={facility.imageUrl}
          alt={facility.imageAlt || `${facility.title} at Beccan School, Dodowa`}
          title={facility.title}
          aspectRatioClass="aspect-[16/10]"
        />
      )}

      <div className="p-6 sm:p-7 flex-1 flex flex-col">
        <p className="text-xs uppercase tracking-[0.14em] text-[#8D6A26] font-medium mb-2.5">
          {facility.category}
        </p>

        <h3 className="font-serif text-2xl font-semibold text-[#0F213E] leading-snug">
          {facility.title}
        </h3>

        <p className="mt-3 text-sm sm:text-base text-[#333D4D] leading-relaxed">
          {facility.summary}
        </p>

        <ul className="mt-5 pt-4 border-t border-[#E6DFD3] space-y-2 text-sm text-[#333D4D]">
          {facility.observedDetails.map((detail) => (
            <li key={detail} className="flex items-start gap-2.5">
              <span
                className="w-1.5 h-1.5 bg-[#B58E43] mt-2 shrink-0"
                aria-hidden="true"
              />
              <span>{detail}</span>
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}

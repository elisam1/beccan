import { AlertCircle, ShieldCheck } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import campusPhoto from '../assets/images/beccan_campus_building.jpg';
import { GalleryCard } from '../components/cards/GalleryCard';
import { GalleryLightbox } from '../components/gallery/GalleryLightbox';
import { PageBanner } from '../components/layout/PageBanner';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import {
  ApiError,
  cmsApi,
  GALLERY_CATEGORIES,
} from '../services/cmsApi';
import { CmsGalleryPhoto } from '../types/cms';
import { GalleryItem } from '../types/school';
import { formatDisplayDate } from '../utils/formatting';

const categories = ['All', ...GALLERY_CATEGORIES] as const;

const verifiedArchiveItem: GalleryItem = {
  id: 'verified-campus-archive',
  title: 'Main Campus Building & Courtyard',
  category: 'Campus & Grounds',
  caption:
    'Two-storey main school building, covered veranda, single-storey classroom wing, enclosed trampoline, and painted tire courtyard at Beccan School in Dodowa.',
  sourceAttribution: 'Official website archive (beccanschool.site)',
  dateLabel: 'Verified archive photo',
  imageUrl: campusPhoto,
  imageAlt:
    'Beccan School Dodowa campus showing the main two-storey building, classroom wing, trampoline, and painted tire courtyard.',
  verificationStatus: 'verified',
};

export function GalleryPage() {
  useDocumentMeta({
    title: 'Gallery',
    description:
      'View verified and administrator-published campus photography of Beccan School in Dodowa, Ghana.',
  });

  const [publishedPhotos, setPublishedPhotos] = useState<CmsGalleryPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiNotice, setApiNotice] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    cmsApi
      .listPublicGallery()
      .then((res) => {
        if (active) {
          setPublishedPhotos(res.items);
          setApiNotice(null);
        }
      })
      .catch((err) => {
        if (active) {
          setApiNotice(
            err instanceof ApiError
              ? err.message
              : 'Live gallery feed is unavailable in this environment.',
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const displayItems: GalleryItem[] = useMemo(() => {
    const mappedCms: GalleryItem[] = publishedPhotos
      .filter(
        (photo) =>
          selectedCategory === 'All' || photo.category === selectedCategory,
      )
      .map((photo) => ({
        id: photo.id,
        title: photo.caption,
        category: photo.category as GalleryItem['category'],
        caption: photo.description || photo.caption,
        sourceAttribution: 'Beccan School Administration',
        dateLabel: `Published ${formatDisplayDate(photo.publishedAt || photo.uploadedAt)}`,
        imageUrl: photo.imageUrl,
        imageAlt: photo.caption,
        verificationStatus: 'verified',
      }));

    if (selectedCategory === 'All' || selectedCategory === 'Facilities') {
      return [...mappedCms, verifiedArchiveItem];
    }
    return mappedCms;
  }, [publishedPhotos, selectedCategory]);

  return (
    <div>
      <PageBanner
        kicker="School Gallery"
        title="Campus photography & visual archive."
        subtitle="Published campus photographs from Beccan School administration alongside our verified campus archive."
        currentPageLabel="Gallery"
      />

      {/* Safeguarding Notice */}
      <section className="bg-[#F4EFE6] border-b border-[#E6DFD3] py-6">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 flex items-start gap-3 text-sm text-[#333D4D]">
          <ShieldCheck className="w-5 h-5 text-[#8D6A26] shrink-0 mt-0.5" />
          <p>
            <strong>Child-Safeguarding & Consent Policy:</strong> Only
            photographs explicitly published by Beccan School administration
            appear here. A legacy swimming photograph from beccanschool.site
            remains withheld until signed parental image-use consent is
            confirmed.
          </p>
        </div>
      </section>

      <section className="py-14 sm:py-18 bg-[#FBF9F5]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
            <div
              className="inline-flex flex-wrap items-center gap-1.5 p-1 bg-[#F4EFE6] border border-[#E6DFD3]"
              role="group"
              aria-label="Filter gallery by category"
            >
              {categories.map((category) => {
                const isActive = selectedCategory === category;
                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() => {
                      setSelectedCategory(category);
                      setLightboxIndex(null);
                    }}
                    className={`min-h-[40px] px-3.5 py-2 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      isActive
                        ? 'bg-[#0F213E] text-[#FBF9F5]'
                        : 'text-[#333D4D] hover:text-[#0F213E] hover:bg-[#FFFFFF]/70'
                    }`}
                  >
                    {category}
                  </button>
                );
              })}
            </div>

            <p className="text-xs text-[#5B6472] tabular-nums">
              Showing {displayItems.length} published photograph
              {displayItems.length === 1 ? '' : 's'}
            </p>
          </div>

          {apiNotice && (
            <div className="mb-8 p-4 bg-[#FFFFFF] border border-[#E6DFD3] flex items-start gap-3 text-xs sm:text-sm text-[#5B6472]">
              <AlertCircle className="w-4 h-4 text-[#8D6A26] shrink-0 mt-0.5" />
              <span>
                {apiNotice} Showing verified campus archive photography only.
              </span>
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="h-80 bg-[#FFFFFF] border border-[#E6DFD3] animate-pulse"
                />
              ))}
            </div>
          ) : displayItems.length === 0 ? (
            <div className="p-12 bg-[#FFFFFF] border border-[#E6DFD3] text-center space-y-2">
              <p className="font-serif text-2xl font-semibold text-[#0F213E]">
                No published photographs in {selectedCategory} yet
              </p>
              <p className="text-sm text-[#5B6472]">
                Photographs published by Beccan School administration under{' '}
                {selectedCategory} will appear here automatically.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
              {displayItems.map((item, idx) => (
                <GalleryCard
                  key={item.id}
                  item={item}
                  onSelect={() => setLightboxIndex(idx)}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <GalleryLightbox
        items={displayItems}
        activeIndex={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onChangeIndex={setLightboxIndex}
      />
    </div>
  );
}

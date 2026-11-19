import { ArrowRight } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import campusPhoto from '../assets/images/beccan_campus_building.jpg';
import { GalleryCard } from '../components/cards/GalleryCard';
import { WhatsAppIcon } from '../components/common/WhatsAppIcon';
import { GalleryLightbox } from '../components/gallery/GalleryLightbox';
import { PageBanner } from '../components/layout/PageBanner';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import { cmsApi, GALLERY_CATEGORIES } from '../services/cmsApi';
import { CmsGalleryPhoto } from '../types/cms';
import { GalleryItem } from '../types/school';
import { formatDisplayDate } from '../utils/formatting';
import { buildWhatsAppUrl, WHATSAPP_MESSAGES } from '../utils/whatsapp';

const categories = ['All', ...GALLERY_CATEGORIES] as const;

const campusArchiveItem: GalleryItem = {
  id: 'campus-main-courtyard',
  title: 'Main Campus Building & Courtyard',
  category: 'Campus & Grounds',
  caption:
    'Two-storey main school building, covered veranda, single-storey classroom wing, enclosed trampoline, and painted tire courtyard at Beccan School in Dodowa.',
  dateLabel: 'Dodowa Campus',
  imageUrl: campusPhoto,
  imageAlt:
    'Beccan School campus building, classroom wing, covered veranda, and courtyard in Dodowa.',
};

export function GalleryPage() {
  useDocumentMeta({
    title: 'Gallery',
    description:
      'View campus photography, learning spaces, and school life at Beccan School in Dodowa, Ghana.',
  });

  const [publishedPhotos, setPublishedPhotos] = useState<CmsGalleryPhoto[]>([]);
  const [loading, setLoading] = useState(true);
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
        }
      })
      .catch(() => {
        if (active) {
          setPublishedPhotos([]);
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
        dateLabel: `Published ${formatDisplayDate(photo.publishedAt || photo.uploadedAt)}`,
        imageUrl: photo.imageUrl,
        imageAlt: photo.caption,
      }));

    if (selectedCategory === 'All' || selectedCategory === 'Facilities') {
      return [...mappedCms, campusArchiveItem];
    }
    return mappedCms;
  }, [publishedPhotos, selectedCategory]);

  return (
    <div>
      <PageBanner
        kicker="School Gallery"
        title="Campus photography & school life."
        subtitle="Explore our Dodowa campus buildings, courtyard, learning environments, and student activities."
        currentPageLabel="Gallery"
      />

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
              Showing {displayItems.length} photograph
              {displayItems.length === 1 ? '' : 's'}
            </p>
          </div>

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
                No photographs in {selectedCategory} yet
              </p>
              <p className="text-sm text-[#5B6472]">
                Additional school photographs added under {selectedCategory} will
                appear here.
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

          <div className="mt-12 p-8 bg-[#FFFFFF] border border-[#E6DFD3] flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.16em] text-[#8D6A26] font-medium">
                Campus Visits
              </p>
              <h2 className="font-serif text-2xl font-semibold text-[#0F213E]">
                Would you like to visit Beccan School in person?
              </h2>
              <p className="text-sm text-[#4A5568] max-w-xl">
                Chat with our Dodowa school office on WhatsApp to arrange a tour
                or ask about admissions.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <a
                href={buildWhatsAppUrl(WHATSAPP_MESSAGES.campusVisit)}
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-[44px] inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#128C7E] text-[#FFFFFF] text-sm font-semibold hover:bg-[#0E7367] transition-colors whitespace-nowrap"
              >
                <WhatsAppIcon className="w-4 h-4" />
                <span>Arrange Visit on WhatsApp</span>
              </a>
              <Link
                to="/admissions"
                className="min-h-[44px] inline-flex items-center justify-center gap-2 px-5 py-2.5 border border-[#D4C8B4] text-[#0F213E] text-sm font-medium hover:border-[#0F213E] transition-colors whitespace-nowrap"
              >
                <span>Admissions</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
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

import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { FacilityCard } from '../components/cards/FacilityCard';
import { SectionHeading } from '../components/common/SectionHeading';
import { WhatsAppIcon } from '../components/common/WhatsAppIcon';
import { PageBanner } from '../components/layout/PageBanner';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import { schoolRepository } from '../services/schoolRepository';
import { buildWhatsAppUrl, WHATSAPP_MESSAGES } from '../utils/whatsapp';

export function FacilitiesPage() {
  useDocumentMeta({
    title: 'Facilities',
    description:
      'Explore Beccan School’s campus buildings, courtyard play area, and learning spaces in Dodowa, Ghana.',
  });

  const facilities = schoolRepository.getFacilities();
  const facilitiesWhatsappUrl = buildWhatsAppUrl(WHATSAPP_MESSAGES.facilities);

  return (
    <div>
      <PageBanner
        kicker="Campus & Facilities"
        title="Our Dodowa learning environment."
        subtitle="Explore Beccan School’s campus buildings, classroom spaces, and enclosed courtyard recreation area."
        currentPageLabel="Facilities"
      />

      <section className="py-16 sm:py-20 bg-[#FBF9F5]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            kicker="Campus Overview"
            title="Buildings, Learning Spaces & Compound"
            className="mb-10"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {facilities.map((facility) => (
              <FacilityCard key={facility.id} facility={facility} />
            ))}
          </div>

          <div className="mt-12 p-8 bg-[#FFFFFF] border border-[#E6DFD3] flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div>
              <h3 className="font-serif text-2xl font-semibold text-[#0F213E]">
                See the campus in person
              </h3>
              <p className="mt-1 text-sm text-[#4A5568]">
                Parents are welcome to schedule a guided tour of the Dodowa
                campus on WhatsApp or by calling{' '}
                <span className="tabular-nums">024-740-1641</span>.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <a
                href={facilitiesWhatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-[44px] inline-flex items-center gap-2 px-5 py-3 bg-[#15803D] text-[#FFFFFF] text-sm font-semibold hover:bg-[#166534] transition-colors whitespace-nowrap"
              >
                <WhatsAppIcon className="w-4 h-4 shrink-0" />
                <span>Enquire on WhatsApp</span>
              </a>
              <Link
                to="/contact"
                className="min-h-[44px] inline-flex items-center gap-2 px-5 py-3 bg-[#0F213E] text-[#FBF9F5] text-sm font-medium hover:bg-[#172E54] transition-colors whitespace-nowrap"
              >
                <span>Contact Details</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

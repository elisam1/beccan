import { ArrowRight, Info } from 'lucide-react';
import { Link } from 'react-router-dom';
import { FacilityCard } from '../components/cards/FacilityCard';
import { SectionHeading } from '../components/common/SectionHeading';
import { PageBanner } from '../components/layout/PageBanner';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import { schoolRepository } from '../services/schoolRepository';

export function FacilitiesPage() {
  useDocumentMeta({
    title: 'Facilities',
    description:
      'Explore Beccan School’s campus building, courtyard play area, classrooms, library, and ICT resource profiles in Dodowa, Ghana.',
  });

  const facilities = schoolRepository.getFacilities();

  return (
    <div>
      <PageBanner
        kicker="Campus & Facilities"
        title="Our Dodowa learning environment."
        subtitle="An honest overview of Beccan School’s compound, buildings, courtyard recreation space, and resource areas awaiting official verification."
        currentPageLabel="Facilities"
      />

      <section className="bg-[#F4EFE6] border-b border-[#E6DFD3] py-6">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 flex items-start gap-3 text-sm text-[#333D4D]">
          <Info className="w-5 h-5 text-[#8D6A26] shrink-0 mt-0.5" />
          <p>
            <strong>Visual Verification Standard:</strong> Only facilities
            directly visible in Beccan School’s authentic campus photograph
            (two-storey main building, single-storey classroom wing, covered
            porch, trampoline, and tire courtyard) are marked as visually
            verified. Interior spaces such as classrooms, library, and ICT
            resources carry structured placeholders awaiting official school
            photography and confirmation.
          </p>
        </div>
      </section>

      <section className="py-16 sm:py-20 bg-[#FBF9F5]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            kicker="Campus Inventory"
            title="Buildings, Learning Spaces & Compound"
            className="mb-10"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {facilities.map((facility) => (
              <FacilityCard key={facility.id} facility={facility} />
            ))}
          </div>

          <div className="mt-12 p-8 bg-[#FFFFFF] border border-[#E6DFD3] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <h3 className="font-serif text-2xl font-semibold text-[#0F213E]">
                See the campus in person
              </h3>
              <p className="mt-1 text-sm text-[#4A5568]">
                Parents are welcome to schedule a guided tour of the Dodowa
                campus by calling 024-740-1641.
              </p>
            </div>
            <Link
              to="/contact"
              className="min-h-[44px] inline-flex items-center gap-2 px-6 py-3 bg-[#0F213E] text-[#FBF9F5] text-sm font-medium hover:bg-[#172E54] transition-colors whitespace-nowrap shrink-0"
            >
              <span>Schedule a Campus Visit</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

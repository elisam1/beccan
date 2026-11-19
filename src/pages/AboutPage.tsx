import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SectionHeading } from '../components/common/SectionHeading';
import { WhatsAppIcon } from '../components/common/WhatsAppIcon';
import { PageBanner } from '../components/layout/PageBanner';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import { schoolRepository } from '../services/schoolRepository';
import { buildWhatsAppUrl, WHATSAPP_MESSAGES } from '../utils/whatsapp';

export function AboutPage() {
  useDocumentMeta({
    title: 'About Us',
    description:
      'Learn about Beccan School in Dodowa, Ghana—our motto, vision, mission, core values, and school anthem.',
  });

  const profile = schoolRepository.getProfile();
  const whatsappHref = buildWhatsAppUrl(WHATSAPP_MESSAGES.general);

  return (
    <div>
      <PageBanner
        kicker="About Beccan School"
        title="Excellence, discipline, and purposeful growth in Dodowa."
        subtitle="An educational home committed to intellectual curiosity, personal integrity, and supportive community partnership."
        currentPageLabel="About Us"
      />

      {/* Introduction & Community Context */}
      <section className="py-16 sm:py-20 bg-[#FBF9F5]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            <div className="lg:col-span-7 space-y-5">
              <SectionHeading
                kicker="Who We Are"
                title="More than classroom instruction."
              />
              <div className="space-y-4 text-base text-[#333D4D] leading-[1.75]">
                {profile.welcomeParagraphs.map((para) => (
                  <p key={para}>{para}</p>
                ))}
              </div>
            </div>

            <div className="lg:col-span-5 space-y-6">
              <div className="p-7 bg-[#FFFFFF] border border-[#E6DFD3]">
                <p className="text-xs uppercase tracking-[0.16em] text-[#8D6A26] font-medium mb-2">
                  Our Campus & Community
                </p>
                <h3 className="font-serif text-2xl font-semibold text-[#0F213E] mb-3">
                  Dodowa, Shai-Osudoku District
                </h3>
                <p className="text-sm text-[#333D4D] leading-relaxed">
                  {profile.historyNote}
                </p>
              </div>

              <div className="p-7 bg-[#F4EFE6] border border-[#E6DFD3]">
                <p className="text-xs uppercase tracking-[0.16em] text-[#8D6A26] font-medium mb-2">
                  School Motto
                </p>
                <p className="font-serif text-2xl font-semibold text-[#0F213E]">
                  {profile.motto}
                </p>
                <p className="mt-2 text-sm text-[#4A5568]">
                  Three pillars guiding daily student conduct, teaching
                  standards, and school culture.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Vision & Mission */}
      <section className="py-16 sm:py-20 bg-[#FFFFFF] border-y border-[#E6DFD3]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-8 bg-[#FBF9F5] border border-[#E6DFD3]">
              <p className="text-xs uppercase tracking-[0.16em] text-[#8D6A26] font-medium mb-2">
                Our Vision
              </p>
              <h2 className="font-serif text-3xl font-semibold text-[#0F213E] mb-4">
                Future-ready ethical leaders.
              </h2>
              <p className="text-base text-[#333D4D] leading-relaxed">
                {profile.vision}
              </p>
            </div>

            <div className="p-8 bg-[#FBF9F5] border border-[#E6DFD3]">
              <p className="text-xs uppercase tracking-[0.16em] text-[#8D6A26] font-medium mb-2">
                Our Mission
              </p>
              <h2 className="font-serif text-3xl font-semibold text-[#0F213E] mb-4">
                Transformative basic education.
              </h2>
              <p className="text-base text-[#333D4D] leading-relaxed">
                {profile.mission}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-16 sm:py-20 bg-[#FBF9F5]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            kicker="Core Values"
            title="Principles lived across our school."
            subtitle="Values shaping daily teaching, student relationships, and personal responsibility."
          />

          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {profile.coreValues.map((value, idx) => (
              <div
                key={value.id}
                className="p-6 bg-[#FFFFFF] border border-[#E6DFD3]"
              >
                <p className="text-xs uppercase tracking-[0.16em] text-[#8D6A26] font-medium tabular-nums mb-2">
                  0{idx + 1}
                </p>
                <h3 className="font-serif text-2xl font-semibold text-[#0F213E]">
                  {value.title}
                </h3>
                <p className="mt-3 text-sm text-[#333D4D] leading-relaxed">
                  {value.summary}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* School Anthem */}
      <section className="py-16 sm:py-20 bg-[#0F213E] text-[#FBF9F5]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <p className="text-xs uppercase tracking-[0.2em] text-[#D4B46E] font-medium">
              School Heritage
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold">
              {profile.anthem.title}
            </h2>

            <div className="py-8 px-6 sm:px-12 bg-[#172E54] border border-[#254375]">
              <blockquote className="font-serif italic text-2xl sm:text-3xl leading-relaxed text-[#FBF9F5] space-y-2">
                {profile.anthem.stanza.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </blockquote>
            </div>
          </div>
        </div>
      </section>

      {/* Connect with Beccan School */}
      <section className="py-16 sm:py-20 bg-[#F4EFE6] border-t border-[#E6DFD3]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="p-8 sm:p-10 bg-[#FFFFFF] border border-[#E6DFD3] flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <p className="text-xs uppercase tracking-[0.16em] text-[#8D6A26] font-medium">
                Parent & Family Enquiries
              </p>
              <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#0F213E]">
                Connect with Beccan School in Dodowa.
              </h2>
              <p className="text-sm sm:text-base text-[#4A5568]">
                Have questions about joining our school community or arranging a
                campus visit? Reach us directly on WhatsApp or explore admissions.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-[44px] inline-flex items-center gap-2 px-5 py-3 bg-[#15803D] text-[#FFFFFF] text-sm font-semibold hover:bg-[#166534] transition-colors whitespace-nowrap"
              >
                <WhatsAppIcon className="w-4 h-4 shrink-0" />
                <span>Chat on WhatsApp</span>
              </a>
              <Link
                to="/admissions"
                className="min-h-[44px] inline-flex items-center gap-2 px-5 py-3 bg-[#0F213E] text-[#FBF9F5] text-sm font-medium hover:bg-[#172E54] transition-colors whitespace-nowrap"
              >
                <span>Admissions</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

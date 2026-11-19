import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SectionHeading } from '../components/common/SectionHeading';
import { PageBanner } from '../components/layout/PageBanner';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import { schoolRepository } from '../services/schoolRepository';

export function AboutPage() {
  useDocumentMeta({
    title: 'About Us',
    description:
      'Learn about Beccan School in Dodowa, Ghana—our motto, vision, mission, core values, school anthem, and leadership confirmation status.',
  });

  const profile = schoolRepository.getProfile();
  const researchRecords = schoolRepository.getResearchInventory();

  return (
    <div>
      <PageBanner
        kicker="About Beccan School"
        title="Excellence, discipline, and purposeful growth in Dodowa."
        subtitle="An educational home committed to intellectual curiosity, personal integrity, and supportive community partnership."
        currentPageLabel="About Us"
      />

      {/* Introduction & History */}
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
                  School History & Registration
                </p>
                <h3 className="font-serif text-2xl font-semibold text-[#0F213E] mb-3">
                  Dodowa, Shai-Osudoku District
                </h3>
                <p className="text-sm text-[#333D4D] leading-relaxed">
                  {profile.historyNote}
                </p>
                <p className="mt-4 pt-4 border-t border-[#E6DFD3] text-xs text-[#5B6472]">
                  {profile.establishedNote}
                </p>
              </div>

              <div className="p-7 bg-[#F4EFE6] border border-[#E6DFD3]">
                <p className="text-xs uppercase tracking-[0.16em] text-[#8D6A26] font-medium mb-2">
                  Official Motto
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
            subtitle="Each core value below is derived directly from Beccan School’s official motto, mission, vision, and school anthem."
          />

          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {profile.coreValues.map((value, idx) => (
              <div
                key={value.id}
                className="p-6 bg-[#FFFFFF] border border-[#E6DFD3] flex flex-col justify-between"
              >
                <div>
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
                <p className="mt-5 pt-3 border-t border-[#E6DFD3] text-xs text-[#5B6472]">
                  {value.sourceBasis}
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

            <p className="text-xs text-[#A3B3C9] leading-relaxed">
              {profile.anthem.sourceNote}
            </p>
          </div>
        </div>
      </section>

      {/* Leadership & Headteacher Message Placeholders */}
      <section className="py-16 sm:py-20 bg-[#FBF9F5]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            kicker="School Leadership"
            title="Leadership & Headteacher’s Message"
            subtitle="To avoid fabricating names or credentials, official leadership biographies and the Headteacher’s welcome letter await confirmation from Beccan School management."
          />

          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-8">
            {profile.leadership.map((slot) => (
              <div
                key={slot.role}
                className="p-7 sm:p-8 bg-[#FFFFFF] border border-[#E6DFD3] space-y-4"
              >
                <div className="flex flex-wrap items-center gap-2 text-xs text-[#8D6A26] uppercase tracking-[0.14em] font-medium">
                  <span>{slot.role}</span>
                  <span aria-hidden="true">·</span>
                  <span>Pending Verification</span>
                </div>
                <h3 className="font-serif text-2xl font-semibold text-[#0F213E]">
                  {slot.messageTitle}
                </h3>
                <p className="text-sm font-medium text-[#5B6472]">
                  {slot.occupantStatus}
                </p>
                <p className="text-sm sm:text-base text-[#333D4D] leading-relaxed pt-3 border-t border-[#E6DFD3]">
                  {slot.messageBody}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Research & Verification Audit */}
      <section className="py-16 sm:py-20 bg-[#F4EFE6] border-t border-[#E6DFD3]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
            <SectionHeading
              kicker="Editorial Transparency"
              title="Research & Content Verification Record"
              subtitle="Summary of information verified from official Beccan School sources alongside items flagged for school confirmation."
            />
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#0F213E] hover:text-[#8D6A26] transition-colors whitespace-nowrap shrink-0"
            >
              <span>Submit Official Updates</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="bg-[#FFFFFF] border border-[#E6DFD3] overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[640px]">
              <thead>
                <tr className="border-b border-[#E6DFD3] bg-[#FBF9F5] text-xs uppercase tracking-[0.14em] text-[#5B6472]">
                  <th className="py-3.5 px-5 font-semibold">Subject</th>
                  <th className="py-3.5 px-5 font-semibold">Summary</th>
                  <th className="py-3.5 px-5 font-semibold">Source</th>
                  <th className="py-3.5 px-5 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6DFD3] text-sm">
                {researchRecords.map((row) => (
                  <tr key={row.topic} className="align-top">
                    <td className="py-4 px-5 font-medium text-[#0F213E]">
                      {row.topic}
                    </td>
                    <td className="py-4 px-5 text-[#333D4D]">
                      {row.discoveredInfo}
                    </td>
                    <td className="py-4 px-5 text-[#5B6472] text-xs">
                      {row.source}
                    </td>
                    <td className="py-4 px-5 text-xs font-medium text-[#8D6A26] whitespace-nowrap">
                      {row.needsConfirmation
                        ? `${row.officialSupport} · Needs confirmation`
                        : `${row.officialSupport} · Verified`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}

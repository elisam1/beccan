import { ArrowRight, Info } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SectionHeading } from '../components/common/SectionHeading';
import { PageBanner } from '../components/layout/PageBanner';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import { schoolRepository } from '../services/schoolRepository';

export function AcademicsPage() {
  useDocumentMeta({
    title: 'Academics',
    description:
      'Explore Beccan School’s academic divisions, teaching philosophy, holistic assessment approach, and co-curricular growth in Dodowa, Ghana.',
  });

  const divisions = schoolRepository.getAcademicDivisions();
  const pillars = schoolRepository.getAcademicPillars();

  return (
    <div>
      <PageBanner
        kicker="Academic Life"
        title="Rigorous foundations paired with character and inquiry."
        subtitle="Preparing learners in Dodowa with critical thinking, strong literacy and numeracy habits, technology awareness, and personal discipline."
        currentPageLabel="Academics"
      />

      {/* Verification Note */}
      <section className="bg-[#F4EFE6] border-b border-[#E6DFD3] py-6">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 flex items-start gap-3 text-sm text-[#333D4D]">
          <Info className="w-5 h-5 text-[#8D6A26] shrink-0 mt-0.5" />
          <p>
            <strong>Factual Accuracy Notice:</strong> Ghana’s Ministry of
            Education school registry classifies Beccan School as a Basic School
            in the Shai-Osudoku District. Exact active class streams, NaCCA /
            GES syllabus specifications, examination records, and club timetables
            are awaiting confirmation from school management.
          </p>
        </div>
      </section>

      {/* Academic Divisions */}
      <section className="py-16 sm:py-20 bg-[#FBF9F5]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            kicker="Academic Structure"
            title="Basic Education Pathway"
            subtitle="Structured progression supporting learners from early childhood readiness through foundational and upper basic classes."
          />

          <div className="mt-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
            {divisions.map((division) => (
              <article
                key={division.id}
                className="bg-[#FFFFFF] border border-[#E6DFD3] p-7 flex flex-col justify-between"
              >
                <div>
                  <p className="text-xs uppercase tracking-[0.14em] text-[#8D6A26] font-medium mb-2">
                    Pending Class Stream Confirmation
                  </p>
                  <h3 className="font-serif text-2xl font-semibold text-[#0F213E]">
                    {division.title}
                  </h3>
                  <p className="mt-2 text-xs text-[#5B6472] leading-relaxed">
                    {division.registryNote}
                  </p>
                  <p className="mt-4 text-sm sm:text-base text-[#333D4D] leading-relaxed">
                    {division.summary}
                  </p>

                  <ul className="mt-6 pt-5 border-t border-[#E6DFD3] space-y-2.5 text-sm text-[#333D4D]">
                    {division.learningFocus.map((focus) => (
                      <li key={focus} className="flex items-start gap-2.5">
                        <span
                          className="w-1.5 h-1.5 bg-[#B58E43] mt-2 shrink-0"
                          aria-hidden="true"
                        />
                        <span>{focus}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Curriculum, Teaching, Assessment & Extracurricular Pillars */}
      <section className="py-16 sm:py-20 bg-[#FFFFFF] border-t border-[#E6DFD3]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            kicker="Educational Pillars"
            title="Curriculum, Teaching, Assessment & Co-Curriculars"
            subtitle="Grounded directly in Beccan School’s official Vision and Mission statements."
          />

          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-8">
            {pillars.map((pillar) => (
              <div
                key={pillar.id}
                className="p-7 sm:p-8 bg-[#FBF9F5] border border-[#E6DFD3] flex flex-col justify-between"
              >
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-[#8D6A26] font-medium tabular-nums mb-2">
                    {pillar.number}
                  </p>
                  <h3 className="font-serif text-2xl font-semibold text-[#0F213E]">
                    {pillar.title}
                  </h3>
                  <p className="mt-3 text-sm sm:text-base text-[#333D4D] leading-relaxed">
                    {pillar.description}
                  </p>
                </div>
                <p className="mt-5 pt-3 border-t border-[#E6DFD3] text-xs text-[#5B6472]">
                  Basis: {pillar.sourceBasis}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-12 p-8 bg-[#0F213E] text-[#FBF9F5] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <h3 className="font-serif text-2xl font-semibold">
                Questions about specific class curricula or term schedules?
              </h3>
              <p className="mt-1 text-sm text-[#D4DCE8]">
                Contact our Dodowa school office on{' '}
                <span className="tabular-nums">024-740-1641</span> or submit an
                admission enquiry.
              </p>
            </div>
            <Link
              to="/admissions"
              className="min-h-[44px] inline-flex items-center gap-2 px-6 py-3 bg-[#B58E43] text-[#0A1629] text-sm font-semibold hover:bg-[#D4B46E] transition-colors whitespace-nowrap shrink-0"
            >
              <span>Enquire About Admission</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

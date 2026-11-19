import { ChevronDown, Mail, Phone } from 'lucide-react';
import { useState } from 'react';
import { SectionHeading } from '../components/common/SectionHeading';
import { WhatsAppIcon } from '../components/common/WhatsAppIcon';
import { AdmissionEnquiryForm } from '../components/forms/AdmissionEnquiryForm';
import { PageBanner } from '../components/layout/PageBanner';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import { schoolRepository } from '../services/schoolRepository';
import { buildWhatsAppUrl, WHATSAPP_MESSAGES } from '../utils/whatsapp';

export function AdmissionsPage() {
  useDocumentMeta({
    title: 'Admissions',
    description:
      'Apply or submit an admission enquiry for Beccan School in Dodowa, Greater Accra Region via WhatsApp. Review the admission process, requirements, and parent FAQs.',
  });

  const profile = schoolRepository.getProfile();
  const steps = schoolRepository.getAdmissionSteps();
  const requirements = schoolRepository.getAdmissionRequirements();
  const faqs = schoolRepository.getAdmissionFaqs();
  const [openFaqId, setOpenFaqId] = useState<string | null>(faqs[0]?.id ?? null);

  const admissionsWhatsappUrl = buildWhatsAppUrl(WHATSAPP_MESSAGES.admissions);

  return (
    <div>
      <PageBanner
        kicker="Admissions"
        title="Welcoming new learners to the Beccan School family."
        subtitle="Begin your child’s admission enquiry online via WhatsApp or speak directly with our school office in Dodowa to arrange a campus visit."
        currentPageLabel="Admissions"
      />

      {/* Admission Process */}
      <section className="py-16 sm:py-20 bg-[#FBF9F5]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            kicker="How to Apply"
            title="A clear four-step admission process."
            subtitle="Designed to give Dodowa parents direct, personal guidance from initial enquiry through orientation."
          />

          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step) => (
              <div
                key={step.stepNumber}
                className="p-6 bg-[#FFFFFF] border border-[#E6DFD3]"
              >
                <p className="text-xs uppercase tracking-[0.16em] text-[#8D6A26] font-medium tabular-nums mb-2">
                  Step {step.stepNumber}
                </p>
                <h3 className="font-serif text-xl font-semibold text-[#0F213E]">
                  {step.title}
                </h3>
                <p className="mt-3 text-sm text-[#333D4D] leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Enquiry Form + Requirements Sidebar */}
      <section className="py-16 sm:py-20 bg-[#FFFFFF] border-y border-[#E6DFD3]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
            <div className="lg:col-span-7">
              <SectionHeading
                kicker="Online Application"
                title="Admission Enquiry Form"
                subtitle="Complete your child’s information below to send an admission enquiry directly to Beccan School on WhatsApp."
                className="mb-8"
              />
              <AdmissionEnquiryForm />
            </div>

            <div className="lg:col-span-5 space-y-6">
              <div className="p-7 bg-[#FBF9F5] border border-[#E6DFD3]">
                <p className="text-xs uppercase tracking-[0.16em] text-[#8D6A26] font-medium mb-2">
                  Requirements Checklist
                </p>
                <h3 className="font-serif text-2xl font-semibold text-[#0F213E] mb-4">
                  What to prepare
                </h3>
                <ul className="space-y-4">
                  {requirements.map((req) => (
                    <li
                      key={req.item}
                      className="pb-4 border-b border-[#E6DFD3] last:border-b-0 last:pb-0"
                    >
                      <p className="text-sm font-semibold text-[#0F213E]">
                        {req.item}
                      </p>
                      <p className="mt-1 text-xs sm:text-sm text-[#4A5568] leading-relaxed">
                        {req.note}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-7 bg-[#0F213E] text-[#FBF9F5] space-y-4">
                <p className="text-xs uppercase tracking-[0.16em] text-[#D4B46E] font-medium">
                  Direct Admissions Desk
                </p>
                <h3 className="font-serif text-2xl font-semibold">
                  Speak with Beccan School
                </h3>
                <p className="text-sm text-[#D4DCE8] leading-relaxed">
                  For current term fee schedules, class vacancy checks, and
                  campus tour bookings, reach our admissions team directly.
                </p>
                <div className="pt-1 space-y-3 text-sm">
                  <a
                    href={admissionsWhatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#15803D] text-[#FFFFFF] font-semibold hover:bg-[#166534] transition-colors"
                  >
                    <WhatsAppIcon className="w-4 h-4 shrink-0" />
                    <span>Enquire on WhatsApp ({profile.contact.whatsappDisplay})</span>
                  </a>
                  <a
                    href={profile.contact.telephoneHref}
                    className="min-h-[40px] flex items-center gap-2.5 text-[#FBF9F5] hover:text-[#D4B46E] transition-colors tabular-nums"
                  >
                    <Phone className="w-4 h-4 text-[#D4B46E]" />
                    <span>{profile.contact.telephoneDisplay}</span>
                  </a>
                  <a
                    href={`mailto:${profile.contact.email}`}
                    className="min-h-[40px] flex items-center gap-2.5 text-[#FBF9F5] hover:text-[#D4B46E] transition-colors"
                  >
                    <Mail className="w-4 h-4 text-[#D4B46E]" />
                    <span>{profile.contact.email}</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions */}
      <section className="py-16 sm:py-20 bg-[#FBF9F5]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            kicker="Parent Questions"
            title="Frequently Asked Questions"
            subtitle="Helpful answers for prospective parents and families in Dodowa."
          />

          <div className="mt-10 max-w-3xl divide-y divide-[#E6DFD3] border-y border-[#E6DFD3] bg-[#FFFFFF]">
            {faqs.map((faq) => {
              const isOpen = openFaqId === faq.id;
              return (
                <div key={faq.id}>
                  <button
                    type="button"
                    onClick={() => setOpenFaqId(isOpen ? null : faq.id)}
                    aria-expanded={isOpen}
                    className="w-full min-h-[56px] px-6 py-4 text-left flex items-center justify-between gap-4 hover:bg-[#FBF9F5] transition-colors cursor-pointer"
                  >
                    <span className="font-serif text-xl font-semibold text-[#0F213E]">
                      {faq.question}
                    </span>
                    <ChevronDown
                      className={`w-5 h-5 text-[#8D6A26] shrink-0 transition-transform duration-150 ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-5 text-sm sm:text-base text-[#333D4D] leading-relaxed">
                      <p>{faq.answer}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}

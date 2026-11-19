import { Clock, Mail, MapPin, Phone } from 'lucide-react';
import { SectionHeading } from '../components/common/SectionHeading';
import { WhatsAppIcon } from '../components/common/WhatsAppIcon';
import { ContactEnquiryForm } from '../components/forms/ContactEnquiryForm';
import { PageBanner } from '../components/layout/PageBanner';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import { schoolRepository } from '../services/schoolRepository';
import { buildWhatsAppUrl, WHATSAPP_MESSAGES } from '../utils/whatsapp';

export function ContactPage() {
  useDocumentMeta({
    title: 'Contact Us',
    description:
      'Contact Beccan School in Dodowa, Shai-Osudoku District, Greater Accra Region, Ghana. Chat on WhatsApp or call 024-740-1641, or email info@beccanschool.com.',
  });

  const profile = schoolRepository.getProfile();

  return (
    <div>
      <PageBanner
        kicker="Contact Us"
        title="Reach the Beccan School office in Dodowa."
        subtitle="Connect directly with our administration team on WhatsApp, by telephone, or by email."
        currentPageLabel="Contact Us"
      />

      <section className="py-16 sm:py-20 bg-[#FBF9F5]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
            {/* Contact Details & Direct Channels */}
            <div className="lg:col-span-5 space-y-6">
              <SectionHeading
                kicker="Direct Channels"
                title="Official School Contact"
              />

              {/* Primary WhatsApp Card */}
              <div className="p-6 bg-[#0F213E] text-[#FBF9F5] space-y-4">
                <div className="flex items-center gap-2.5">
                  <WhatsAppIcon className="w-5 h-5 text-[#4ADE80]" />
                  <p className="text-xs uppercase tracking-[0.16em] text-[#D4B46E] font-medium">
                    Primary Communication · WhatsApp
                  </p>
                </div>
                <div>
                  <p className="font-serif text-2xl font-semibold tabular-nums">
                    {profile.contact.whatsappDisplay}
                  </p>
                  <p className="mt-1.5 text-sm text-[#D4DCE8] leading-relaxed">
                    Message Beccan School directly on WhatsApp for admissions,
                    school hours, directions, and general enquiries.
                  </p>
                </div>
                <a
                  href={buildWhatsAppUrl(WHATSAPP_MESSAGES.general)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#128C7E] text-[#FFFFFF] text-sm font-semibold hover:bg-[#0E7367] transition-colors"
                >
                  <WhatsAppIcon className="w-4 h-4" />
                  <span>Chat on WhatsApp</span>
                </a>
              </div>

              <div className="bg-[#FFFFFF] border border-[#E6DFD3] divide-y divide-[#E6DFD3]">
                <div className="p-6 flex items-start gap-3.5">
                  <Phone className="w-5 h-5 text-[#8D6A26] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs uppercase tracking-[0.14em] text-[#5B6472] font-medium">
                      Telephone
                    </p>
                    <a
                      href={profile.contact.telephoneHref}
                      className="mt-1 inline-block text-lg font-semibold text-[#0F213E] hover:text-[#8D6A26] transition-colors tabular-nums"
                    >
                      {profile.contact.telephoneDisplay}
                    </a>
                  </div>
                </div>

                <div className="p-6 flex items-start gap-3.5">
                  <Mail className="w-5 h-5 text-[#8D6A26] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs uppercase tracking-[0.14em] text-[#5B6472] font-medium">
                      Email Address
                    </p>
                    <a
                      href={`mailto:${profile.contact.email}`}
                      className="mt-1 inline-block text-base font-semibold text-[#0F213E] hover:text-[#8D6A26] transition-colors"
                    >
                      {profile.contact.email}
                    </a>
                  </div>
                </div>

                <div className="p-6 flex items-start gap-3.5">
                  <MapPin className="w-5 h-5 text-[#8D6A26] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs uppercase tracking-[0.14em] text-[#5B6472] font-medium">
                      Campus Location
                    </p>
                    <p className="mt-1 font-medium text-[#0F213E]">
                      {profile.contact.campusLabel}
                    </p>
                    <p className="mt-1 text-sm text-[#4A5568]">
                      {profile.contact.district}, {profile.contact.region},{' '}
                      {profile.contact.country}
                    </p>
                    <p className="mt-2 text-xs text-[#5B6472]">
                      {profile.contact.streetAddressNote}
                    </p>
                  </div>
                </div>

                <div className="p-6 flex items-start gap-3.5">
                  <Clock className="w-5 h-5 text-[#8D6A26] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs uppercase tracking-[0.14em] text-[#5B6472] font-medium">
                      Visiting Hours
                    </p>
                    <p className="mt-1 text-sm text-[#333D4D] leading-relaxed">
                      {profile.contact.officeHoursNote}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Enquiry Form */}
            <div className="lg:col-span-7">
              <SectionHeading
                kicker="Send a Message"
                title="Parent & General Enquiry Form"
                subtitle="Complete the fields below to prepare your message and send it directly to Beccan School on WhatsApp."
                className="mb-8"
              />
              <ContactEnquiryForm />
            </div>
          </div>
        </div>
      </section>

      {/* Visiting Our Dodowa Campus */}
      <section className="py-16 sm:py-20 bg-[#FFFFFF] border-t border-[#E6DFD3]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            kicker="Location & Directions"
            title="Dodowa, Shai-Osudoku District"
            subtitle="Planning an in-person visit with your family?"
            className="mb-8"
          />

          <div className="grid grid-cols-1 lg:grid-cols-12 border border-[#E6DFD3] bg-[#F4EFE6]">
            <div className="lg:col-span-7 p-8 sm:p-10 flex flex-col justify-between bg-[#0F213E] text-[#FBF9F5]">
              <div className="space-y-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[#D4B46E] font-medium">
                  Campus Location
                </p>
                <h3 className="font-serif text-3xl font-semibold">
                  Dodowa · Greater Accra Region, Ghana
                </h3>
                <p className="text-sm sm:text-base text-[#D4DCE8] leading-relaxed max-w-xl">
                  Beccan School serves families in Dodowa within the
                  Shai-Osudoku District of the Greater Accra Region. Reach out
                  on WhatsApp before setting off so our school office can share
                  clear landmarks from Dodowa township and welcome your family.
                </p>
              </div>
            </div>

            <div className="lg:col-span-5 p-8 sm:p-10 flex flex-col justify-between space-y-6">
              <div className="space-y-3">
                <h4 className="font-serif text-2xl font-semibold text-[#0F213E]">
                  Travelling to the campus?
                </h4>
                <p className="text-sm text-[#333D4D] leading-relaxed">
                  Request directions on WhatsApp or call the administration line
                  to confirm reception hours and landmarks.
                </p>
              </div>

              <div className="space-y-3">
                <a
                  href={buildWhatsAppUrl(WHATSAPP_MESSAGES.directions)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#128C7E] text-[#FFFFFF] text-sm font-semibold hover:bg-[#0E7367] transition-colors"
                >
                  <WhatsAppIcon className="w-4 h-4" />
                  <span>Request Directions on WhatsApp</span>
                </a>
                <a
                  href={profile.contact.telephoneHref}
                  className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#0F213E] text-[#FBF9F5] text-sm font-medium hover:bg-[#172E54] transition-colors tabular-nums"
                >
                  <Phone className="w-4 h-4" />
                  <span>Call {profile.contact.telephoneDisplay}</span>
                </a>
                <a
                  href={`mailto:${profile.contact.email}?subject=${encodeURIComponent(
                    'Request for Campus Directions',
                  )}`}
                  className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 px-5 py-3 border border-[#D4C8B4] bg-[#FFFFFF] text-[#0F213E] text-sm font-medium hover:border-[#0F213E] transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  <span>Email {profile.contact.email}</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

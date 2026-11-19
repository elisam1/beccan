import {
  ArrowRight,
  CalendarDays,
  Mail,
  MapPin,
  Phone,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PriorityLabel } from '../components/admin/StatusLabel';
import { FacilityCard } from '../components/cards/FacilityCard';
import { NewsCard } from '../components/cards/NewsCard';
import { SchoolImage } from '../components/common/SchoolImage';
import { SectionHeading } from '../components/common/SectionHeading';
import { WhatsAppIcon } from '../components/common/WhatsAppIcon';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import { cmsApi } from '../services/cmsApi';
import { schoolRepository } from '../services/schoolRepository';
import { CmsAnnouncement, CmsEvent, CmsNewsArticle } from '../types/cms';
import { formatDisplayDate, formatTimeRange } from '../utils/formatting';
import { buildWhatsAppUrl, WHATSAPP_MESSAGES } from '../utils/whatsapp';

export function HomePage() {
  useDocumentMeta({
    title: 'Beccan School | Dodowa, Greater Accra, Ghana',
    description:
      'Beccan School in Dodowa, Greater Accra Region, Ghana. Nurturing academic excellence, discipline, and purposeful success from early years through basic education.',
  });

  const profile = schoolRepository.getProfile();
  const campusPhoto = schoolRepository.getCampusHeroPhoto();
  const facilities = schoolRepository.getFacilities().slice(0, 2);

  const [announcements, setAnnouncements] = useState<CmsAnnouncement[]>([]);
  const [latestNews, setLatestNews] = useState<CmsNewsArticle[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<CmsEvent[]>([]);
  const [loadingUpdates, setLoadingUpdates] = useState(true);

  const generalWhatsappUrl = buildWhatsAppUrl(WHATSAPP_MESSAGES.general);
  const admissionsWhatsappUrl = buildWhatsAppUrl(WHATSAPP_MESSAGES.admissions);

  useEffect(() => {
    let active = true;
    Promise.allSettled([
      cmsApi.listPublicAnnouncements(),
      cmsApi.listPublicNews(),
      cmsApi.listPublicEvents(),
    ]).then(([annRes, newsRes, evtRes]) => {
      if (!active) return;
      if (annRes.status === 'fulfilled') {
        setAnnouncements(annRes.value.items.slice(0, 3));
      }
      if (newsRes.status === 'fulfilled') {
        setLatestNews(newsRes.value.items.slice(0, 2));
      }
      if (evtRes.status === 'fulfilled') {
        setUpcomingEvents(evtRes.value.upcoming.slice(0, 3));
      }
      setLoadingUpdates(false);
    });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div>
      {/* Hero Split */}
      <section className="bg-[#0F213E] text-[#FBF9F5] border-b border-[#172E54]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
            <div className="lg:col-span-6 flex flex-col justify-center">
              <p className="text-xs uppercase tracking-[0.2em] text-[#D4B46E] font-medium mb-4">
                Dodowa · Shai-Osudoku District · Greater Accra
              </p>

              <h1 className="font-serif text-4xl sm:text-5xl lg:text-[3.5rem] font-semibold leading-[1.08] tracking-tight text-[#FBF9F5]">
                {profile.welcomeHeadline}
              </h1>

              <p className="mt-5 text-base sm:text-lg text-[#D4DCE8] leading-relaxed max-w-xl">
                {profile.motto} — Preparing confident, ethical, and curious
                young learners through structured academics and character
                formation.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3.5">
                <Link
                  to="/admissions"
                  className="min-h-[44px] inline-flex items-center gap-2 px-6 py-3 bg-[#B58E43] text-[#0A1629] text-sm font-semibold tracking-wide hover:bg-[#D4B46E] transition-colors whitespace-nowrap shrink-0"
                >
                  <span>Apply for Admission</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <a
                  href={generalWhatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-h-[44px] inline-flex items-center gap-2 px-5 py-3 bg-[#15803D] text-[#FFFFFF] text-sm font-semibold hover:bg-[#166534] transition-colors whitespace-nowrap shrink-0"
                >
                  <WhatsAppIcon className="w-4 h-4 shrink-0" />
                  <span>Chat on WhatsApp</span>
                </a>
                <Link
                  to="/about"
                  className="min-h-[44px] inline-flex items-center gap-2 px-5 py-3 border border-[#324D7A] text-[#FBF9F5] text-sm font-medium hover:border-[#D4B46E] hover:text-[#D4B46E] transition-colors whitespace-nowrap shrink-0"
                >
                  <span>Discover Beccan School</span>
                </Link>
              </div>
            </div>

            <div className="lg:col-span-6 flex flex-col">
              <div className="relative flex-1 min-h-[280px] sm:min-h-[360px] border border-[#214070] bg-[#0A1629]">
                <SchoolImage
                  src={campusPhoto.src}
                  alt={campusPhoto.alt}
                  title="Beccan School Campus, Dodowa"
                  aspectRatioClass="aspect-[4/3] lg:aspect-auto lg:h-full"
                />
              </div>
              <p className="mt-2.5 text-xs text-[#A3B3C9] leading-relaxed">
                {campusPhoto.caption}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Operational Ribbon */}
      <section
        aria-label="Key school information"
        className="bg-[#F4EFE6] border-b border-[#E6DFD3]"
      >
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <dt className="text-xs uppercase tracking-[0.16em] text-[#8D6A26] font-medium">
                School Motto
              </dt>
              <dd className="mt-1 font-serif text-lg font-semibold text-[#0F213E]">
                {profile.motto}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-[0.16em] text-[#8D6A26] font-medium">
                Campus Location
              </dt>
              <dd className="mt-1 text-sm font-medium text-[#141B29]">
                Dodowa, Greater Accra Region
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-[0.16em] text-[#8D6A26] font-medium">
                WhatsApp & Admissions Desk
              </dt>
              <dd className="mt-1 text-sm font-medium text-[#141B29] tabular-nums">
                <a
                  href={generalWhatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[#15803D] hover:text-[#166534] underline underline-offset-4"
                >
                  <WhatsAppIcon className="w-3.5 h-3.5 shrink-0" />
                  <span>{profile.contact.whatsappDisplay}</span>
                </a>
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-[0.16em] text-[#8D6A26] font-medium">
                Official Email
              </dt>
              <dd className="mt-1 text-sm font-medium text-[#141B29]">
                <a
                  href={`mailto:${profile.contact.email}`}
                  className="hover:text-[#0F213E] underline underline-offset-4 decoration-[#D4C8B4]"
                >
                  {profile.contact.email}
                </a>
              </dd>
            </div>
          </dl>
        </div>
      </section>

      {/* Active Announcements (shown dynamically when published by admin) */}
      {announcements.length > 0 && (
        <section
          aria-label="Active school announcements"
          className="bg-[#FFFFFF] border-b border-[#E6DFD3] py-8"
        >
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <p className="text-xs uppercase tracking-[0.18em] text-[#8D6A26] font-medium">
                Active School Announcements
              </p>
              <Link
                to="/news"
                className="text-xs font-semibold text-[#0F213E] hover:text-[#8D6A26] inline-flex items-center gap-1"
              >
                <span>All Updates</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {announcements.map((item) => (
                <article
                  key={item.id}
                  className={`p-5 border ${
                    item.priority === 'Urgent'
                      ? 'bg-[#FFF5F2] border-[#E6B8A8]'
                      : item.priority === 'Important'
                        ? 'bg-[#FBF9F5] border-[#B58E43]'
                        : 'bg-[#FBF9F5] border-[#E6DFD3]'
                  }`}
                >
                  <PriorityLabel priority={item.priority} />
                  <h3 className="mt-2 font-serif text-xl font-semibold text-[#0F213E]">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm text-[#333D4D] leading-relaxed">
                    {item.message}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Introduction & Core Ethos */}
      <section className="py-16 sm:py-22 bg-[#FBF9F5]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
            <div className="lg:col-span-5">
              <SectionHeading
                kicker="Welcome to Beccan School"
                title="A supportive community grounded in values and curiosity."
              />
              <div className="mt-6 pt-6 border-t border-[#E6DFD3] space-y-3">
                <p className="text-xs uppercase tracking-[0.16em] text-[#8D6A26] font-medium">
                  Dodowa Learning Community
                </p>
                <p className="text-sm text-[#4A5568] leading-relaxed">
                  {profile.registryClassification}.
                </p>
                <a
                  href={generalWhatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-[#15803D] hover:text-[#166534] transition-colors"
                >
                  <WhatsAppIcon className="w-4 h-4 shrink-0" />
                  <span>Speak with our school office on WhatsApp</span>
                </a>
              </div>
            </div>

            <div className="lg:col-span-7 space-y-5 text-base sm:text-[1.0625rem] text-[#333D4D] leading-[1.75]">
              {profile.welcomeParagraphs.map((paragraph, idx) => (
                <p
                  key={paragraph}
                  className={
                    idx === 0
                      ? 'first-letter:font-serif first-letter:text-5xl first-letter:font-semibold first-letter:float-left first-letter:mr-3 first-letter:leading-[0.85] first-letter:text-[#0F213E]'
                      : ''
                  }
                >
                  {paragraph}
                </p>
              ))}
              <div className="pt-2">
                <Link
                  to="/about"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-[#0F213E] hover:text-[#8D6A26] transition-colors"
                >
                  <span>Read our Anthem, Values & School Profile</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Vision & Mission */}
      <section className="py-16 sm:py-22 bg-[#0F213E] text-[#FBF9F5]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            kicker="Our Guiding Purpose"
            title="Vision & Mission"
            subtitle="Guiding principles uniting academic standards, integrity, and community partnership."
            theme="dark"
          />

          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-7 sm:p-9 bg-[#172E54] border border-[#254375]">
              <p className="text-xs uppercase tracking-[0.18em] text-[#D4B46E] font-medium mb-3">
                01 · Our Vision
              </p>
              <h3 className="font-serif text-2xl sm:text-3xl font-semibold text-[#FBF9F5] mb-4">
                Ethical, creative, and globally conscious leaders.
              </h3>
              <p className="text-sm sm:text-base text-[#D4DCE8] leading-relaxed">
                {profile.vision}
              </p>
            </div>

            <div className="p-7 sm:p-9 bg-[#172E54] border border-[#254375]">
              <p className="text-xs uppercase tracking-[0.18em] text-[#D4B46E] font-medium mb-3">
                02 · Our Mission
              </p>
              <h3 className="font-serif text-2xl sm:text-3xl font-semibold text-[#FBF9F5] mb-4">
                Knowledge, integrity, and critical thinking.
              </h3>
              <p className="text-sm sm:text-base text-[#D4DCE8] leading-relaxed">
                {profile.mission}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Academic Highlights */}
      <section className="py-16 sm:py-22 bg-[#FFFFFF] border-b border-[#E6DFD3]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <SectionHeading
              kicker="Academic Direction"
              title="Balanced learning for the whole child."
              subtitle="A structured basic education programme uniting core sciences, arts, technology awareness, and personal discipline."
            />
            <Link
              to="/academics"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#0F213E] hover:text-[#8D6A26] transition-colors whitespace-nowrap shrink-0"
            >
              <span>Explore Academics</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 sm:p-7 bg-[#FBF9F5] border border-[#E6DFD3]">
              <p className="text-xs uppercase tracking-[0.16em] text-[#8D6A26] font-medium mb-2">
                01 · Core Foundations
              </p>
              <h3 className="font-serif text-2xl font-semibold text-[#0F213E]">
                Science, Arts & Inquiry
              </h3>
              <p className="mt-3 text-sm text-[#333D4D] leading-relaxed">
                Balancing core academic instruction across sciences and arts with
                structured critical thinking and practical classroom application.
              </p>
            </div>

            <div className="p-6 sm:p-7 bg-[#FBF9F5] border border-[#E6DFD3]">
              <p className="text-xs uppercase tracking-[0.16em] text-[#8D6A26] font-medium mb-2">
                02 · Modern Readiness
              </p>
              <h3 className="font-serif text-2xl font-semibold text-[#0F213E]">
                Technology & Character
              </h3>
              <p className="mt-3 text-sm text-[#333D4D] leading-relaxed">
                Integrating modern technology awareness alongside enduring
                discipline, personal integrity, and strong work ethic.
              </p>
            </div>

            <div className="p-6 sm:p-7 bg-[#FBF9F5] border border-[#E6DFD3]">
              <p className="text-xs uppercase tracking-[0.16em] text-[#8D6A26] font-medium mb-2">
                03 · Whole-Child Care
              </p>
              <h3 className="font-serif text-2xl font-semibold text-[#0F213E]">
                Co-Curricular Growth
              </h3>
              <p className="mt-3 text-sm text-[#333D4D] leading-relaxed">
                Nurturing intellectual, social, and physical well-being through
                educator guidance, parent partnership, and outdoor play.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Facilities & Gallery Preview */}
      <section className="py-16 sm:py-22 bg-[#FBF9F5]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <SectionHeading
              kicker="Campus & Facilities"
              title="Inside our Dodowa campus."
              subtitle="Explore our learning buildings, enclosed compound, and outdoor courtyard recreation space."
            />
            <div className="flex flex-wrap items-center gap-5 shrink-0">
              <Link
                to="/facilities"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0F213E] hover:text-[#8D6A26] transition-colors whitespace-nowrap"
              >
                <span>All Facilities</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/gallery"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0F213E] hover:text-[#8D6A26] transition-colors whitespace-nowrap"
              >
                <span>View Gallery</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {facilities.map((facility) => (
              <FacilityCard key={facility.id} facility={facility} />
            ))}
          </div>
        </div>
      </section>

      {/* Live News & Upcoming Events */}
      <section className="py-16 sm:py-22 bg-[#F4EFE6] border-y border-[#E6DFD3]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
              <SectionHeading
                kicker="News & Events"
                title="School news & upcoming events."
                subtitle="Latest stories, announcements, and key term dates at Beccan School."
              />
              <Link
                to="/news"
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#0F213E] hover:text-[#8D6A26] transition-colors whitespace-nowrap shrink-0"
              >
                <span>All News & Events</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {loadingUpdates ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {[1, 2].map((n) => (
                  <div
                    key={n}
                    className="h-52 bg-[#FFFFFF] border border-[#E6DFD3] animate-pulse"
                  />
                ))}
              </div>
            ) : latestNews.length === 0 ? (
              <div className="p-8 bg-[#FFFFFF] border border-[#E6DFD3] text-center">
                <p className="font-serif text-2xl font-semibold text-[#0F213E]">
                  No news articles published yet
                </p>
                <p className="mt-2 text-sm text-[#5B6472]">
                  Official school updates and announcements will appear here as
                  they are shared by administration.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {latestNews.map((article) => (
                  <NewsCard key={article.id} article={article} />
                ))}
              </div>
            )}
          </div>

          {upcomingEvents.length > 0 && (
            <div className="pt-8 border-t border-[#D4C8B4]">
              <h3 className="font-serif text-2xl font-semibold text-[#0F213E] mb-6">
                Upcoming School Events
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {upcomingEvents.map((ev) => (
                  <article
                    key={ev.id}
                    className="bg-[#FFFFFF] border border-[#E6DFD3] p-6 space-y-2.5"
                  >
                    <p className="text-xs uppercase tracking-[0.14em] text-[#8D6A26] font-medium tabular-nums inline-flex items-center gap-1.5">
                      <CalendarDays className="w-3.5 h-3.5" />
                      <span>{formatDisplayDate(ev.eventDate)}</span>
                    </p>
                    <h4 className="font-serif text-xl font-semibold text-[#0F213E]">
                      {ev.title}
                    </h4>
                    <p className="text-sm text-[#333D4D] line-clamp-2">
                      {ev.description}
                    </p>
                    <p className="text-xs text-[#5B6472] pt-2 border-t border-[#E6DFD3] tabular-nums">
                      {formatTimeRange(ev.startTime, ev.endTime)} · {ev.venue}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Admissions CTA & Contact Summary */}
      <section className="py-16 sm:py-22 bg-[#FFFFFF]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center p-8 sm:p-12 bg-[#0F213E] text-[#FBF9F5]">
            <div className="lg:col-span-7 space-y-4">
              <p className="text-xs uppercase tracking-[0.18em] text-[#D4B46E] font-medium">
                Admissions & Campus Visits
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl font-semibold leading-tight">
                Considering Beccan School for your child?
              </h2>
              <p className="text-sm sm:text-base text-[#D4DCE8] leading-relaxed max-w-xl">
                Complete our admission form to send your child’s application
                directly on WhatsApp, or message our Dodowa office to schedule a
                campus visit.
              </p>
              <div className="pt-2 flex flex-wrap gap-3.5">
                <Link
                  to="/admissions"
                  className="min-h-[44px] inline-flex items-center gap-2 px-6 py-3 bg-[#B58E43] text-[#0A1629] text-sm font-semibold hover:bg-[#D4B46E] transition-colors"
                >
                  <span>Start Admission Enquiry</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <a
                  href={admissionsWhatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-h-[44px] inline-flex items-center gap-2 px-5 py-3 bg-[#15803D] text-[#FFFFFF] text-sm font-semibold hover:bg-[#166534] transition-colors"
                >
                  <WhatsAppIcon className="w-4 h-4 shrink-0" />
                  <span>Enquire on WhatsApp</span>
                </a>
                <Link
                  to="/contact"
                  className="min-h-[44px] inline-flex items-center gap-2 px-5 py-3 border border-[#324D7A] text-[#FBF9F5] text-sm font-medium hover:border-[#D4B46E] transition-colors"
                >
                  <span>Contact School Office</span>
                </Link>
              </div>
            </div>

            <div className="lg:col-span-5 pt-6 lg:pt-0 lg:pl-8 border-t lg:border-t-0 lg:border-l border-[#254375] space-y-4 text-sm">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-[#D4B46E] shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-[#FBF9F5]">
                    {profile.contact.campusLabel}
                  </p>
                  <p className="text-[#A3B3C9] text-xs mt-0.5">
                    {profile.contact.district} · {profile.contact.region}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 tabular-nums">
                <WhatsAppIcon className="w-5 h-5 text-[#4ADE80] shrink-0" />
                <a
                  href={generalWhatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#FBF9F5] hover:text-[#4ADE80] transition-colors font-medium"
                >
                  WhatsApp: {profile.contact.whatsappDisplay}
                </a>
              </div>
              <div className="flex items-center gap-3 tabular-nums">
                <Phone className="w-5 h-5 text-[#D4B46E] shrink-0" />
                <a
                  href={profile.contact.telephoneHref}
                  className="text-[#FBF9F5] hover:text-[#D4B46E] transition-colors font-medium"
                >
                  {profile.contact.telephoneDisplay}
                </a>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-[#D4B46E] shrink-0" />
                <a
                  href={`mailto:${profile.contact.email}`}
                  className="text-[#FBF9F5] hover:text-[#D4B46E] transition-colors font-medium"
                >
                  {profile.contact.email}
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

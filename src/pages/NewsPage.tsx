import { CalendarDays, MapPin } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { PriorityLabel } from '../components/admin/StatusLabel';
import { NewsCard } from '../components/cards/NewsCard';
import { SectionHeading } from '../components/common/SectionHeading';
import { WhatsAppIcon } from '../components/common/WhatsAppIcon';
import { PageBanner } from '../components/layout/PageBanner';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import { cmsApi, NEWS_CATEGORIES } from '../services/cmsApi';
import { CmsAnnouncement, CmsEvent, CmsNewsArticle } from '../types/cms';
import {
  formatDisplayDate,
  formatTimeRange,
  splitParagraphs,
} from '../utils/formatting';
import {
  buildAnnouncementWhatsAppMessage,
  buildEventWhatsAppMessage,
  buildWhatsAppUrl,
  WHATSAPP_MESSAGES,
} from '../utils/whatsapp';

const newsCategories = ['All', ...NEWS_CATEGORIES] as const;

export function NewsPage() {
  useDocumentMeta({
    title: 'News & Events',
    description:
      'Published news articles, school announcements, and upcoming events from Beccan School in Dodowa, Greater Accra Region, Ghana.',
  });

  const [articles, setArticles] = useState<CmsNewsArticle[]>([]);
  const [announcements, setAnnouncements] = useState<CmsAnnouncement[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<CmsEvent[]>([]);
  const [pastEvents, setPastEvents] = useState<CmsEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('All');

  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([
      cmsApi.listPublicNews(),
      cmsApi.listPublicAnnouncements(),
      cmsApi.listPublicEvents(),
    ])
      .then(([newsRes, annRes, evtRes]) => {
        if (!active) return;
        setArticles(newsRes.items);
        setAnnouncements(annRes.items);
        setUpcomingEvents(evtRes.upcoming);
        setPastEvents(evtRes.past);
      })
      .catch(() => {
        if (!active) return;
        setArticles([]);
        setAnnouncements([]);
        setUpcomingEvents([]);
        setPastEvents([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const filteredArticles = useMemo(() => {
    if (activeCategory === 'All') return articles;
    return articles.filter((item) => item.category === activeCategory);
  }, [articles, activeCategory]);

  return (
    <div>
      <PageBanner
        kicker="News, Announcements & Events"
        title="School notices, updates & events."
        subtitle="Stay informed with current parent announcements, school stories, and upcoming events at Beccan School."
        currentPageLabel="News & Events"
      />

      {/* Active Announcements */}
      <section className="py-12 bg-[#FFFFFF] border-b border-[#E6DFD3]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <SectionHeading
              kicker="Notices"
              title="Active Announcements"
              subtitle="Important parent and community updates currently in effect."
            />
            <a
              href={buildWhatsAppUrl(WHATSAPP_MESSAGES.newsAndEvents)}
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-[44px] inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#128C7E] text-[#FFFFFF] text-sm font-semibold hover:bg-[#0E7367] transition-colors whitespace-nowrap self-start sm:self-auto"
            >
              <WhatsAppIcon className="w-4 h-4" />
              <span>Ask on WhatsApp</span>
            </a>
          </div>

          {loading ? (
            <div className="h-28 bg-[#FBF9F5] border border-[#E6DFD3] animate-pulse" />
          ) : announcements.length === 0 ? (
            <div className="p-6 bg-[#FBF9F5] border border-[#E6DFD3] flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-sm text-[#5B6472]">
              <span>
                No active announcements are posted right now. For immediate
                term updates, reach the school office on WhatsApp.
              </span>
              <a
                href={buildWhatsAppUrl(WHATSAPP_MESSAGES.newsAndEvents)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 font-semibold text-[#128C7E] hover:text-[#0E7367] transition-colors shrink-0"
              >
                <WhatsAppIcon className="w-4 h-4" />
                <span>Message on WhatsApp</span>
              </a>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {announcements.map((item) => (
                <article
                  key={item.id}
                  className={`p-6 border flex flex-col justify-between ${
                    item.priority === 'Urgent'
                      ? 'bg-[#FFF5F2] border-[#E6B8A8]'
                      : item.priority === 'Important'
                        ? 'bg-[#FBF9F5] border-[#B58E43]'
                        : 'bg-[#FBF9F5] border-[#E6DFD3]'
                  }`}
                >
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <PriorityLabel priority={item.priority} />
                      {item.publishedAt && (
                        <span className="text-xs text-[#5B6472] tabular-nums">
                          {formatDisplayDate(item.publishedAt)}
                        </span>
                      )}
                    </div>
                    <h3 className="font-serif text-2xl font-semibold text-[#0F213E]">
                      {item.title}
                    </h3>
                    <div className="mt-2 space-y-2 text-sm text-[#333D4D] leading-relaxed">
                      {splitParagraphs(item.message).map((p, idx) => (
                        <p key={idx}>{p}</p>
                      ))}
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-[#E6DFD3]/80">
                    <a
                      href={buildWhatsAppUrl(
                        buildAnnouncementWhatsAppMessage(item.title),
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#128C7E] hover:text-[#0E7367] transition-colors"
                    >
                      <WhatsAppIcon className="w-3.5 h-3.5" />
                      <span>Enquire on WhatsApp</span>
                    </a>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Published News Articles */}
      <section className="py-14 sm:py-18 bg-[#FBF9F5]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            kicker="Journal & Updates"
            title="Published News Articles"
            className="mb-8"
          />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
            <div
              className="inline-flex flex-wrap items-center gap-1.5 p-1 bg-[#F4EFE6] border border-[#E6DFD3]"
              role="group"
              aria-label="Filter news by category"
            >
              {newsCategories.map((category) => {
                const isActive = activeCategory === category;
                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setActiveCategory(category)}
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
              {filteredArticles.length} published article
              {filteredArticles.length === 1 ? '' : 's'}
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[1, 2].map((n) => (
                <div
                  key={n}
                  className="h-64 bg-[#FFFFFF] border border-[#E6DFD3] animate-pulse"
                />
              ))}
            </div>
          ) : filteredArticles.length === 0 ? (
            <div className="p-12 bg-[#FFFFFF] border border-[#E6DFD3] text-center space-y-2">
              <p className="font-serif text-2xl font-semibold text-[#0F213E]">
                No published articles yet
              </p>
              <p className="text-sm text-[#5B6472]">
                School stories and news updates will appear here as they are
                published.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {filteredArticles.map((article) => (
                <NewsCard key={article.id} article={article} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Upcoming & Past Events */}
      <section className="py-14 sm:py-18 bg-[#F4EFE6] border-t border-[#E6DFD3]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div>
            <SectionHeading
              kicker="School Calendar"
              title="Upcoming Events"
              subtitle="Upcoming school dates and campus gatherings."
              className="mb-8"
            />

            {loading ? (
              <div className="h-40 bg-[#FFFFFF] border border-[#E6DFD3] animate-pulse" />
            ) : upcomingEvents.length === 0 ? (
              <div className="p-8 bg-[#FFFFFF] border border-[#E6DFD3] flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-sm text-[#5B6472]">
                <span>No upcoming school events are currently listed.</span>
                <a
                  href={buildWhatsAppUrl(WHATSAPP_MESSAGES.newsAndEvents)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 font-semibold text-[#128C7E] hover:text-[#0E7367] transition-colors shrink-0"
                >
                  <WhatsAppIcon className="w-4 h-4" />
                  <span>Ask about Term Dates on WhatsApp</span>
                </a>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {upcomingEvents.map((ev) => (
                  <article
                    key={ev.id}
                    className="bg-[#FFFFFF] border border-[#E6DFD3] overflow-hidden flex flex-col"
                  >
                    {ev.coverThumbnailUrl && (
                      <img
                        src={ev.coverThumbnailUrl}
                        alt={ev.title}
                        loading="lazy"
                        className="w-full aspect-[16/9] object-cover border-b border-[#E6DFD3]"
                      />
                    )}
                    <div className="p-6 space-y-3 flex-1 flex flex-col justify-between">
                      <div className="space-y-3">
                        <p className="text-xs uppercase tracking-[0.14em] text-[#14532D] font-semibold tabular-nums">
                          Upcoming · {formatDisplayDate(ev.eventDate)}
                        </p>
                        <h3 className="font-serif text-2xl font-semibold text-[#0F213E]">
                          {ev.title}
                        </h3>
                        <p className="text-sm text-[#333D4D] leading-relaxed">
                          {ev.description}
                        </p>
                      </div>
                      <div className="space-y-3 pt-3 border-t border-[#E6DFD3]">
                        <div className="flex flex-wrap gap-4 text-xs text-[#5B6472] tabular-nums">
                          <span className="inline-flex items-center gap-1.5">
                            <CalendarDays className="w-3.5 h-3.5 text-[#8D6A26]" />
                            {formatTimeRange(ev.startTime, ev.endTime)}
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-[#8D6A26]" />
                            {ev.venue}
                          </span>
                        </div>
                        <a
                          href={buildWhatsAppUrl(
                            buildEventWhatsAppMessage(
                              ev.title,
                              formatDisplayDate(ev.eventDate),
                            ),
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#128C7E] hover:text-[#0E7367] transition-colors"
                        >
                          <WhatsAppIcon className="w-3.5 h-3.5" />
                          <span>Enquire about Event on WhatsApp</span>
                        </a>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>

          {pastEvents.length > 0 && (
            <div className="pt-8 border-t border-[#D4C8B4]">
              <h3 className="font-serif text-2xl font-semibold text-[#0F213E] mb-6">
                Past Events Archive
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {pastEvents.map((ev) => (
                  <article
                    key={ev.id}
                    className="bg-[#FFFFFF]/80 border border-[#E6DFD3] p-6 space-y-2"
                  >
                    <p className="text-xs uppercase tracking-[0.14em] text-[#5B6472] font-medium tabular-nums">
                      Past Event · {formatDisplayDate(ev.eventDate)}
                    </p>
                    <h4 className="font-serif text-xl font-semibold text-[#0F213E]">
                      {ev.title}
                    </h4>
                    <p className="text-sm text-[#4A5568]">{ev.description}</p>
                    <p className="text-xs text-[#5B6472] pt-2 border-t border-[#E6DFD3]">
                      {ev.venue}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

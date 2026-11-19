import {
  CalendarDays,
  Camera,
  DatabaseBackup,
  Megaphone,
  Newspaper,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { ApiError, cmsApi } from '../../services/cmsApi';
import { AdminOverviewData } from '../../types/cms';
import { formatDisplayDate } from '../../utils/formatting';
import { PublishStatusLabel } from './StatusLabel';

type AdminTab =
  | 'overview'
  | 'gallery'
  | 'news'
  | 'announcements'
  | 'events'
  | 'settings';

interface AdminOverviewSectionProps {
  onNavigateTab: (tab: AdminTab) => void;
}

export function AdminOverviewSection({
  onNavigateTab,
}: AdminOverviewSectionProps) {
  const [data, setData] = useState<AdminOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    cmsApi
      .getOverview()
      .then((res) => {
        if (active) {
          setData(res);
          setError(null);
        }
      })
      .catch((err) => {
        if (active) {
          setError(
            err instanceof ApiError ? err.message : 'Failed to load overview.',
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="h-32 bg-[#FFFFFF] border border-[#E6DFD3] animate-pulse p-6"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 bg-[#FFFFFF] border border-[#E6DFD3] text-sm text-[#9A3412]">
        {error || 'Overview unavailable.'}
      </div>
    );
  }

  const cards: {
    label: string;
    value: number;
    subtext: string;
    tab: AdminTab;
    icon: typeof Camera;
  }[] = [
    {
      label: 'Published Photographs',
      value: data.counts.publishedPhotos,
      subtext: `${data.counts.draftPhotos} unpublished draft${data.counts.draftPhotos === 1 ? '' : 's'}`,
      tab: 'gallery',
      icon: Camera,
    },
    {
      label: 'Published News Articles',
      value: data.counts.publishedNews,
      subtext: `${data.counts.draftNews} draft · ${data.counts.archivedNews} archived`,
      tab: 'news',
      icon: Newspaper,
    },
    {
      label: 'Active Announcements',
      value: data.counts.activeAnnouncements,
      subtext: `${data.counts.totalAnnouncements} total stored`,
      tab: 'announcements',
      icon: Megaphone,
    },
    {
      label: 'Upcoming Events',
      value: data.counts.upcomingEvents,
      subtext: `${data.counts.pastEvents} past published event${data.counts.pastEvents === 1 ? '' : 's'}`,
      tab: 'events',
      icon: CalendarDays,
    },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.label}
              type="button"
              onClick={() => onNavigateTab(card.tab)}
              className="text-left p-6 bg-[#FFFFFF] border border-[#E6DFD3] hover:border-[#B58E43] transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between text-[#8D6A26] mb-3">
                <span className="text-xs uppercase tracking-[0.14em] font-medium text-[#5B6472]">
                  {card.label}
                </span>
                <Icon className="w-4 h-4 shrink-0" />
              </div>
              <p className="font-serif text-4xl font-semibold text-[#0F213E] tabular-nums">
                {card.value}
              </p>
              <p className="mt-2 text-xs text-[#5B6472] tabular-nums">
                {card.subtext}
              </p>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-[#FFFFFF] border border-[#E6DFD3] p-6">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#E6DFD3]">
            <h2 className="font-serif text-2xl font-semibold text-[#0F213E]">
              Recent Content Activity
            </h2>
            <span className="text-xs text-[#5B6472] tabular-nums">
              Latest {data.recentActivity.length} updates
            </span>
          </div>

          {data.recentActivity.length === 0 ? (
            <p className="py-8 text-sm text-[#5B6472] text-center">
              No content has been created yet. Use the sections on the left to
              upload photographs or publish school news, announcements, and
              events.
            </p>
          ) : (
            <ul className="divide-y divide-[#E6DFD3]">
              {data.recentActivity.map((item) => (
                <li
                  key={`${item.type}-${item.id}`}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div>
                    <p className="text-xs uppercase tracking-[0.14em] text-[#8D6A26] font-medium">
                      {item.type}
                    </p>
                    <p className="text-sm font-medium text-[#0F213E] mt-0.5">
                      {item.title}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <PublishStatusLabel status={item.status} />
                    <span className="text-xs text-[#5B6472] tabular-nums">
                      {formatDisplayDate(item.updatedAt)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="lg:col-span-4 bg-[#FFFFFF] border border-[#E6DFD3] p-6 flex flex-col justify-between space-y-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-[#8D6A26]">
              <DatabaseBackup className="w-4 h-4" />
              <span className="text-xs uppercase tracking-[0.14em] font-medium">
                JSON Storage & Backups
              </span>
            </div>
            <h3 className="font-serif text-2xl font-semibold text-[#0F213E]">
              Automatic Safety Backups
            </h3>
            <p className="text-sm text-[#333D4D] leading-relaxed">
              Every content update creates a timestamped JSON snapshot in{' '}
              <span className="font-mono text-xs">private/backups/</span>{' '}
              before saving changes.
            </p>
            <p className="text-sm font-medium text-[#0F213E] tabular-nums">
              {data.counts.backupCount} backup snapshot
              {data.counts.backupCount === 1 ? '' : 's'} stored
            </p>
          </div>

          <button
            type="button"
            onClick={() => onNavigateTab('settings')}
            className="min-h-[44px] w-full px-4 py-2.5 bg-[#0F213E] text-[#FBF9F5] text-sm font-medium hover:bg-[#172E54] transition-colors cursor-pointer"
          >
            Manage Backups & Password
          </button>
        </div>
      </div>
    </div>
  );
}

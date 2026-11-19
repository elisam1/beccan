import {
  CalendarDays,
  Camera,
  ExternalLink,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  Newspaper,
  Settings,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AdminAnnouncementsSection } from '../components/admin/AdminAnnouncementsSection';
import { AdminAuthScreen } from '../components/admin/AdminAuthScreen';
import { AdminEventsSection } from '../components/admin/AdminEventsSection';
import { AdminGallerySection } from '../components/admin/AdminGallerySection';
import { AdminNewsSection } from '../components/admin/AdminNewsSection';
import { AdminOverviewSection } from '../components/admin/AdminOverviewSection';
import { AdminSettingsSection } from '../components/admin/AdminSettingsSection';
import { SchoolWordmark } from '../components/common/SchoolWordmark';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import { ApiError, cmsApi } from '../services/cmsApi';
import { SessionState } from '../types/cms';

type AdminTab =
  | 'overview'
  | 'gallery'
  | 'news'
  | 'announcements'
  | 'events'
  | 'settings';

const navItems: { id: AdminTab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'gallery', label: 'Photo Gallery', icon: Camera },
  { id: 'news', label: 'News', icon: Newspaper },
  { id: 'announcements', label: 'Announcements', icon: Megaphone },
  { id: 'events', label: 'Events', icon: CalendarDays },
  { id: 'settings', label: 'Account Settings', icon: Settings },
];

export function AdminPage() {
  useDocumentMeta({
    title: 'Administrator Dashboard | Beccan School',
    description:
      'Private Beccan School content management portal for photos, news, announcements, and events.',
  });

  const [session, setSession] = useState<SessionState | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const checkSession = useCallback(async () => {
    setLoadingSession(true);
    try {
      const state = await cmsApi.getSession();
      setSession(state);
      setConnectionError(null);
    } catch (err) {
      setSession(null);
      setConnectionError(
        err instanceof ApiError
          ? err.message
          : 'Unable to reach PHP authentication service.',
      );
    } finally {
      setLoadingSession(false);
    }
  }, []);

  useEffect(() => {
    void checkSession();
  }, [checkSession]);

  const handleLogout = async () => {
    try {
      await cmsApi.logout();
    } finally {
      await checkSession();
    }
  };

  if (loadingSession) {
    return (
      <div className="min-h-screen bg-[#0F213E] flex items-center justify-center p-6 text-[#FBF9F5]">
        <p className="text-sm tracking-wide">
          Verifying administrator session...
        </p>
      </div>
    );
  }

  if (!session?.authenticated || connectionError) {
    return (
      <AdminAuthScreen
        session={session}
        connectionError={connectionError}
        onAuthenticated={(next) => setSession(next)}
        onRetrySession={() => void checkSession()}
      />
    );
  }

  const activeNav = navItems.find((item) => item.id === activeTab) || navItems[0];

  return (
    <div className="min-h-screen bg-[#FBF9F5] text-[#141B29] flex flex-col lg:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-68 lg:flex-col bg-[#0F213E] text-[#FBF9F5] border-r border-[#172E54] shrink-0">
        <div className="px-6 py-6 border-b border-[#172E54] space-y-2">
          <SchoolWordmark variant="light" size="md" />
          <p className="text-[11px] uppercase tracking-[0.16em] text-[#D4B46E]">
            Admin Portal
          </p>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1" aria-label="Admin navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`w-full min-h-[44px] flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-[#172E54] text-[#FBF9F5] border border-[#B58E43]/60'
                    : 'text-[#D4DCE8] hover:text-[#FBF9F5] hover:bg-[#172E54]/60'
                }`}
              >
                <Icon className="w-4 h-4 text-[#D4B46E] shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[#172E54] space-y-2">
          <Link
            to="/"
            className="w-full min-h-[40px] flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-[#D4DCE8] hover:text-[#FBF9F5] transition-colors"
          >
            <ExternalLink className="w-4 h-4 text-[#D4B46E]" />
            <span>View Public Website</span>
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full min-h-[44px] flex items-center gap-2.5 px-4 py-2 text-sm font-medium text-[#FBF9F5] bg-[#0A1629] hover:bg-[#172E54] transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-[#D4B46E]" />
            <span>Logout ({session.username})</span>
          </button>
        </div>
      </aside>

      {/* Mobile Top Bar */}
      <header className="lg:hidden sticky top-0 z-40 h-16 bg-[#0F213E] text-[#FBF9F5] px-4 flex items-center justify-between border-b border-[#172E54]">
        <div className="flex items-center gap-2.5">
          <SchoolWordmark variant="light" size="sm" />
          <span className="text-[11px] uppercase tracking-[0.14em] text-[#D4B46E]">
            Admin
          </span>
        </div>

        <button
          type="button"
          onClick={() => setMobileMenuOpen((v) => !v)}
          className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center border border-[#254375]"
          aria-label="Toggle admin menu"
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#0F213E] text-[#FBF9F5] border-b border-[#172E54] px-4 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full min-h-[44px] flex items-center gap-3 px-3 py-2 text-sm font-medium ${
                  activeTab === item.id
                    ? 'bg-[#172E54] text-[#FBF9F5]'
                    : 'text-[#D4DCE8]'
                }`}
              >
                <Icon className="w-4 h-4 text-[#D4B46E]" />
                <span>{item.label}</span>
              </button>
            );
          })}
          <div className="pt-3 border-t border-[#172E54] flex items-center justify-between gap-3">
            <Link to="/" className="text-xs text-[#D4B46E] underline">
              Public Site
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="min-h-[40px] inline-flex items-center gap-2 px-4 py-2 bg-[#0A1629] text-xs font-medium"
            >
              <LogOut className="w-3.5 h-3.5 text-[#D4B46E]" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 min-w-0">
        <div className="bg-[#FFFFFF] border-b border-[#E6DFD3] px-4 sm:px-8 py-6">
          <p className="text-xs uppercase tracking-[0.18em] text-[#8D6A26] font-medium">
            Beccan School Content Management
          </p>
          <h1 className="font-serif text-3xl font-semibold text-[#0F213E] mt-1">
            {activeNav.label}
          </h1>
        </div>

        <div className="p-4 sm:p-8 max-w-[1200px]">
          {activeTab === 'overview' && (
            <AdminOverviewSection onNavigateTab={setActiveTab} />
          )}
          {activeTab === 'gallery' && <AdminGallerySection />}
          {activeTab === 'news' && <AdminNewsSection />}
          {activeTab === 'announcements' && <AdminAnnouncementsSection />}
          {activeTab === 'events' && <AdminEventsSection />}
          {activeTab === 'settings' && (
            <AdminSettingsSection username={session.username} />
          )}
        </div>
      </main>
    </div>
  );
}

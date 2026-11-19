import { Mail, Phone, X } from 'lucide-react';
import { useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { schoolRepository } from '../../services/schoolRepository';
import { SchoolCrest } from '../common/SchoolCrest';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const mobileNavLinks = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About Us' },
  { to: '/academics', label: 'Academics' },
  { to: '/admissions', label: 'Admissions' },
  { to: '/facilities', label: 'Facilities' },
  { to: '/gallery', label: 'Gallery' },
  { to: '/news', label: 'News & Events' },
  { to: '/contact', label: 'Contact Us' },
];

export function MobileDrawer({ isOpen, onClose }: MobileDrawerProps) {
  const profile = schoolRepository.getProfile();

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 lg:hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Site navigation"
    >
      <div
        className="fixed inset-0 bg-[#0A1629]/60 backdrop-blur-xs"
        onClick={onClose}
        aria-hidden="true"
      />
      <nav className="relative ml-auto flex h-full w-full max-w-sm flex-col bg-[#FBF9F5] border-l border-[#E6DFD3] shadow-xl overflow-y-auto">
        <div className="flex items-center justify-between px-6 h-16 border-b border-[#E6DFD3]">
          <div className="flex items-center gap-2.5">
            <SchoolCrest className="w-7 h-7 shrink-0" />
            <span className="font-serif text-xl font-semibold text-[#0F213E] whitespace-nowrap">
              {profile.name}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center text-[#0F213E] hover:bg-[#F4EFE6] transition-colors"
            aria-label="Close navigation menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 px-6 py-6 flex flex-col gap-1">
          {mobileNavLinks.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={onClose}
              className={({ isActive }) =>
                `min-h-[44px] flex items-center justify-between px-3 py-2.5 text-base font-medium border-b border-[#E6DFD3]/70 transition-colors ${
                  isActive
                    ? 'text-[#0F213E] bg-[#F4EFE6] font-semibold'
                    : 'text-[#333D4D] hover:text-[#0F213E] hover:bg-[#F4EFE6]/60'
                }`
              }
            >
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>

        <div className="p-6 bg-[#0F213E] text-[#FBF9F5] space-y-4">
          <p className="text-xs uppercase tracking-[0.16em] text-[#D4B46E]">
            {profile.motto}
          </p>
          <div className="space-y-2 text-sm text-[#D4DCE8]">
            <a
              href={profile.contact.telephoneHref}
              className="min-h-[44px] flex items-center gap-2.5 text-[#FBF9F5] hover:text-[#D4B46E] transition-colors tabular-nums"
            >
              <Phone className="w-4 h-4 text-[#D4B46E] shrink-0" />
              <span>{profile.contact.telephoneDisplay}</span>
            </a>
            <a
              href={`mailto:${profile.contact.email}`}
              className="min-h-[44px] flex items-center gap-2.5 text-[#FBF9F5] hover:text-[#D4B46E] transition-colors"
            >
              <Mail className="w-4 h-4 text-[#D4B46E] shrink-0" />
              <span>{profile.contact.email}</span>
            </a>
          </div>
        </div>
      </nav>
    </div>
  );
}

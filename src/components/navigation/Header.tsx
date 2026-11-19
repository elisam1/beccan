import { Menu } from 'lucide-react';
import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { buildWhatsAppUrl, WHATSAPP_MESSAGES } from '../../utils/whatsapp';
import { SchoolWordmark } from '../common/SchoolWordmark';
import { WhatsAppIcon } from '../common/WhatsAppIcon';
import { MobileDrawer } from './MobileDrawer';

const desktopNavLinks = [
  { to: '/about', label: 'About' },
  { to: '/academics', label: 'Academics' },
  { to: '/facilities', label: 'Facilities' },
  { to: '/gallery', label: 'Gallery' },
  { to: '/news', label: 'News' },
  { to: '/contact', label: 'Contact' },
];

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const whatsappHref = buildWhatsAppUrl(WHATSAPP_MESSAGES.general);

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:bg-[#0F213E] focus:text-[#FBF9F5] focus:px-4 focus:py-2 focus:text-sm focus:font-medium"
      >
        Skip to main content
      </a>

      <header className="sticky top-0 z-40 bg-[#FBF9F5]/95 backdrop-blur-sm border-b border-[#E6DFD3]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 h-16 lg:h-20 flex items-center justify-between gap-6">
          {/* Zone 1: Clean typographic BECCAN SCHOOL wordmark */}
          <Link
            to="/"
            className="inline-flex items-center whitespace-nowrap shrink-0 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B58E43]"
            aria-label="Beccan School home"
          >
            <SchoolWordmark variant="navy" size="md" />
          </Link>

          {/* Zone 2: Single-line navigation links */}
          <nav
            className="hidden lg:flex items-center gap-6 xl:gap-7"
            aria-label="Primary navigation"
          >
            {desktopNavLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `relative py-1 text-sm font-medium whitespace-nowrap shrink-0 transition-colors duration-150 ${
                    isActive
                      ? 'text-[#0F213E] after:absolute after:left-0 after:right-0 after:-bottom-0.5 after:h-[2px] after:bg-[#B58E43]'
                      : 'text-[#333D4D] hover:text-[#0F213E]'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          {/* Zone 3: WhatsApp contact + Admissions CTA + mobile menu trigger */}
          <div className="flex items-center gap-2.5 shrink-0">
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-[#15803D] text-[#15803D] bg-[#FFFFFF] hover:bg-[#15803D] hover:text-[#FFFFFF] text-sm font-medium transition-colors duration-150 whitespace-nowrap shrink-0"
              aria-label="Chat with Beccan School on WhatsApp"
            >
              <WhatsAppIcon className="w-4 h-4 shrink-0" />
              <span>WhatsApp</span>
            </a>

            <Link
              to="/admissions"
              className="hidden sm:inline-flex items-center justify-center px-5 py-2.5 bg-[#0F213E] text-[#FBF9F5] text-sm font-medium tracking-wide hover:bg-[#172E54] transition-colors duration-150 whitespace-nowrap shrink-0"
            >
              Admissions
            </Link>

            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="lg:hidden min-w-[44px] min-h-[44px] inline-flex items-center justify-center text-[#0F213E] border border-[#E6DFD3] bg-[#FFFFFF] hover:bg-[#F4EFE6] transition-colors cursor-pointer"
              aria-label="Open navigation menu"
              aria-expanded={mobileOpen}
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <MobileDrawer isOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
    </>
  );
}

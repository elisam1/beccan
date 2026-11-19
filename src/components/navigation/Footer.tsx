import { Mail, MapPin, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';
import { schoolRepository } from '../../services/schoolRepository';
import { SchoolCrest } from '../common/SchoolCrest';

const schoolLinks = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About Us' },
  { to: '/academics', label: 'Academics' },
  { to: '/admissions', label: 'Admissions' },
];

const campusLinks = [
  { to: '/facilities', label: 'Facilities' },
  { to: '/gallery', label: 'Gallery' },
  { to: '/news', label: 'News & Events' },
  { to: '/contact', label: 'Contact Us' },
];

export function Footer() {
  const profile = schoolRepository.getProfile();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#0F213E] text-[#FBF9F5] border-t border-[#172E54]">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 lg:gap-12">
          {/* Identity */}
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center gap-3">
              <SchoolCrest variant="gold" className="w-9 h-9 shrink-0" />
              <div>
                <p className="font-serif text-2xl font-semibold text-[#FBF9F5]">
                  {profile.name}
                </p>
                <p className="text-xs uppercase tracking-[0.16em] text-[#D4B46E]">
                  {profile.motto}
                </p>
              </div>
            </div>
            <p className="text-sm text-[#D4DCE8] leading-relaxed max-w-md">
              A private basic school in Dodowa, Shai-Osudoku District, Greater Accra
              Region, Ghana—nurturing academic excellence, discipline, and character.
            </p>
            <p className="text-xs text-[#A3B3C9]">
              Temporary wordmark emblem shown pending official crest verification.
            </p>
          </div>

          {/* Navigation columns */}
          <div className="md:col-span-3 space-y-3">
            <h3 className="font-sans text-xs uppercase tracking-[0.16em] text-[#D4B46E] font-semibold">
              School
            </h3>
            <ul className="space-y-2.5 text-sm">
              {schoolLinks.map((item) => (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className="text-[#D4DCE8] hover:text-[#FBF9F5] transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 gap-6">
              <div className="space-y-3">
                <h3 className="font-sans text-xs uppercase tracking-[0.16em] text-[#D4B46E] font-semibold">
                  Campus & Updates
                </h3>
                <ul className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-sm">
                  {campusLinks.map((item) => (
                    <li key={item.to}>
                      <Link
                        to={item.to}
                        className="text-[#D4DCE8] hover:text-[#FBF9F5] transition-colors"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-2.5 pt-2 border-t border-[#172E54] text-sm text-[#D4DCE8]">
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-[#D4B46E] shrink-0 mt-0.5" />
                  <span>{profile.contact.campusLabel}</span>
                </div>
                <div className="flex items-center gap-2.5 tabular-nums">
                  <Phone className="w-4 h-4 text-[#D4B46E] shrink-0" />
                  <a
                    href={profile.contact.telephoneHref}
                    className="hover:text-[#FBF9F5] transition-colors"
                  >
                    {profile.contact.telephoneDisplay}
                  </a>
                </div>
                <div className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-[#D4B46E] shrink-0" />
                  <a
                    href={`mailto:${profile.contact.email}`}
                    className="hover:text-[#FBF9F5] transition-colors"
                  >
                    {profile.contact.email}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-[#172E54] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-[#A3B3C9]">
          <p>
            © {currentYear} {profile.name} · {profile.contact.town},{' '}
            {profile.contact.region}, {profile.contact.country}. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <span>Official school records take precedence</span>
            <span aria-hidden="true">·</span>
            <Link
              to="/admin"
              className="text-[#D4DCE8] hover:text-[#D4B46E] transition-colors"
            >
              Admin Portal
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

import { Link } from 'react-router-dom';

interface PageBannerProps {
  kicker: string;
  title: string;
  subtitle: string;
  currentPageLabel: string;
}

export function PageBanner({
  kicker,
  title,
  subtitle,
  currentPageLabel,
}: PageBannerProps) {
  return (
    <section className="bg-[#0F213E] text-[#FBF9F5] border-b border-[#172E54]">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-18">
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-2 text-xs text-[#A3B3C9] mb-5"
        >
          <Link to="/" className="hover:text-[#FBF9F5] transition-colors">
            Home
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-[#D4B46E]">{currentPageLabel}</span>
        </nav>

        <p className="text-xs uppercase tracking-[0.18em] text-[#D4B46E] font-medium mb-3">
          {kicker}
        </p>
        <h1 className="font-serif text-4xl sm:text-5xl font-semibold leading-[1.1] tracking-tight max-w-3xl text-[#FBF9F5]">
          {title}
        </h1>
        <p className="mt-4 text-base sm:text-lg text-[#D4DCE8] leading-relaxed max-w-2xl">
          {subtitle}
        </p>
        <div className="mt-8 w-16 h-[2px] bg-[#B58E43]" aria-hidden="true" />
      </div>
    </section>
  );
}

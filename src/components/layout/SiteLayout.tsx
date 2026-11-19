import { ReactNode } from 'react';
import { Footer } from '../navigation/Footer';
import { Header } from '../navigation/Header';

interface SiteLayoutProps {
  children: ReactNode;
}

export function SiteLayout({ children }: SiteLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-[#FBF9F5] text-[#141B29]">
      <Header />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}

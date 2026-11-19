import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useDocumentMeta } from '../hooks/useDocumentMeta';

export function NotFoundPage() {
  useDocumentMeta({
    title: 'Page Not Found',
    description: 'The requested page on the Beccan School website could not be found.',
  });

  return (
    <section className="py-24 bg-[#FBF9F5]">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 max-w-xl space-y-5">
        <p className="text-xs uppercase tracking-[0.18em] text-[#8D6A26] font-medium">
          404 · Page Not Found
        </p>
        <h1 className="font-serif text-4xl sm:text-5xl font-semibold text-[#0F213E]">
          We could not find that page.
        </h1>
        <p className="text-base text-[#333D4D] leading-relaxed">
          Please use the main navigation above or return to the Beccan School
          homepage.
        </p>
        <Link
          to="/"
          className="min-h-[44px] inline-flex items-center gap-2 px-6 py-3 bg-[#0F213E] text-[#FBF9F5] text-sm font-medium hover:bg-[#172E54] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Home</span>
        </Link>
      </div>
    </section>
  );
}

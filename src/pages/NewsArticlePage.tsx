import { ArrowLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PageBanner } from '../components/layout/PageBanner';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import { ApiError, cmsApi } from '../services/cmsApi';
import { CmsNewsArticle } from '../types/cms';
import { formatDisplayDate, splitParagraphs } from '../utils/formatting';

export function NewsArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const [article, setArticle] = useState<CmsNewsArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      setErrorMessage('Article not found.');
      return;
    }
    let active = true;
    setLoading(true);
    cmsApi
      .getPublicArticle(slug)
      .then((res) => {
        if (active) {
          setArticle(res.article);
          setErrorMessage(null);
        }
      })
      .catch((err) => {
        if (active) {
          setArticle(null);
          setErrorMessage(
            err instanceof ApiError
              ? err.message
              : 'This article could not be loaded.',
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [slug]);

  useDocumentMeta({
    title: article ? article.title : 'News Article',
    description: article
      ? article.summary
      : 'Read published news and announcements from Beccan School in Dodowa, Ghana.',
  });

  if (loading) {
    return (
      <section className="py-20 bg-[#FBF9F5]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 max-w-2xl space-y-4">
          <div className="h-8 w-48 bg-[#E6DFD3] animate-pulse" />
          <div className="h-12 w-full bg-[#E6DFD3] animate-pulse" />
          <div className="h-64 w-full bg-[#E6DFD3] animate-pulse" />
        </div>
      </section>
    );
  }

  if (!article) {
    return (
      <section className="py-20 bg-[#FBF9F5]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 max-w-2xl space-y-5">
          <p className="text-xs uppercase tracking-[0.16em] text-[#8D6A26] font-medium">
            Article Unavailable
          </p>
          <h1 className="font-serif text-4xl font-semibold text-[#0F213E]">
            This news article could not be found.
          </h1>
          <p className="text-base text-[#333D4D]">
            {errorMessage ||
              'It may have been archived, unpublished, or the address may be incorrect.'}
          </p>
          <Link
            to="/news"
            className="min-h-[44px] inline-flex items-center gap-2 px-5 py-2.5 bg-[#0F213E] text-[#FBF9F5] text-sm font-medium hover:bg-[#172E54] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to News & Events</span>
          </Link>
        </div>
      </section>
    );
  }

  const paragraphs = splitParagraphs(article.content);

  return (
    <div>
      <PageBanner
        kicker={`${article.category} · ${formatDisplayDate(article.publishedAt || article.updatedAt)}`}
        title={article.title}
        subtitle={article.summary}
        currentPageLabel="Article"
      />

      <article className="py-14 sm:py-18 bg-[#FBF9F5]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            {article.coverImageUrl && (
              <div className="mb-8 border border-[#E6DFD3] bg-[#FFFFFF] overflow-hidden">
                <img
                  src={article.coverImageUrl}
                  alt={article.title}
                  className="w-full aspect-[16/9] object-cover"
                />
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2 text-xs text-[#5B6472] pb-6 mb-8 border-b border-[#E6DFD3]">
              <span>{article.category}</span>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">
                Published{' '}
                {formatDisplayDate(article.publishedAt || article.updatedAt)}
              </span>
            </div>

            <div className="space-y-5 text-base sm:text-[1.0625rem] text-[#333D4D] leading-[1.8]">
              {paragraphs.map((paragraph, index) => (
                <p
                  key={index}
                  className={
                    index === 0
                      ? 'first-letter:font-serif first-letter:text-5xl first-letter:font-semibold first-letter:float-left first-letter:mr-3 first-letter:leading-[0.85] first-letter:text-[#0F213E]'
                      : ''
                  }
                >
                  {paragraph}
                </p>
              ))}
            </div>

            <div className="mt-10 pt-6 border-t border-[#E6DFD3] flex flex-wrap items-center justify-between gap-4">
              <Link
                to="/news"
                className="min-h-[44px] inline-flex items-center gap-2 text-sm font-semibold text-[#0F213E] hover:text-[#8D6A26] transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to all News & Events</span>
              </Link>
              <Link
                to="/admissions"
                className="min-h-[44px] inline-flex items-center justify-center px-5 py-2.5 bg-[#0F213E] text-[#FBF9F5] text-sm font-medium hover:bg-[#172E54] transition-colors"
              >
                Admission Enquiries
              </Link>
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}

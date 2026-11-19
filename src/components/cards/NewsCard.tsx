import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CmsNewsArticle } from '../../types/cms';
import { formatDisplayDate } from '../../utils/formatting';

interface NewsCardProps {
  article: CmsNewsArticle;
}

export function NewsCard({ article }: NewsCardProps) {
  return (
    <article className="bg-[#FFFFFF] border border-[#E6DFD3] flex flex-col justify-between transition-colors hover:border-[#B58E43]">
      <div>
        {article.coverThumbnailUrl && (
          <Link
            to={`/news/${article.slug}`}
            className="block aspect-[16/9] bg-[#F4EFE6] overflow-hidden border-b border-[#E6DFD3]"
          >
            <img
              src={article.coverThumbnailUrl}
              alt={article.title}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-300 hover:scale-[1.02]"
            />
          </Link>
        )}

        <div className="p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-2 text-xs text-[#5B6472] mb-3">
            <span className="uppercase tracking-[0.14em] text-[#8D6A26] font-medium">
              {article.category}
            </span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">
              {formatDisplayDate(article.publishedAt || article.updatedAt)}
            </span>
          </div>

          <h3 className="font-serif text-2xl font-semibold text-[#0F213E] leading-snug">
            <Link
              to={`/news/${article.slug}`}
              className="hover:text-[#214070] transition-colors"
            >
              {article.title}
            </Link>
          </h3>

          <p className="mt-3 text-sm sm:text-base text-[#333D4D] leading-relaxed">
            {article.summary}
          </p>
        </div>
      </div>

      <div className="px-6 sm:px-8 pb-6 pt-4 border-t border-[#E6DFD3] flex items-center justify-end">
        <Link
          to={`/news/${article.slug}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[#0F213E] hover:text-[#8D6A26] transition-colors whitespace-nowrap shrink-0"
        >
          <span>Read article</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </article>
  );
}

import { useEffect } from 'react';

interface DocumentMetaOptions {
  title: string;
  description: string;
}

function upsertMetaTag(
  selector: string,
  attributeName: 'name' | 'property',
  attributeValue: string,
  content: string,
) {
  let element = document.head.querySelector<HTMLMetaElement>(selector);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attributeName, attributeValue);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
}

export function useDocumentMeta({ title, description }: DocumentMetaOptions) {
  useEffect(() => {
    const fullTitle = title.includes('Beccan School')
      ? title
      : `${title} | Beccan School, Dodowa`;
    document.title = fullTitle;

    upsertMetaTag('meta[name="description"]', 'name', 'description', description);
    upsertMetaTag('meta[property="og:title"]', 'property', 'og:title', fullTitle);
    upsertMetaTag(
      'meta[property="og:description"]',
      'property',
      'og:description',
      description,
    );
    upsertMetaTag(
      'meta[name="twitter:title"]',
      'name',
      'twitter:title',
      fullTitle,
    );
    upsertMetaTag(
      'meta[name="twitter:description"]',
      'name',
      'twitter:description',
      description,
    );

    const canonicalHref = window.location.origin + window.location.pathname;
    upsertMetaTag('meta[property="og:url"]', 'property', 'og:url', canonicalHref);

    let canonicalLink = document.head.querySelector<HTMLLinkElement>(
      'link[rel="canonical"]',
    );
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', canonicalHref);
  }, [title, description]);
}

import { buildWhatsAppUrl, WHATSAPP_MESSAGES } from '../../utils/whatsapp';
import { WhatsAppIcon } from './WhatsAppIcon';

export function FloatingWhatsAppButton() {
  const href = buildWhatsAppUrl(WHATSAPP_MESSAGES.floating);

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with Beccan School on WhatsApp"
      title="Chat with Beccan School on WhatsApp"
      className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-30 min-h-[48px] min-w-[48px] inline-flex items-center justify-center gap-2.5 px-3.5 sm:px-4 py-3 bg-[#15803D] text-[#FFFFFF] shadow-lg border border-[#166534] hover:bg-[#166534] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4B46E] focus-visible:ring-offset-2 transition-colors duration-150"
    >
      <WhatsAppIcon className="w-5 h-5 shrink-0" />
      <span className="hidden sm:inline text-sm font-semibold tracking-wide whitespace-nowrap">
        Chat on WhatsApp
      </span>
    </a>
  );
}

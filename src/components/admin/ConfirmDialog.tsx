import { AlertTriangle, X } from 'lucide-react';
import { useEffect } from 'react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  isDanger?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel = 'Confirm',
  isDanger = false,
  busy = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) onCancel();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, busy, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0A1629]/70 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <div className="w-full max-w-md bg-[#FFFFFF] border border-[#E6DFD3] shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E6DFD3] bg-[#FBF9F5]">
          <div className="flex items-center gap-2.5">
            <AlertTriangle
              className={`w-5 h-5 ${isDanger ? 'text-[#9A3412]' : 'text-[#8D6A26]'}`}
            />
            <h3
              id="confirm-dialog-title"
              className="font-serif text-xl font-semibold text-[#0F213E]"
            >
              {title}
            </h3>
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={onCancel}
            className="min-w-[40px] min-h-[40px] inline-flex items-center justify-center text-[#5B6472] hover:text-[#0F213E]"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6">
          <p className="text-sm text-[#333D4D] leading-relaxed">{description}</p>
        </div>

        <div className="px-6 py-4 bg-[#F4EFE6] border-t border-[#E6DFD3] flex items-center justify-end gap-3">
          <button
            type="button"
            disabled={busy}
            onClick={onCancel}
            className="min-h-[40px] px-4 py-2 bg-[#FFFFFF] border border-[#D4C8B4] text-sm font-medium text-[#0F213E] hover:border-[#0F213E] cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onConfirm}
            className={`min-h-[40px] px-5 py-2 text-sm font-medium text-[#FFFFFF] transition-colors cursor-pointer disabled:opacity-60 ${
              isDanger
                ? 'bg-[#9A3412] hover:bg-[#7C2D12]'
                : 'bg-[#0F213E] hover:bg-[#172E54]'
            }`}
          >
            {busy ? 'Working...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

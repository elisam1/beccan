import {
  AlertCircle,
  AlertTriangle,
  Archive,
  CheckCircle2,
  Clock,
  FileEdit,
  Megaphone,
} from 'lucide-react';
import { AnnouncementPriority } from '../../types/cms';

export function PublishStatusLabel({ status }: { status?: string }) {
  if (status === 'published') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#14532D] uppercase tracking-[0.12em]">
        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
        <span>Published</span>
      </span>
    );
  }
  if (status === 'archived') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#5B6472] uppercase tracking-[0.12em]">
        <Archive className="w-3.5 h-3.5 shrink-0" />
        <span>Archived</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#8D6A26] uppercase tracking-[0.12em]">
      <FileEdit className="w-3.5 h-3.5 shrink-0" />
      <span>Draft</span>
    </span>
  );
}

export function PriorityLabel({ priority }: { priority: AnnouncementPriority }) {
  if (priority === 'Urgent') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#9A3412] uppercase tracking-[0.14em]">
        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
        <span>Urgent Notice</span>
      </span>
    );
  }
  if (priority === 'Important') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#8D6A26] uppercase tracking-[0.14em]">
        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
        <span>Important Notice</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0F213E] uppercase tracking-[0.14em]">
      <Megaphone className="w-3.5 h-3.5 shrink-0" />
      <span>Notice</span>
    </span>
  );
}

export function EventTimeStatusLabel({ isUpcoming }: { isUpcoming: boolean }) {
  if (isUpcoming) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#14532D] uppercase tracking-[0.12em]">
        <Clock className="w-3.5 h-3.5 shrink-0" />
        <span>Upcoming Event</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#5B6472] uppercase tracking-[0.12em]">
      <Archive className="w-3.5 h-3.5 shrink-0" />
      <span>Past Event</span>
    </span>
  );
}

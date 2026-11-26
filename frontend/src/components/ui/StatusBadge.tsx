import type { EnquiryStatus, PublishStatus } from '@/types/api';

type AnyStatus = PublishStatus | EnquiryStatus;

const STATUS_STYLES: Record<AnyStatus, string> = {
  PUBLISHED: 'border-[#0E0E0E] bg-[#0E0E0E] text-white',
  DRAFT: 'border-[#0E0E0E]/20 bg-[#F5F5F7] text-[#5C5C5C]',
  ARCHIVED: 'border-[#0E0E0E]/12 bg-white text-[#9A9A9A]',
  NEW: 'border-[#0E0E0E] bg-white text-[#0E0E0E]',
  IN_PROGRESS: 'border-[#0E0E0E]/40 bg-[#F5F5F7] text-[#0E0E0E]',
  RESPONDED: 'border-[#0E0E0E]/70 bg-[#0E0E0E]/10 text-[#0E0E0E]',
  CLOSED: 'border-[#0E0E0E] bg-[#0E0E0E] text-white',
};

export function StatusBadge({ status }: { status: AnyStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium tracking-wide uppercase ${STATUS_STYLES[status]}`}
    >
      {status.replace('_', ' ')}
    </span>
  );
}

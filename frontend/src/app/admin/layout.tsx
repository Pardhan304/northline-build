import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { QueryProvider } from '@/components/providers/QueryProvider';

export const metadata: Metadata = {
  title: {
    default: 'Admin | Northline Build',
    template: '%s | Northline Admin',
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <div className="min-h-screen bg-surface text-graphite">{children}</div>
    </QueryProvider>
  );
}

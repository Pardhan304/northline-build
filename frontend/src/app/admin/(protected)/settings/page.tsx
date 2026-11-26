'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { ErrorState, LoadingSkeleton } from '@/components/ui/AsyncStates';
import { queryKeys } from '@/lib/query-keys';
import { adminApi } from '@/services/admin-api';
import type { PublicSettingsDto } from '@/types/api';

function SettingsFormInner({ initial }: { initial: PublicSettingsDto }) {
  const queryClient = useQueryClient();
  const [companyName, setCompanyName] = useState(initial.general?.companyName ?? 'Northline Build');
  const [tagline, setTagline] = useState(initial.general?.tagline ?? '');
  const [footerStatement, setFooterStatement] = useState(initial.general?.footerStatement ?? '');

  const [email, setEmail] = useState(initial.contact?.email ?? '');
  const [phone, setPhone] = useState(initial.contact?.phone ?? '');
  const [address, setAddress] = useState(initial.contact?.address ?? '');
  const [businessHours, setBusinessHours] = useState(initial.contact?.businessHours ?? '');

  const [linkedinUrl, setLinkedinUrl] = useState(initial.social?.linkedinUrl ?? '');
  const [instagramUrl, setInstagramUrl] = useState(initial.social?.instagramUrl ?? '');

  const [defaultTitle, setDefaultTitle] = useState(
    initial.seo?.defaultTitle ?? 'Northline Build — Construction & Engineering',
  );
  const [defaultDescription, setDefaultDescription] = useState(
    initial.seo?.defaultDescription ?? '',
  );

  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () =>
      adminApi.updateSettings({
        general: { companyName, tagline, footerStatement },
        contact: { email, phone, address, businessHours },
        social: { linkedinUrl, instagramUrl },
        seo: { defaultTitle, defaultDescription },
      }),
    onSuccess: async () => {
      setErrorMsg(null);
      setSavedMsg('Site settings saved.');
      await queryClient.invalidateQueries({ queryKey: queryKeys.settings.all });
    },
    onError: (err) => {
      setSavedMsg(null);
      setErrorMsg(err instanceof Error ? err.message : 'Unable to update settings.');
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSavedMsg(null);
    setErrorMsg(null);
    mutation.mutate();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-medium tracking-tight">Site Settings</h1>
          <p className="mt-1 text-sm text-graphite/70">
            Manage public company details, contact channels, official social URLs, and SEO defaults.
          </p>
        </div>

        <button
          type="submit"
          disabled={mutation.isPending}
          className="border border-graphite bg-graphite px-5 py-2.5 text-xs font-semibold tracking-wider text-surface uppercase hover:border-accent hover:bg-accent disabled:opacity-60"
        >
          {mutation.isPending ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      {savedMsg ? (
        <div role="status" className="border border-olive/40 bg-olive/10 p-3.5 text-sm">
          {savedMsg}
        </div>
      ) : null}

      {errorMsg ? (
        <div role="alert" className="border border-accent/50 bg-accent/10 p-3.5 text-sm">
          {errorMsg}
        </div>
      ) : null}

      <section className="grid gap-5 border border-border bg-surface p-6 sm:grid-cols-2">
        <h2 className="text-base font-semibold sm:col-span-2">General Identity</h2>
        <div>
          <label className="block font-mono text-xs text-olive uppercase">Company Name</label>
          <input
            type="text"
            required
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            className="mt-1 w-full border border-border bg-paper px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block font-mono text-xs text-olive uppercase">Tagline</label>
          <input
            type="text"
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            className="mt-1 w-full border border-border bg-paper px-3 py-2 text-sm"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block font-mono text-xs text-olive uppercase">Footer Statement</label>
          <textarea
            rows={2}
            value={footerStatement}
            onChange={(e) => setFooterStatement(e.target.value)}
            className="mt-1 w-full border border-border bg-paper px-3 py-2 text-sm"
          />
        </div>
      </section>

      <section className="grid gap-5 border border-border bg-surface p-6 sm:grid-cols-2">
        <h2 className="text-base font-semibold sm:col-span-2">Public Contact Information</h2>
        <div>
          <label className="block font-mono text-xs text-olive uppercase">Contact Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full border border-border bg-paper px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block font-mono text-xs text-olive uppercase">Telephone</label>
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="mt-1 w-full border border-border bg-paper px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block font-mono text-xs text-olive uppercase">Office Address</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="mt-1 w-full border border-border bg-paper px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block font-mono text-xs text-olive uppercase">Business Hours</label>
          <input
            type="text"
            value={businessHours}
            onChange={(e) => setBusinessHours(e.target.value)}
            className="mt-1 w-full border border-border bg-paper px-3 py-2 text-sm"
          />
        </div>
      </section>

      <section className="grid gap-5 border border-border bg-surface p-6 sm:grid-cols-2">
        <h2 className="text-base font-semibold sm:col-span-2">Social & Default SEO</h2>
        <div>
          <label className="block font-mono text-xs text-olive uppercase">LinkedIn URL</label>
          <input
            type="url"
            value={linkedinUrl}
            onChange={(e) => setLinkedinUrl(e.target.value)}
            className="mt-1 w-full border border-border bg-paper px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block font-mono text-xs text-olive uppercase">Instagram URL</label>
          <input
            type="url"
            value={instagramUrl}
            onChange={(e) => setInstagramUrl(e.target.value)}
            className="mt-1 w-full border border-border bg-paper px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block font-mono text-xs text-olive uppercase">Default SEO Title</label>
          <input
            type="text"
            required
            value={defaultTitle}
            onChange={(e) => setDefaultTitle(e.target.value)}
            className="mt-1 w-full border border-border bg-paper px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block font-mono text-xs text-olive uppercase">
            Default SEO Description
          </label>
          <input
            type="text"
            value={defaultDescription}
            onChange={(e) => setDefaultDescription(e.target.value)}
            className="mt-1 w-full border border-border bg-paper px-3 py-2 text-sm"
          />
        </div>
      </section>
    </form>
  );
}

export default function AdminSettingsPage() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: queryKeys.settings.all,
    queryFn: () => adminApi.getSettings(),
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) return <LoadingSkeleton rows={5} />;

  if (isError) {
    return (
      <ErrorState
        title="Unable to load site settings"
        message={error instanceof Error ? error.message : 'Request failed.'}
        onRetry={() => void refetch()}
      />
    );
  }

  return <SettingsFormInner key={JSON.stringify(data ?? {})} initial={data ?? {}} />;
}

import crypto from 'node:crypto';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ContactForm } from '@/components/public/ContactForm';
import { HomeServices } from '@/components/public/HomeServices';
import {
  AccessDeniedState,
  EmptyState,
  ErrorState,
  LoadingSkeleton,
} from '@/components/ui/AsyncStates';
import { ApiError } from '@/lib/api-error';
import { isAllowedCacheTag, verifyRevalidationSignature } from '@/lib/revalidation';

const mockSubmitEnquiry = vi.fn();

vi.mock('@/services/public-api', () => ({
  submitPublicEnquiry: (...args: unknown[]) => mockSubmitEnquiry(...args),
}));

describe('AsyncStates conditional rendering primitives', () => {
  it('renders loading skeleton without empty state messaging', () => {
    render(<LoadingSkeleton rows={2} />);
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.queryByText(/no records/i)).not.toBeInTheDocument();
  });

  it('renders error state with retry callback', () => {
    const onRetry = vi.fn();
    render(<ErrorState title="Failed" message="Network down" onRetry={onRetry} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Failed');
    fireEvent.click(screen.getByRole('button', { name: /retry/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('renders distinct empty and 403 access denied states', () => {
    render(
      <>
        <EmptyState title="No projects yet" />
        <AccessDeniedState />
      </>,
    );
    expect(screen.getByText('No projects yet')).toBeInTheDocument();
    expect(screen.getByText('Access denied')).toBeInTheDocument();
  });
});

describe('ContactForm validation, error preservation, and confirmation', () => {
  it('displays validation errors and does not submit invalid data', async () => {
    render(<ContactForm />);
    fireEvent.click(screen.getByRole('button', { name: /send project enquiry/i }));

    expect(await screen.findByText(/please enter your full name/i)).toBeInTheDocument();
    expect(screen.getByText(/please enter a valid work email address/i)).toBeInTheDocument();
    expect(screen.getByText(/please enter a valid phone number/i)).toBeInTheDocument();
    expect(mockSubmitEnquiry).not.toHaveBeenCalled();
  });

  it('preserves entered values on API failure and confirms only after backend success', async () => {
    mockSubmitEnquiry.mockRejectedValueOnce(new ApiError(500, 'INTERNAL_ERROR', 'Server error'));

    render(<ContactForm />);
    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Jordan Ellis' } });
    fireEvent.change(screen.getByLabelText(/work email/i), {
      target: { value: 'jordan@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/phone number/i), {
      target: { value: '+91 98765 43210' },
    });
    fireEvent.change(screen.getByLabelText(/project brief/i), {
      target: { value: 'Structural steel warehouse design and build tender enquiry.' },
    });
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: /send project enquiry/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /couldn’t submit your enquiry just now/i,
    );
    expect((screen.getByLabelText(/full name/i) as HTMLInputElement).value).toBe('Jordan Ellis');

    mockSubmitEnquiry.mockResolvedValueOnce({
      id: '12345678-1234-4123-8123-123456789012',
      createdAt: new Date().toISOString(),
    });

    fireEvent.click(screen.getByRole('button', { name: /send project enquiry/i }));
    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('Enquiry received');
    });
  });
});

describe('HomeServices interactive selection', () => {
  it('updates capability detail on keyboard focus or click', () => {
    render(
      <HomeServices
        heading="Services"
        services={[
          {
            id: 's1',
            title: 'Pre-Construction',
            slug: 'pre-construction',
            summary: 'Cost & feasibility planning.',
            description: 'Detailed pre-construction scheduling.',
            status: 'PUBLISHED',
            sortOrder: 0,
            iconKey: null,
            createdAt: '',
            updatedAt: '',
          },
          {
            id: 's2',
            title: 'Structural Delivery',
            slug: 'structural-delivery',
            summary: 'Concrete and timber execution.',
            description: 'Site supervision and tolerance control.',
            status: 'PUBLISHED',
            sortOrder: 1,
            iconKey: null,
            createdAt: '',
            updatedAt: '',
          },
        ]}
      />,
    );

    expect(screen.getAllByText('Detailed pre-construction scheduling.').length).toBeGreaterThan(0);
    const structuralButtons = screen.getAllByRole('button', { name: /structural delivery/i });
    fireEvent.click(structuralButtons[structuralButtons.length - 1]!);
    expect(structuralButtons[0]).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getAllByText('Site supervision and tolerance control.').length).toBeGreaterThan(0);
  });
});

describe('Revalidation signature & tag allowlist', () => {
  it('validates HMAC signature within replay window and rejects tampered/expired payloads', () => {
    const secret = 'test-revalidation-secret-key';
    const now = 1_700_000_000_000;
    const ts = String(now);
    const body = JSON.stringify({ tags: ['projects', 'project:civic-hub'] });
    const signature = crypto.createHmac('sha256', secret).update(`${ts}.${body}`).digest('hex');

    expect(
      verifyRevalidationSignature({ rawBody: body, timestamp: ts, signature, secret, nowMs: now }),
    ).toEqual({ ok: true });

    expect(
      verifyRevalidationSignature({
        rawBody: body,
        timestamp: String(now - 10 * 60 * 1000),
        signature,
        secret,
        nowMs: now,
      }).ok,
    ).toBe(false);

    expect(
      verifyRevalidationSignature({
        rawBody: body,
        timestamp: ts,
        signature: '0'.repeat(64),
        secret,
        nowMs: now,
      }).ok,
    ).toBe(false);

    expect(isAllowedCacheTag('projects')).toBe(true);
    expect(isAllowedCacheTag('project:civic-hub')).toBe(true);
    expect(isAllowedCacheTag('admin:secrets')).toBe(false);
  });
});

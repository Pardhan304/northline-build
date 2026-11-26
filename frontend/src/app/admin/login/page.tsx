'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { NorthlineLogo } from '@/components/brand/NorthlineLogo';
import { isApiError } from '@/lib/api-error';
import { queryKeys } from '@/lib/query-keys';
import { adminApi } from '@/services/admin-api';

const loginSchema = z.object({
  email: z.string().trim().email('Enter a valid email address.'),
  password: z.string().min(1, 'Password is required.'),
});

type LoginValues = z.infer<typeof loginSchema>;

export default function AdminLoginPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [authError, setAuthError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (values: LoginValues) => {
    setAuthError(null);
    try {
      const { user } = await adminApi.login(values);
      queryClient.setQueryData(queryKeys.auth.me, user);
      router.replace('/admin/dashboard');
    } catch (error) {
      if (isApiError(error)) {
        setAuthError(error.message);
        return;
      }
      setAuthError('Unable to sign in right now. Please try again.');
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-paper px-4 py-12">
      <div className="w-full max-w-md border border-border bg-surface p-8 sm:p-10">
        <NorthlineLogo size="md" className="text-graphite" />
        <h1 className="mt-5 text-2xl font-medium tracking-tight text-graphite">
          Administrator Sign In
        </h1>
        <p className="mt-2 text-sm text-graphite/70">
          Sign in with your provisioned Northline Build credentials.
        </p>

        {authError ? (
          <div role="alert" className="mt-6 border border-accent/50 bg-accent/10 p-3.5 text-sm">
            {authError}
          </div>
        ) : null}

        <form noValidate onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-5">
          <div>
            <label
              htmlFor="admin-email"
              className="block font-mono text-xs tracking-[0.12em] text-olive uppercase"
            >
              Email
            </label>
            <input
              id="admin-email"
              type="email"
              autoComplete="email"
              {...register('email')}
              className="mt-2 w-full border border-border bg-paper px-3.5 py-2.5 text-sm text-graphite focus:border-graphite focus:outline-none"
            />
            {errors.email ? (
              <p className="mt-1 text-xs text-accent">{errors.email.message}</p>
            ) : null}
          </div>

          <div>
            <label
              htmlFor="admin-password"
              className="block font-mono text-xs tracking-[0.12em] text-olive uppercase"
            >
              Password
            </label>
            <input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              {...register('password')}
              className="mt-2 w-full border border-border bg-paper px-3.5 py-2.5 text-sm text-graphite focus:border-graphite focus:outline-none"
            />
            {errors.password ? (
              <p className="mt-1 text-xs text-accent">{errors.password.message}</p>
            ) : null}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full border border-graphite bg-graphite px-5 py-3 text-xs font-semibold tracking-[0.14em] text-surface uppercase transition-colors hover:border-accent hover:bg-accent disabled:opacity-60"
          >
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div className="mt-6 border-t border-border pt-4 text-xs text-graphite/65">
          <Link href="/" className="hover:text-accent">
            ← Return to public website
          </Link>
        </div>
      </div>
    </div>
  );
}

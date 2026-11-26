'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import {
  AccessDeniedState,
  EmptyState,
  ErrorState,
  LoadingSkeleton,
} from '@/components/ui/AsyncStates';
import { isApiError } from '@/lib/api-error';
import { queryKeys } from '@/lib/query-keys';
import { adminApi } from '@/services/admin-api';
import type { UserRole } from '@/types/api';

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('EDITOR');
  const [notice, setNotice] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: queryKeys.users.list({ page: 1, limit: 50 }),
    queryFn: () => adminApi.listUsers({ page: 1, limit: 50 }),
    staleTime: 60 * 1000,
  });

  const createMutation = useMutation({
    mutationFn: () => adminApi.createUser({ name, email, password, role }),
    onSuccess: async (created) => {
      setErrorMsg(null);
      setNotice(`Created user ${created.email}.`);
      setName('');
      setEmail('');
      setPassword('');
      setRole('EDITOR');
      await queryClient.invalidateQueries({
        queryKey: queryKeys.users.list({ page: 1, limit: 50 }),
      });
    },
    onError: (err) => {
      setNotice(null);
      setErrorMsg(err instanceof Error ? err.message : 'Unable to create user.');
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      adminApi.updateUser(id, { isActive }),
    onSuccess: async () => {
      setErrorMsg(null);
      setNotice('User account updated.');
      await queryClient.invalidateQueries({
        queryKey: queryKeys.users.list({ page: 1, limit: 50 }),
      });
    },
    onError: (err) => {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to update user.');
    },
  });

  if (isError && isApiError(error) && error.status === 403) {
    return <AccessDeniedState message="Only administrators can manage user accounts." />;
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setNotice(null);
    setErrorMsg(null);
    createMutation.mutate();
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-medium tracking-tight">Users & Roles</h1>
        <p className="mt-1 text-sm text-graphite/70">
          Provision administrator or editor accounts. Public registration is disabled.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        <form
          onSubmit={handleSubmit}
          className="space-y-4 border border-border bg-surface p-6 lg:col-span-4"
        >
          <h2 className="text-base font-semibold">Add User</h2>

          {notice ? (
            <div role="status" className="border border-olive/40 bg-olive/10 p-3 text-xs">
              {notice}
            </div>
          ) : null}
          {errorMsg ? (
            <div role="alert" className="border border-accent/50 bg-accent/10 p-3 text-xs">
              {errorMsg}
            </div>
          ) : null}

          <div>
            <label className="block font-mono text-xs text-olive uppercase">Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full border border-border bg-paper px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block font-mono text-xs text-olive uppercase">Email *</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full border border-border bg-paper px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block font-mono text-xs text-olive uppercase">
              Password (min 10 chars) *
            </label>
            <input
              type="password"
              required
              minLength={10}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full border border-border bg-paper px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block font-mono text-xs text-olive uppercase">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="mt-1 w-full border border-border bg-paper px-3 py-2 text-sm"
            >
              <option value="EDITOR">EDITOR (content & media)</option>
              <option value="ADMIN">ADMIN (full access)</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={createMutation.isPending}
            className="w-full border border-graphite bg-graphite px-4 py-2.5 text-xs font-semibold tracking-wider text-surface uppercase hover:border-accent hover:bg-accent disabled:opacity-60"
          >
            {createMutation.isPending ? 'Creating...' : 'Create User'}
          </button>
        </form>

        <div className="lg:col-span-8">
          {isLoading ? (
            <LoadingSkeleton rows={4} />
          ) : isError ? (
            <ErrorState
              title="Unable to load users"
              message={error instanceof Error ? error.message : 'Request failed.'}
              onRetry={() => void refetch()}
            />
          ) : !data?.items.length ? (
            <EmptyState title="No users found" />
          ) : (
            <div className="overflow-x-auto border border-border bg-surface">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border bg-paper/60 font-mono text-[11px] tracking-wider text-olive uppercase">
                  <tr>
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.items.map((u) => (
                    <tr key={u.id}>
                      <td className="px-4 py-3">
                        <p className="font-medium">{u.name}</p>
                        <p className="text-xs text-graphite/65">{u.email}</p>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">{u.role}</td>
                      <td className="px-4 py-3 font-mono text-xs">
                        {u.isActive ? 'Active' : 'Disabled'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          disabled={toggleActiveMutation.isPending}
                          onClick={() =>
                            toggleActiveMutation.mutate({ id: u.id, isActive: !u.isActive })
                          }
                          className="font-mono text-xs text-accent uppercase hover:underline disabled:opacity-50"
                        >
                          {u.isActive ? 'Disable' : 'Enable'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

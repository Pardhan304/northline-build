'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { ProjectEditorForm } from '@/components/admin/ProjectEditorForm';
import { ErrorState, LoadingSkeleton } from '@/components/ui/AsyncStates';
import { queryKeys } from '@/lib/query-keys';
import { adminApi } from '@/services/admin-api';

export default function EditProjectPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: queryKeys.projects.detail(id),
    queryFn: () => adminApi.getProject(id),
    staleTime: 2 * 60 * 1000,
  });

  if (isLoading) return <LoadingSkeleton rows={5} />;

  if (isError || !data) {
    return (
      <ErrorState
        title="Unable to load project"
        message={error instanceof Error ? error.message : 'Project not found.'}
        onRetry={() => void refetch()}
      />
    );
  }

  return <ProjectEditorForm project={data} />;
}

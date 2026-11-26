import type { ReactNode } from 'react';

export function LoadingSkeleton({
  rows = 3,
  className = '',
}: {
  rows?: number;
  className?: string;
}) {
  return (
    <div role="status" aria-label="Loading content" className={`space-y-4 ${className}`}>
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="h-16 w-full animate-pulse border border-border bg-surface/80" />
      ))}
      <span className="sr-only">Loading...</span>
    </div>
  );
}

export function ErrorState({
  title = 'Unable to load content',
  message = 'A problem occurred while communicating with the server.',
  onRetry,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div role="alert" className="border border-accent/40 bg-surface p-8 text-graphite">
      <p className="font-mono text-xs tracking-[0.14em] text-accent uppercase">Error</p>
      <h3 className="mt-2 text-xl font-medium tracking-tight">{title}</h3>
      <p className="mt-2 max-w-xl text-sm text-graphite/75">{message}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-5 inline-flex items-center border border-graphite bg-graphite px-5 py-2.5 text-xs font-semibold tracking-[0.12em] text-surface uppercase transition-colors hover:border-accent hover:bg-accent"
        >
          Retry
        </button>
      ) : null}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="border border-border bg-surface p-10 text-graphite">
      <p className="font-mono text-xs tracking-[0.14em] text-concrete uppercase">No records</p>
      <h3 className="mt-2 text-xl font-medium tracking-tight">{title}</h3>
      {description ? <p className="mt-2 max-w-xl text-sm text-graphite/75">{description}</p> : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}

export function AccessDeniedState({
  message = 'You do not have permission to access this area.',
}: {
  message?: string;
}) {
  return (
    <div role="alert" className="border border-border bg-surface p-10 text-graphite">
      <p className="font-mono text-xs tracking-[0.14em] text-accent uppercase">403 · Forbidden</p>
      <h2 className="mt-2 text-2xl font-medium tracking-tight">Access denied</h2>
      <p className="mt-2 max-w-xl text-sm text-graphite/75">{message}</p>
    </div>
  );
}

import { CircleAlert } from "lucide-react";

interface Props {
  title: string;
  error: Error;
  onRetry?: () => void;
  /** A slim banner above stale data, instead of a full replacement block. */
  compact?: boolean;
}

export function ErrorNotice({ title, error, onRetry, compact = false }: Props) {
  return (
    <div
      role="alert"
      className={`flex items-start gap-3 rounded-md border border-danger/30 bg-urgent-soft text-ink ${compact ? "mb-4 px-3 py-2" : "px-4 py-4"}`}
    >
      <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-danger" strokeWidth={2} />
      <div className="min-w-0 flex-1">
        <p className="font-medium">{title}</p>
        <p className="text-xs text-ink-muted">{error.message}</p>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="h-8 shrink-0 rounded-sm border border-line-strong bg-surface px-3 text-xs font-medium hover:bg-paper"
        >
          Try again
        </button>
      )}
    </div>
  );
}

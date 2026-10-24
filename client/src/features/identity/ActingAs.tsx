/** "Reporting as Ana R. · Change": shown where a name is about to be recorded. */
export function ActingAs({ verb, name, onChange }: { verb: string; name: string; onChange: () => void }) {
  return (
    <p className="text-xs text-ink-muted">
      {verb} as <span className="font-medium text-ink">{name}</span>
      <span aria-hidden="true"> · </span>
      <button
        type="button"
        onClick={onChange}
        aria-label="Change name"
        className="inline-flex min-h-8 items-center text-accent underline-offset-4 hover:underline"
      >
        Change
      </button>
    </p>
  );
}

// Shared control styles, so every input and button has the same height,
// radius and states. Phone sizes are larger (48px tap targets, 16px text so
// iOS doesn't zoom on focus); md: steps down for mouse users.

export const inputClass =
  "block w-full rounded-sm border border-line-strong bg-surface px-3 text-base text-ink md:text-sm " +
  "placeholder:text-ink-muted hover:border-ink-muted " +
  "aria-invalid:border-danger aria-invalid:ring-1 aria-invalid:ring-danger";

export const textInputClass = `${inputClass} h-12 md:h-10`;

export const labelClass = "mb-1.5 block text-sm font-medium md:text-xs";

export const hintClass = "mt-1 text-xs text-ink-muted";

export const errorTextClass = "mt-1 text-xs font-medium text-danger";

const buttonBase =
  "inline-flex h-12 items-center justify-center gap-2 rounded-sm px-4 text-sm font-medium transition-colors duration-150 md:h-10 " +
  "disabled:cursor-not-allowed disabled:opacity-50";

export const primaryButtonClass = `${buttonBase} bg-accent text-white hover:bg-accent-strong`;

export const secondaryButtonClass = `${buttonBase} border border-line-strong bg-surface text-ink hover:bg-paper`;

export const sectionHeadingClass = "text-2xs font-medium uppercase tracking-wider text-ink-muted";

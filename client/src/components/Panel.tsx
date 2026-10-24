import { X } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";

interface Props {
  labelledBy: string;
  onClose: () => void;
  children: ReactNode;
  /** Where focus goes on close if the opener no longer exists (e.g. its card moved columns). */
  fallbackFocus?: () => HTMLElement | null;
}

/**
 * Side panel on desktop, full screen on phones. Built on <dialog> + showModal(),
 * which gives a focus trap, Escape to close, a backdrop and an inert page
 * behind it natively, instead of re-implementing all of that.
 */
export function Panel({ labelledBy, onClose, children, fallbackFocus }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const fallbackRef = useRef(fallbackFocus);
  fallbackRef.current = fallbackFocus;

  useEffect(() => {
    const dialog = ref.current!;
    // Return focus to whatever opened the panel (the card or button), since
    // the dialog is unmounted by routing rather than closed.
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    if (!dialog.open) dialog.showModal();
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = "";
      if (dialog.open) dialog.close();
      // After unmount the board has re-rendered, so look up the fallback then.
      const target = opener?.isConnected ? opener : null;
      queueMicrotask(() => (target ?? fallbackRef.current?.())?.focus());
    };
  }, []);

  return (
    <dialog
      ref={ref}
      aria-labelledby={labelledBy}
      onCancel={(e) => {
        e.preventDefault(); // let the router own closing
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose(); // backdrop click
      }}
      className="m-0 ml-auto h-dvh max-h-none w-full max-w-none bg-paper p-0 text-ink backdrop:bg-ink/40 md:w-[520px] md:border-l md:border-line-strong
        transition-[translate,opacity] duration-200 ease-out starting:translate-x-6 starting:opacity-0"
    >
      <div className="h-full overflow-y-auto">
        <div className="sticky top-0 z-10 flex justify-end bg-paper/95 px-2 pt-2 md:px-3">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="inline-flex size-11 items-center justify-center rounded-sm text-ink-muted hover:bg-sunken hover:text-ink md:size-9"
          >
            <X aria-hidden="true" className="size-5" strokeWidth={1.75} />
          </button>
        </div>
        <div className="px-4 pb-10 md:px-6">{children}</div>
      </div>
    </dialog>
  );
}

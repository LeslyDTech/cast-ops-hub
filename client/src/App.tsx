import { Plus } from "lucide-react";
import { Link, Route, Routes, useLocation } from "react-router";
import { BoardPage } from "./features/board/BoardPage";
import { useActor } from "./features/identity/ActorProvider";
import { IssueDetailPanel } from "./features/issue-detail/IssueDetailPanel";
import { NewIssuePanel } from "./features/issue-form/NewIssuePanel";
import { primaryButtonClass } from "./lib/ui";

export function App() {
  const { search } = useLocation();
  return (
    <div className="min-h-dvh">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex h-14 max-w-[1280px] items-center gap-4 px-4 lg:px-6">
          <Link to={{ pathname: "/", search }} className="flex items-center gap-2 rounded-sm">
            <Mark />
            <span className="font-mono text-xs font-medium uppercase tracking-[0.14em]">Cast Ops Hub</span>
          </Link>
          <div className="ml-auto flex items-center gap-4">
            <Identity />
            <Link to={{ pathname: "/issues/new", search }} className={`${primaryButtonClass} h-10 px-3`}>
              <Plus aria-hidden="true" className="size-4" strokeWidth={2} />
              <span>
                Report<span className="hidden sm:inline"> issue</span>
              </span>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1280px] px-4 py-5 lg:px-6 lg:py-6">
        <Routes>
          <Route path="/" element={<BoardPage />}>
            <Route path="issues/new" element={<NewIssuePanel />} />
            <Route path="issues/:id" element={<IssueDetailPanel />} />
          </Route>
        </Routes>
      </main>
    </div>
  );
}

/** Shared devices are common on the floor, so switching person is one tap. */
function Identity() {
  const { name, setName } = useActor();
  if (!name.trim()) return null;
  return (
    <p className="hidden text-xs text-ink-muted sm:block">
      <span className="text-ink">{name}</span>
      <span aria-hidden="true"> · </span>
      <button type="button" onClick={() => setName("")} className="underline-offset-4 hover:text-ink hover:underline">
        Not you?
      </button>
    </p>
  );
}

/** Three ticket lines on a rail; the red one is the one that needs you. */
function Mark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" className="size-4">
      <rect x="1" y="2" width="14" height="2.5" className="fill-ink" />
      <rect x="1" y="7" width="9" height="2.5" className="fill-ink" />
      <rect x="1" y="12" width="12" height="2.5" className="fill-urgent" />
    </svg>
  );
}

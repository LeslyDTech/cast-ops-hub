import { Link, Route, Routes } from "react-router";
import { BoardPage } from "./features/board/BoardPage";

export function App() {
  return (
    <div className="min-h-dvh">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex h-12 max-w-[1280px] items-center px-4 lg:px-6">
          <Link to="/" className="flex items-center gap-2 rounded-sm">
            <Mark />
            <span className="font-mono text-xs font-medium uppercase tracking-[0.14em]">Cast Ops Hub</span>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-[1280px] px-4 py-5 lg:px-6 lg:py-6">
        <Routes>
          <Route path="/" element={<BoardPage />} />
        </Routes>
      </main>
    </div>
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

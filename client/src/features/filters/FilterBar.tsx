import { useCallback, useEffect, useRef, useState } from "react";
import { useLocations } from "../../api/queries";
import { PRIORITIES, PRIORITY_LABEL, STATUS_LABEL, STATUSES, type Priority } from "../../lib/domain";
import { EMPTY_FILTERS, isFiltered, toggle, type BoardFilters } from "./filters";

interface Props {
  filters: BoardFilters;
  onChange: (next: BoardFilters) => void;
}

const chip =
  "inline-flex h-10 shrink-0 items-center gap-1.5 rounded-sm border px-3 text-xs font-medium transition-colors duration-150 md:h-8 " +
  "border-line bg-surface text-ink hover:border-line-strong " +
  "aria-pressed:border-ink aria-pressed:bg-ink aria-pressed:text-paper";

const DOT: Partial<Record<Priority, string>> = { urgent: "bg-urgent", high: "bg-high" };

// Fades the right edge while more chips are hidden off-screen, as a scroll cue.
const FADE = "[mask-image:linear-gradient(to_right,#000_calc(100%-48px),transparent)] md:[mask-image:none]";

/** True while a horizontally scrollable element has more content to the right. */
function useMoreToTheRight() {
  const ref = useRef<HTMLDivElement>(null);
  const [more, setMore] = useState(false);
  const update = useCallback(() => {
    const el = ref.current;
    if (el) setMore(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  }, []);
  useEffect(() => {
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [update]);
  return { ref, more, update };
}

export function FilterBar({ filters, onChange }: Props) {
  const locations = useLocations();
  const scroller = useMoreToTheRight();
  const { update } = scroller;
  // The row's width changes when locations load or "Clear filters" appears.
  useEffect(update, [update, filters, locations.data]);

  return (
    // Scrolls sideways on phones instead of wrapping into a tall block above the board.
    <div
      ref={scroller.ref}
      onScroll={scroller.update}
      className={`-mx-4 overflow-x-auto px-4 md:mx-0 md:overflow-visible md:px-0 ${scroller.more ? FADE : ""}`}
    >
      <div className="flex w-max items-center gap-4 pb-1 md:w-auto md:flex-wrap">
        {/* On phones the column switcher does this job. */}
        <fieldset className="hidden items-center gap-1.5 md:flex">
          <legend className="sr-only">Status</legend>
          {STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={filters.status.includes(s)}
              onClick={() => onChange({ ...filters, status: toggle(filters.status, s) })}
              className={chip}
            >
              {STATUS_LABEL[s]}
            </button>
          ))}
        </fieldset>

        <span aria-hidden="true" className="hidden h-5 w-px bg-line-strong md:block" />

        <fieldset className="flex items-center gap-1.5">
          <legend className="sr-only">Priority</legend>
          {PRIORITIES.map((p) => (
            <button
              key={p}
              type="button"
              aria-pressed={filters.priority.includes(p)}
              onClick={() => onChange({ ...filters, priority: toggle(filters.priority, p) })}
              className={chip}
            >
              {DOT[p] && <span aria-hidden="true" className={`size-2 rounded-[1px] ${DOT[p]}`} />}
              {PRIORITY_LABEL[p]}
            </button>
          ))}
        </fieldset>

        <label className="flex shrink-0 items-center gap-2">
          <span className="sr-only">Location</span>
          <select
            value={filters.locationId ?? ""}
            onChange={(e) => onChange({ ...filters, locationId: e.target.value ? Number(e.target.value) : null })}
            disabled={!locations.data}
            className="h-10 rounded-sm border border-line bg-surface pl-2.5 pr-8 text-xs font-medium hover:border-line-strong disabled:text-ink-muted md:h-8"
          >
            <option value="">All locations</option>
            {locations.data?.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </label>

        {isFiltered(filters) && (
          <button
            type="button"
            onClick={() => onChange(EMPTY_FILTERS)}
            className="h-10 shrink-0 px-1 text-xs font-medium text-accent underline-offset-4 hover:underline md:h-8"
          >
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
}

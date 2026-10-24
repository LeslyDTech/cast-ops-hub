import { useId, useState } from "react";
import { ApiError } from "../../api/client";
import { useChangeStatus } from "../../api/queries";
import type { IssueDetail } from "../../api/types";
import { STATUS_LABEL, type Status } from "../../lib/domain";
import {
  errorTextClass,
  hintClass,
  inputClass,
  labelClass,
  primaryButtonClass,
  secondaryButtonClass,
  sectionHeadingClass,
  textInputClass,
} from "../../lib/ui";
import { ActingAs } from "../identity/ActingAs";
import { ACTOR_NAME_MAX, useActor } from "../identity/ActorProvider";
import { actionLabel, isForward } from "./wording";

const NOTE_MAX = 500;

function describeError(err: unknown): string {
  // 409: someone else moved it first. The detail refetches, so the buttons
  // re-render from the server's current allowedTransitions.
  if (err instanceof ApiError && err.status === 409) {
    const current = (err.details as { currentStatus?: Status } | undefined)?.currentStatus;
    return current
      ? `Someone already updated this issue. It's now ${STATUS_LABEL[current]}; the options below are current.`
      : "That change isn't allowed from the issue's current status.";
  }
  return err instanceof Error ? err.message : "Couldn't update the status.";
}

export function StatusActions({ issue }: { issue: IssueDetail }) {
  const actor = useActor();
  const change = useChangeStatus(issue.id);
  const id = useId();
  const [askName, setAskName] = useState(() => !actor.name.trim());
  const [name, setName] = useState(actor.name);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pendingTo, setPendingTo] = useState<Status | null>(null);

  async function move(to: Status) {
    setError(null);
    const who = name.trim();
    if (!who) return setError("Add your name so the history shows who made the change.");
    if (who.length > ACTOR_NAME_MAX) return setError(`Keep your name under ${ACTOR_NAME_MAX} characters.`);

    actor.setName(who);
    setPendingTo(to);
    try {
      await change.mutateAsync({ status: to, note: note.trim() || undefined, actor: who });
      setNote("");
      setAskName(false); // name is known now; collapse to "Updating as …"
    } catch (err) {
      setError(describeError(err));
    } finally {
      setPendingTo(null);
    }
  }

  // The server is the authority on the workflow: one button per allowed move.
  const moves = [...issue.allowedTransitions].sort((a, b) => Number(isForward(b)) - Number(isForward(a)));

  return (
    <section aria-labelledby={`${id}-heading`} className="rounded-md border border-line bg-surface p-4">
      <h3 id={`${id}-heading`} className={`${sectionHeadingClass} mb-3`}>
        Update status
      </h3>

      {askName && (
        <div className="mb-4">
          <label htmlFor={`${id}-name`} className={labelClass}>
            Your name
          </label>
          <input
            id={`${id}-name`}
            className={textInputClass}
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            placeholder="e.g. Ana R."
          />
          <p className={hintClass}>Shown in the history. Saved on this device.</p>
        </div>
      )}

      <label htmlFor={`${id}-note`} className={labelClass}>
        Note <span className="font-normal text-ink-muted">(optional)</span>
      </label>
      <textarea
        id={`${id}-note`}
        className={`${inputClass} min-h-20 py-2.5`}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        maxLength={NOTE_MAX}
        rows={2}
        placeholder="What you did, or what happens next"
      />

      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        {moves.map((to, i) => (
          <button
            key={to}
            type="button"
            onClick={() => move(to)}
            disabled={change.isPending}
            // One primary action: the most natural next step.
            className={i === 0 && isForward(to) ? primaryButtonClass : secondaryButtonClass}
          >
            {pendingTo === to ? "Saving…" : actionLabel(issue.status, to)}
          </button>
        ))}
      </div>

      {!askName && (
        <div className="mt-3">
          <ActingAs
            verb="Updating"
            name={name}
            onChange={() => {
              setName("");
              setAskName(true);
            }}
          />
        </div>
      )}

      {error && (
        <p role="alert" className={errorTextClass}>
          {error}
        </p>
      )}
    </section>
  );
}

import { useLocation, useNavigate } from "react-router";
import { Panel } from "../../components/Panel";
import { IssueForm } from "./IssueForm";

export function NewIssuePanel() {
  const navigate = useNavigate();
  const { search } = useLocation(); // keep board filters when closing
  const close = () => navigate({ pathname: "/", search });

  return (
    <Panel labelledBy="new-issue-heading" onClose={close}>
      <h2 id="new-issue-heading" className="mb-1 text-xl font-medium tracking-tight">
        Report an issue
      </h2>
      <p className="mb-6 text-sm text-ink-muted">It goes straight to the Open column for the shift lead.</p>
      <IssueForm
        // replace: Back from the new issue returns to the board, not a blank form.
        onCreated={(issue) => navigate({ pathname: `/issues/${issue.id}`, search }, { replace: true })}
      />
    </Panel>
  );
}

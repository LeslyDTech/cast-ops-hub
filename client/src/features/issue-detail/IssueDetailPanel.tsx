import { useLocation, useNavigate, useParams } from "react-router";
import { ApiError } from "../../api/client";
import { useIssue } from "../../api/queries";
import type { IssueDetail } from "../../api/types";
import { ErrorNotice } from "../../components/ErrorNotice";
import { Panel } from "../../components/Panel";
import { PriorityTag } from "../../components/PriorityTag";
import { StatusPill } from "../../components/StatusPill";
import { CATEGORY_LABEL } from "../../lib/domain";
import { formatDateTime } from "../../lib/time";
import { History } from "./History";
import { StatusActions } from "./StatusActions";

const HEADING_ID = "issue-detail-heading";

export function IssueDetailPanel() {
  const params = useParams();
  const navigate = useNavigate();
  const { search } = useLocation();
  const id = Number(params.id);
  const validId = Number.isInteger(id) && id > 0;
  const close = () => navigate({ pathname: "/", search });

  return (
    <Panel
      labelledBy={HEADING_ID}
      onClose={close}
      // Exact path match: a prefix match on "/issues/2" would also hit "/issues/28".
      fallbackFocus={() =>
        document.querySelector<HTMLElement>(`main a[href="/issues/${id}"], main a[href^="/issues/${id}?"]`)
      }
    >
      {validId ? <IssueDetailContent id={id} /> : <NotFound id={params.id ?? ""} />}
    </Panel>
  );
}

function IssueDetailContent({ id }: { id: number }) {
  const query = useIssue(id);

  if (query.isPending) return <DetailSkeleton />;
  if (query.isError) {
    if (query.error instanceof ApiError && query.error.status === 404) return <NotFound id={String(id)} />;
    return (
      <>
        <h2 id={HEADING_ID} className="sr-only">
          Issue #{id}
        </h2>
        <ErrorNotice title="Couldn't load this issue" error={query.error} onRetry={() => query.refetch()} />
      </>
    );
  }
  return <Detail issue={query.data} />;
}

function Detail({ issue }: { issue: IssueDetail }) {
  return (
    <article className="flex flex-col gap-6">
      <header>
        <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="font-mono text-xs font-medium text-ink-muted">#{issue.id}</span>
          <PriorityTag priority={issue.priority} quiet={issue.status === "resolved"} />
          <StatusPill status={issue.status} />
        </div>
        <h2 id={HEADING_ID} className="text-xl leading-tight font-medium tracking-tight text-balance">
          {issue.title}
        </h2>
        {issue.description && (
          <p className="mt-2 max-w-[65ch] whitespace-pre-line text-ink-muted">{issue.description}</p>
        )}
      </header>

      <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1.5 border-y border-line py-3 text-sm">
        <dt className="text-ink-muted">Location</dt>
        <dd>{issue.locationName}</dd>
        <dt className="text-ink-muted">Category</dt>
        <dd>{CATEGORY_LABEL[issue.category]}</dd>
        <dt className="text-ink-muted">Reported</dt>
        <dd>
          {issue.reportedBy}, <time dateTime={issue.createdAt}>{formatDateTime(issue.createdAt)}</time>
        </dd>
      </dl>

      <StatusActions issue={issue} />
      <History events={issue.events} />
    </article>
  );
}

function NotFound({ id }: { id: string }) {
  return (
    <div>
      <h2 id={HEADING_ID} className="text-xl font-medium tracking-tight">
        Issue #{id} doesn't exist
      </h2>
      <p className="mt-2 text-ink-muted">It may have been mistyped in the link. Close this panel to go back to the board.</p>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div aria-busy="true" className="flex flex-col gap-4">
      <h2 id={HEADING_ID} className="sr-only">
        Loading issue
      </h2>
      <div className="h-4 w-32 animate-pulse rounded-sm bg-sunken" />
      <div className="h-7 w-4/5 animate-pulse rounded-sm bg-sunken" />
      <div className="h-24 animate-pulse rounded-md bg-sunken" />
    </div>
  );
}

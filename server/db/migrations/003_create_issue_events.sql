-- Audit log: one row per status change, including creation (from_status NULL).
CREATE TABLE issue_events (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  issue_id    integer      NOT NULL REFERENCES issues (id) ON DELETE CASCADE,
  from_status issue_status,
  to_status   issue_status NOT NULL,
  note        text         CHECK (length(note) <= 500),
  changed_by  text         NOT NULL CHECK (length(btrim(changed_by)) BETWEEN 1 AND 80),
  created_at  timestamptz  NOT NULL DEFAULT now(),
  CONSTRAINT issue_events_status_changes CHECK (from_status IS DISTINCT FROM to_status)
);

-- Serves "history for issue X, oldest first" with a single index range scan.
CREATE INDEX issue_events_issue_id_created_at_idx ON issue_events (issue_id, created_at);

-- An audit log you can edit isn't an audit log. Rows may be added (and removed
-- with their issue), but never rewritten.
CREATE FUNCTION reject_issue_event_update() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'issue_events is append-only';
END;
$$;

CREATE TRIGGER issue_events_append_only
  BEFORE UPDATE ON issue_events
  FOR EACH ROW EXECUTE FUNCTION reject_issue_event_update();

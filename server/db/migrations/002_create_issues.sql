-- Status is used by issues.status and both issue_events columns, so it is a
-- domain: one definition of the allowed values, changeable with ALTER DOMAIN.
CREATE DOMAIN issue_status AS text
  CHECK (VALUE IN ('open', 'in_progress', 'resolved'));

CREATE FUNCTION set_updated_at() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TABLE issues (
  id          integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title       text         NOT NULL CHECK (length(btrim(title)) BETWEEN 3 AND 120),
  description text         NOT NULL DEFAULT '' CHECK (length(description) <= 2000),
  category    text         NOT NULL CHECK (category IN ('equipment', 'stock', 'guest', 'safety')),
  priority    text         NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status      issue_status NOT NULL DEFAULT 'open',
  location_id integer      NOT NULL REFERENCES locations (id) ON DELETE RESTRICT,
  -- Display name of the reporter, captured at the time of reporting. Phase 3 SSO
  -- will add reported_by_user_id alongside it; the name stays as a snapshot.
  reported_by text         NOT NULL CHECK (length(btrim(reported_by)) BETWEEN 1 AND 80),
  created_at  timestamptz  NOT NULL DEFAULT now(),
  updated_at  timestamptz  NOT NULL DEFAULT now()
);

CREATE TRIGGER issues_set_updated_at
  BEFORE UPDATE ON issues
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- One index per board filter. location_id also backs the foreign key, which
-- Postgres does not index automatically.
CREATE INDEX issues_status_idx      ON issues (status);
CREATE INDEX issues_priority_idx    ON issues (priority);
CREATE INDEX issues_location_id_idx ON issues (location_id);

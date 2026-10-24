-- Venues where issues are reported (restaurants, bars, kitchens).
CREATE TABLE locations (
  id         integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name       text        NOT NULL UNIQUE CHECK (length(btrim(name)) > 0),
  area       text        NOT NULL CHECK (length(btrim(area)) > 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

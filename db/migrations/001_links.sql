CREATE TABLE links (
  code varchar(12) PRIMARY KEY,
  destination_url text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

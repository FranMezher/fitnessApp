-- Body metrics: weight + body measurements over time (real progress tracking).
CREATE TABLE IF NOT EXISTS body_metrics (
  id           text PRIMARY KEY,
  user_id      text NOT NULL,
  date         text NOT NULL,            -- YYYY-MM-DD
  weight_kg    double precision,
  body_fat_pct double precision,
  chest_cm     double precision,
  waist_cm     double precision,
  hip_cm       double precision,
  arm_cm       double precision,
  thigh_cm     double precision,
  created_at   text DEFAULT now()
);

CREATE INDEX IF NOT EXISTS body_metrics_user_date_idx ON body_metrics (user_id, date);

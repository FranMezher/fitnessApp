-- Push notification tokens (Expo) for server-driven push.
-- One row per device token; re-registering updates the owning user.
CREATE TABLE IF NOT EXISTS push_tokens (
  token      text PRIMARY KEY,
  user_id    text NOT NULL,
  platform   text,
  updated_at text DEFAULT now()
);

CREATE INDEX IF NOT EXISTS push_tokens_user_id_idx ON push_tokens (user_id);

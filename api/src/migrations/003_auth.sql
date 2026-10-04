CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sessions_user ON sessions(user_id);

ALTER TABLE lists ADD COLUMN user_id TEXT REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE spaces ADD COLUMN user_id TEXT REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE labels ADD COLUMN user_id TEXT REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE templates ADD COLUMN user_id TEXT REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE item_frequency ADD COLUMN user_id TEXT REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE item_frequency DROP CONSTRAINT item_frequency_pkey;
ALTER TABLE item_frequency ADD PRIMARY KEY (label, user_id);

CREATE INDEX idx_lists_user ON lists(user_id);
CREATE INDEX idx_spaces_user ON spaces(user_id);
CREATE INDEX idx_labels_user ON labels(user_id);
CREATE INDEX idx_templates_user ON templates(user_id);
CREATE INDEX idx_item_frequency_user ON item_frequency(user_id);

-- Existing data must belong to someone: require ADMIN_EMAIL/ADMIN_ID env handled
-- by the app at boot; here we just allow NULL user_id (legacy rows) which the app
-- treats as unassigned. A backfill for a specific admin can be run manually:
-- UPDATE lists SET user_id = '<admin-user-id>';
ALTER TABLE lists DROP CONSTRAINT IF EXISTS lists_user_id_fkey;
ALTER TABLE lists ADD CONSTRAINT lists_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED;

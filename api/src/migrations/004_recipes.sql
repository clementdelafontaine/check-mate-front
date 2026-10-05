CREATE TABLE recipes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '🍳',
  description TEXT NOT NULL DEFAULT '',
  servings INTEGER,
  prep_minutes INTEGER,
  cook_minutes INTEGER,
  source TEXT,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  position BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE recipe_sections (
  id TEXT PRIMARY KEY,
  recipe_id TEXT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  position BIGINT NOT NULL DEFAULT 0
);

CREATE TABLE recipe_items (
  id TEXT PRIMARY KEY,
  section_id TEXT NOT NULL REFERENCES recipe_sections(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'product' CHECK (kind IN ('task', 'product')),
  quantity TEXT,
  position BIGINT NOT NULL DEFAULT 0
);

CREATE TABLE recipe_steps (
  id TEXT PRIMARY KEY,
  recipe_id TEXT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  position BIGINT NOT NULL DEFAULT 0
);

CREATE TABLE meal_plans (
  id TEXT PRIMARY KEY,
  date DATE NOT NULL,
  meal TEXT NOT NULL DEFAULT 'dinner' CHECK (meal IN ('lunch', 'dinner')),
  servings INTEGER,
  recipe_id TEXT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

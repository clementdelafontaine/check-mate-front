CREATE TABLE weekly_recipes (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipe_id TEXT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  position BIGINT NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, recipe_id)
);

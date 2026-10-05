ALTER TABLE users ADD COLUMN username TEXT;
UPDATE users SET username = split_part(email, '@', 1) WHERE username IS NULL;
CREATE UNIQUE INDEX idx_users_username ON users(username);

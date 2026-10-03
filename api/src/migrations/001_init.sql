CREATE TABLE spaces (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '📁',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE labels (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#4d8dff',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE lists (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '📋',
  type TEXT NOT NULL DEFAULT 'checklist'
    CHECK (type IN ('checklist', 'grocery', 'todo')),
  space_id TEXT REFERENCES spaces(id) ON DELETE SET NULL,
  start_date DATE,
  end_date DATE,
  position BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE list_labels (
  list_id TEXT NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
  label_id TEXT NOT NULL REFERENCES labels(id) ON DELETE CASCADE,
  PRIMARY KEY (list_id, label_id)
);

CREATE TABLE sections (
  id TEXT PRIMARY KEY,
  list_id TEXT NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  position BIGINT NOT NULL DEFAULT 0
);

CREATE TABLE templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '✨',
  description TEXT NOT NULL DEFAULT '',
  type TEXT NOT NULL DEFAULT 'checklist'
    CHECK (type IN ('checklist', 'grocery', 'todo')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE template_sections (
  id TEXT PRIMARY KEY,
  template_id TEXT NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  position BIGINT NOT NULL DEFAULT 0
);

CREATE TABLE items (
  id TEXT PRIMARY KEY,
  section_id TEXT NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'task' CHECK (kind IN ('task', 'product')),
  quantity TEXT,
  checked BOOLEAN NOT NULL DEFAULT false,
  position BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE template_items (
  id TEXT PRIMARY KEY,
  section_id TEXT NOT NULL REFERENCES template_sections(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'task' CHECK (kind IN ('task', 'product')),
  quantity TEXT,
  position BIGINT NOT NULL DEFAULT 0
);

CREATE TABLE item_frequency (
  label TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_sections_list ON sections(list_id);
CREATE INDEX idx_items_section ON items(section_id);
CREATE INDEX idx_template_sections_template ON template_sections(template_id);
CREATE INDEX idx_template_items_section ON template_items(section_id);
CREATE INDEX idx_lists_dates ON lists(start_date, end_date);

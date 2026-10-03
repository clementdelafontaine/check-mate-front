INSERT INTO spaces (id, name, emoji) VALUES
  ('sp-maison', 'Maison', '🏠'),
  ('sp-courses', 'Courses', '🛒'),
  ('sp-voyages', 'Voyages', '✈️'),
  ('sp-admin', 'Administratif', '🗂️')
ON CONFLICT (id) DO NOTHING;

INSERT INTO labels (id, name, color) VALUES
  ('lb-quotidien', 'Quotidien', '#4d8dff'),
  ('lb-menage', 'Ménage', '#f5a524'),
  ('lb-urgent', 'Urgent', '#e5484d'),
  ('lb-jardin', 'Jardin', '#3fb950'),
  ('lb-sortie', 'Sortie', '#a371f7')
ON CONFLICT (id) DO NOTHING;

-- Seed a demo user, recipes with sections/steps, and meal plans.
-- Demo login: demo@checkmate.local / demodemo123

INSERT INTO users (id, email, password_hash, role) VALUES (
  'u-demo',
  'demo@checkmate.local',
  '$argon2id$v=19$m=19456,t=2,p=1$xVHtEqXWv1cm79KCZfDs9w$yac6Rhe0leeg0BbTrYo909IJrV09AJPNjE5n4g8ojR8',
  'user'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO recipes (id, name, emoji, description, servings, prep_minutes, cook_minutes, source, user_id) VALUES
  ('r-pates-carbo', 'Pâtes carbonara', '🍝', 'La vraie, sans crème : œufs, pecorino et guanciale.', 2, 10, 15, NULL, 'u-demo'),
  ('r-courgettes-farcies', 'Courgettes farcies végétariennes', '🥘', 'Courgettes creusées garnies de riz, fromage et herbes, au four.', 4, 25, 40, 'Cuisine AZ', 'u-demo'),
  ('r-curry-pois-chiches', 'Curry de pois chiches express', '🍲', 'Curry cococo rapide, parfait pour un soir de semaine.', 3, 10, 20, NULL, 'u-demo'),
  ('r-crumble-pommes', 'Crumble aux pommes', '🍰', 'Dessert réconfortant : pommes, farine, beurre, sucre roux.', 6, 15, 35, 'Marmiton', 'u-demo');

INSERT INTO recipe_sections (id, recipe_id, name, position) VALUES
  ('rs-carbo-epicerie', 'r-pates-carbo', 'Épicerie', 0),
  ('rs-carbo-frais', 'r-pates-carbo', 'Produits frais', 1),
  ('rs-courgette-frais', 'r-courgettes-farcies', 'Produits frais', 0),
  ('rs-courgette-epicerie', 'r-courgettes-farcies', 'Épicerie', 1),
  ('rs-curry-epicerie', 'r-curry-pois-chiches', 'Épicerie', 0),
  ('rs-curry-frais', 'r-curry-pois-chiches', 'Produits frais', 1),
  ('rs-crumble-epicerie', 'r-crumble-pommes', 'Épicerie', 0),
  ('rs-crumble-frais', 'r-crumble-pommes', 'Produits frais', 1);

INSERT INTO recipe_items (id, section_id, label, kind, quantity, position) VALUES
  ('ri-carbo-1', 'rs-carbo-epicerie', 'Spaghetti', 'product', '200 g', 0),
  ('ri-carbo-2', 'rs-carbo-epicerie', 'Pecorino', 'product', '50 g', 1),
  ('ri-carbo-3', 'rs-carbo-frais', 'Œufs', 'product', '2', 0),
  ('ri-carbo-4', 'rs-carbo-frais', 'Guanciale', 'product', '100 g', 1),
  ('ri-courgette-1', 'rs-courgette-frais', 'Courgettes', 'product', '4', 0),
  ('ri-courgette-2', 'rs-courgette-frais', 'Tomates', 'product', '2', 1),
  ('ri-courgette-3', 'rs-courgette-epicerie', 'Riz', 'product', '150 g', 0),
  ('ri-courgette-4', 'rs-courgette-epicerie', 'Herbes de Provence', 'product', NULL, 1),
  ('ri-curry-1', 'rs-curry-epicerie', 'Pois chiches (boîte)', 'product', '2', 0),
  ('ri-curry-2', 'rs-curry-epicerie', 'Lait de coco', 'product', '400 ml', 1),
  ('ri-curry-3', 'rs-curry-epicerie', 'Pâte de curry', 'product', '2 c. à s.', 2),
  ('ri-curry-4', 'rs-curry-frais', 'Oignons', 'product', '1', 0),
  ('ri-curry-5', 'rs-curry-frais', 'Épinards', 'product', '200 g', 1),
  ('ri-crumble-1', 'rs-crumble-epicerie', 'Farine', 'product', '120 g', 0),
  ('ri-crumble-2', 'rs-crumble-epicerie', 'Sucre roux', 'product', '80 g', 1),
  ('ri-crumble-3', 'rs-crumble-frais', 'Pommes', 'product', '6', 0),
  ('ri-crumble-4', 'rs-crumble-frais', 'Beurre', 'product', '80 g', 1);

INSERT INTO recipe_steps (id, recipe_id, text, position) VALUES
  ('rst-carbo-1', 'r-pates-carbo', 'Cuire les spaghetti al dente dans une grande casserole d''eau salée.', 0),
  ('rst-carbo-2', 'r-pates-carbo', 'Faire revenir le guanciale en lardons à feu moyen jusqu''à ce qu''il soit doré.', 1),
  ('rst-carbo-3', 'r-pates-carbo', 'Battre les œufs avec le pecorino râpé, poivrer généreusement.', 2),
  ('rst-carbo-4', 'r-pates-carbo', 'Hors du feu, mélanger les pâtes égouttées avec le guanciale puis la crème d''œufs — le plat ne doit plus bouillir.', 3),
  ('rst-courgette-1', 'r-courgettes-farcies', 'Préchauffer le four à 180°C.', 0),
  ('rst-courgette-2', 'r-courgettes-farcies', 'Couper les courgettes en deux et les évider, réserver la chair.', 1),
  ('rst-courgette-3', 'r-courgettes-farcies', 'Mélanger la chair, le riz cuit, les tomates en dés et les herbes.', 2),
  ('rst-courgette-4', 'r-courgettes-farcies', 'Farcir les courgettes, parsemer de fromage et enfourner 40 minutes.', 3),
  ('rst-curry-1', 'r-curry-pois-chiches', 'Faire suer l''oignon émincé dans un filet d''huile.', 0),
  ('rst-curry-2', 'r-curry-pois-chiches', 'Ajouter la pâte de curry et faire revenir une minute en remuant.', 1),
  ('rst-curry-3', 'r-curry-pois-chiches', 'Verser le lait de coco et les pois chiches égouttés, laisser mijoter 15 minutes.', 2),
  ('rst-curry-4', 'r-curry-pois-chiches', 'Incorporer les épinards en fin de cuisson, servir avec du riz.', 3),
  ('rst-crumble-1', 'r-crumble-pommes', 'Préchauffer le four à 180°C.', 0),
  ('rst-crumble-2', 'r-crumble-pommes', 'Peler et couper les pommes en lamelles, les disposer dans un plat beurré.', 1),
  ('rst-crumble-3', 'r-crumble-pommes', 'Sabler du bout des doigts farine, beurre froid et sucre roux.', 2),
  ('rst-crumble-4', 'r-crumble-pommes', 'Répartir la pâte sur les pommes et enfourner 35 minutes.', 3);

INSERT INTO meal_plans (id, date, meal, servings, recipe_id, user_id) VALUES
  ('mp-1', CURRENT_DATE, 'dinner', 2, 'r-pates-carbo', 'u-demo'),
  ('mp-2', CURRENT_DATE + 2, 'lunch', 4, 'r-courgettes-farcies', 'u-demo'),
  ('mp-3', CURRENT_DATE + 3, 'dinner', 3, 'r-curry-pois-chiches', 'u-demo'),
  ('mp-4', CURRENT_DATE + 5, 'dinner', 6, 'r-crumble-pommes', 'u-demo');

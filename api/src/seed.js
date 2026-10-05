import { query, one, uid } from './db.js'

const SEED_RECIPES = [
  {
    id: 'r-seed-carbonara',
    name: 'Pâtes carbonara',
    emoji: '🍝',
    description: 'La vraie, sans crème : œufs, pecorino et guanciale.',
    servings: 2,
    prepMinutes: 10,
    cookMinutes: 15,
    source: null,
    tags: ['plats', 'express', 'pâtes'],
    sections: [
      {
        name: 'Épicerie',
        items: [
          { label: 'Spaghetti', quantity: '200 g' },
          { label: 'Pecorino', quantity: '50 g' }
        ]
      },
      {
        name: 'Produits frais',
        items: [
          { label: 'Œufs', quantity: '2' },
          { label: 'Guanciale', quantity: '100 g' }
        ]
      }
    ],
    steps: [
      'Cuire les spaghetti al dente dans une grande casserole d\u2019eau salée.',
      'Faire revenir le guanciale en lardons à feu moyen jusqu\u2019à ce qu\u2019il soit doré.',
      'Battre les œufs avec le pecorino râpé, poivrer généreusement.',
      'Hors du feu, mélanger pâtes, guanciale puis crème d\u2019œufs — le plat ne doit plus bouillir.'
    ]
  },
  {
    id: 'r-seed-courgettes',
    name: 'Courgettes farcies végétariennes',
    emoji: '🥘',
    description: 'Courgettes creusées garnies de riz, fromage et herbes, au four.',
    servings: 4,
    prepMinutes: 25,
    cookMinutes: 40,
    source: 'Cuisine AZ',
    tags: ['plats', 'végétarien', 'four', 'légumes'],
    sections: [
      {
        name: 'Produits frais',
        items: [
          { label: 'Courgettes', quantity: '4' },
          { label: 'Tomates', quantity: '2' }
        ]
      },
      {
        name: 'Épicerie',
        items: [
          { label: 'Riz', quantity: '150 g' },
          { label: 'Herbes de Provence', quantity: null }
        ]
      }
    ],
    steps: [
      'Préchauffer le four à 180°C.',
      'Couper les courgettes en deux et les évider, réserver la chair.',
      'Mélanger la chair, le riz cuit, les tomates en dés et les herbes.',
      'Farcir les courgettes, parsemer de fromage et enfourner 40 minutes.'
    ]
  },
  {
    id: 'r-seed-curry',
    name: 'Curry de pois chiches express',
    emoji: '🍲',
    description: 'Curry coco rapide, parfait pour un soir de semaine.',
    servings: 3,
    tags: ['plats', 'soupes', 'vegan', 'express', 'cocotte-minute'],
    prepMinutes: 10,
    cookMinutes: 20,
    source: null,
    sections: [
      {
        name: 'Épicerie',
        items: [
          { label: 'Pois chiches (boîte)', quantity: '2' },
          { label: 'Lait de coco', quantity: '400 ml' },
          { label: 'Pâte de curry', quantity: '2 c. à s.' }
        ]
      },
      {
        name: 'Produits frais',
        items: [
          { label: 'Oignons', quantity: '1' },
          { label: 'Épinards', quantity: '200 g' }
        ]
      }
    ],
    steps: [
      'Faire suer l\u2019oignon émincé dans un filet d\u2019huile.',
      'Ajouter la pâte de curry et faire revenir une minute en remuant.',
      'Verser le lait de coco et les pois chiches égouttés, laisser mijoter 15 minutes.',
      'Incorporer les épinards en fin de cuisson, servir avec du riz.'
    ]
  },
  {
    id: 'r-seed-crumble',
    name: 'Crumble aux pommes',
    emoji: '🍰',
    description: 'Dessert réconfortant : pommes, farine, beurre, sucre roux.',
    tags: ['desserts', 'four', 'fruits', 'gourmand'],
    servings: 6,
    prepMinutes: 15,
    cookMinutes: 35,
    source: 'Marmiton',
    sections: [
      {
        name: 'Épicerie',
        items: [
          { label: 'Farine', quantity: '120 g' },
          { label: 'Sucre roux', quantity: '80 g' }
        ]
      },
      {
        name: 'Produits frais',
        items: [
          { label: 'Pommes', quantity: '6' },
          { label: 'Beurre', quantity: '80 g' }
        ]
      }
    ],
    steps: [
      'Préchauffer le four à 180°C.',
      'Peler et couper les pommes en lamelles, les disposer dans un plat beurré.',
      'Sabler du bout des doigts farine, beurre froid et sucre roux.',
      'Répartir la pâte sur les pommes et enfourner 35 minutes.'
    ]
  }
]

const isoInDays = (n) => {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

const SEED_MEAL_PLANS = [
  { id: 'mp-seed-1', offset: 0, meal: 'dinner', recipeId: 'r-seed-carbonara' },
  { id: 'mp-seed-2', offset: 2, meal: 'lunch', recipeId: 'r-seed-courgettes' },
  { id: 'mp-seed-3', offset: 3, meal: 'dinner', recipeId: 'r-seed-curry' },
  { id: 'mp-seed-4', offset: 5, meal: 'dinner', recipeId: 'r-seed-crumble' }
]


const isoInDays2 = (n) => isoInDays(n)

const SEED_LISTS = [
  {
    id: 'l-seed-courses',
    name: 'Courses de la semaine',
    emoji: '🛒',
    type: 'grocery',
    startDateOffset: null,
    sections: [
      {
        name: 'Épicerie',
        items: [
          { label: 'Pâtes', quantity: null },
          { label: 'Riz', quantity: '1' },
          { label: 'Café', quantity: null }
        ]
      },
      {
        name: 'Produits frais',
        items: [
          { label: 'Lait', quantity: '2' },
          { label: 'Œufs', quantity: '6' },
          { label: 'Beurre', quantity: null }
        ]
      }
    ]
  },
  {
    id: 'l-seed-menage',
    name: 'Ménage du week-end',
    emoji: '🧹',
    type: 'checklist',
    startDateOffset: 5,
    sections: [
      {
        name: 'Cuisine',
        items: [
          { label: 'Plans de travail', quantity: null },
          { label: 'Plaque', quantity: null },
          { label: 'Sol', quantity: null }
        ]
      },
      {
        name: 'Salle de bain',
        items: [
          { label: 'Lavabo', quantity: null },
          { label: 'Toilettes', quantity: null }
        ]
      }
    ]
  }
]

async function seedListsForUser(userId) {
  const { rowCount } = await query('SELECT 1 FROM lists WHERE user_id = $1 LIMIT 1', [
    userId
  ])
  if (rowCount) return false

  for (const list of SEED_LISTS) {
    await query(
      `INSERT INTO lists (id, name, emoji, type, start_date, end_date, user_id)
       VALUES ($1, $2, $3, $4, $5, $5, $6)
       ON CONFLICT (id) DO NOTHING`,
      [
        list.id,
        list.name,
        list.emoji,
        list.type,
        list.startDateOffset === null ? null : isoInDays2(list.startDateOffset),
        userId
      ]
    )
    for (const [si, section] of list.sections.entries()) {
      const sectionRow = await one(
        'INSERT INTO sections (id, list_id, name, position) VALUES ($1, $2, $3, $4) RETURNING id',
        [uid('s'), list.id, section.name, si]
      )
      for (const [ii, item] of section.items.entries()) {
        await query(
          `INSERT INTO items (id, section_id, label, kind, quantity, position)
           VALUES ($1, $2, $3, 'product', $4, $5)`,
          [uid('i'), sectionRow.id, item.label, item.quantity, ii]
        )
      }
    }
  }
  return true
}



const SEED_TEMPLATES = [
  {
    id: 't-seed-courses-semaine',
    name: 'Courses de la semaine',
    emoji: '🛒',
    description: 'Base de courses par rayon pour la semaine.',
    type: 'grocery',
    sections: [
      {
        name: 'Épicerie',
        items: [
          { label: 'Pâtes', quantity: null },
          { label: 'Riz', quantity: null },
          { label: 'Café', quantity: null },
          { label: 'Huile d\u2019olive', quantity: null }
        ]
      },
      {
        name: 'Produits frais',
        items: [
          { label: 'Lait', quantity: '2' },
          { label: 'Œufs', quantity: '6' },
          { label: 'Beurre', quantity: null },
          { label: 'Yaourts', quantity: '4' }
        ]
      },
      {
        name: 'Fruits & légumes',
        items: [
          { label: 'Pommes', quantity: null },
          { label: 'Tomates', quantity: null },
          { label: 'Salade', quantity: null }
        ]
      }
    ]
  },
  {
    id: 't-seed-menage',
    name: 'Ménage du week-end',
    emoji: '🧹',
    description: 'Roulement de ménage pièce par pièce.',
    type: 'checklist',
    sections: [
      {
        name: 'Cuisine',
        items: [
          { label: 'Plans de travail', quantity: null },
          { label: 'Plaque', quantity: null },
          { label: 'Évier', quantity: null },
          { label: 'Sol', quantity: null }
        ]
      },
      {
        name: 'Salle de bain',
        items: [
          { label: 'Lavabo', quantity: null },
          { label: 'Toilettes', quantity: null },
          { label: 'Miroir', quantity: null }
        ]
      },
      {
        name: 'Le reste',
        items: [
          { label: 'Aspirateur', quantity: null },
          { label: 'Sols', quantity: null },
          { label: 'Poussière meubles', quantity: null }
        ]
      }
    ]
  },
  {
    id: 't-seed-voyage',
    name: 'Voyage',
    emoji: '🧳',
    description: 'Base réutilisable pour partir organisé.',
    type: 'checklist',
    sections: [
      {
        name: 'Vêtements',
        items: [
          { label: 'T-shirts (1/jour)', quantity: null },
          { label: 'Sous-vêtements', quantity: null },
          { label: 'Pantalon confort', quantity: null },
          { label: 'Tenue de pluie', quantity: null }
        ]
      },
      {
        name: 'Hygiène',
        items: [
          { label: 'Trousse de toilette', quantity: null },
          { label: 'Médicaments', quantity: null },
          { label: 'Protection solaire', quantity: null }
        ]
      },
      {
        name: 'Documents',
        items: [
          { label: 'Papiers d\u2019identité', quantity: null },
          { label: 'Billets / réservations', quantity: null },
          { label: 'Assurance voyage', quantity: null }
        ]
      }
    ]
  },
  {
    id: 't-seed-soiree',
    name: 'Soirée à la maison',
    emoji: '🎉',
    description: 'Préparer une soirée : apéro, buffet, maison.',
    type: 'checklist',
    sections: [
      {
        name: 'À manger',
        items: [
          { label: 'Chips / apéro', quantity: null },
          { label: 'Boissons', quantity: null },
          { label: 'Dessert', quantity: null }
        ]
      },
      {
        name: 'Maison',
        items: [
          { label: 'Ranger le salon', quantity: null },
          { label: 'Vider la poubelle', quantity: null },
          { label: 'Playlist', quantity: null }
        ]
      },
      {
        name: 'La veille',
        items: [
          { label: 'Confirmer les invités', quantity: null },
          { label: 'Faire les courses', quantity: null }
        ]
      }
    ]
  },
  {
    id: 't-seed-pique-nique',
    name: 'Pique-nique',
    emoji: '🧺',
    description: 'Liste type pour un pique-nique réussi.',
    type: 'checklist',
    sections: [
      {
        name: 'À manger',
        items: [
          { label: 'Sandwichs', quantity: null },
          { label: 'Fruits', quantity: null },
          { label: 'Gâteaux', quantity: null },
          { label: 'Eau', quantity: null }
        ]
      },
      {
        name: 'Matériel',
        items: [
          { label: 'Couverture', quantity: null },
          { label: 'Gobelets', quantity: null },
          { label: 'Sac poubelle', quantity: null }
        ]
      }
    ]
  }
]

async function seedTemplatesForUser(userId) {
  const { rowCount } = await query('SELECT 1 FROM templates WHERE user_id = $1 LIMIT 1', [
    userId
  ])
  if (rowCount) return false

  for (const tpl of SEED_TEMPLATES) {
    await query(
      `INSERT INTO templates (id, name, emoji, description, type, user_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (id) DO NOTHING`,
      [tpl.id, tpl.name, tpl.emoji, tpl.description, tpl.type, userId]
    )
    for (const [si, section] of tpl.sections.entries()) {
      const sectionRow = await one(
        'INSERT INTO template_sections (id, template_id, name, position) VALUES ($1, $2, $3, $4) RETURNING id',
        [uid('ts'), tpl.id, section.name, si]
      )
      for (const [ii, item] of section.items.entries()) {
        await query(
          `INSERT INTO template_items (id, section_id, label, kind, quantity, position)
           VALUES ($1, $2, $3, 'product', $4, $5)`,
          [uid('ti'), sectionRow.id, item.label, item.quantity, ii]
        )
      }
    }
  }
  return true
}




const SEED_SPACES = [
  { id: 'sp-seed-divers', name: 'Divers', emoji: '📁' },
  { id: 'sp-seed-courses', name: 'Courses', emoji: '🛒' },
  { id: 'sp-seed-maison', name: 'Maison', emoji: '🏠' },
  { id: 'sp-seed-sorties', name: 'Sorties', emoji: '✈️' }
]

async function seedSpacesForUser(userId) {
  const { rowCount } = await query('SELECT 1 FROM spaces WHERE user_id = $1 LIMIT 1', [
    userId
  ])
  if (rowCount) return false
  for (const [idx, sp] of SEED_SPACES.entries()) {
    await query(
      `INSERT INTO spaces (id, name, emoji, user_id)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (id) DO NOTHING`,
      [sp.id, sp.name, sp.emoji, userId]
    )
  }
  return true
}


export async function seedRecipesForUser(userId) {
  const { rowCount } = await query('SELECT 1 FROM recipes WHERE user_id = $1 LIMIT 1', [
    userId
  ])
  if (rowCount) return false

  for (const recipe of SEED_RECIPES) {
    await query(
      `INSERT INTO recipes (id, name, emoji, description, servings, prep_minutes, cook_minutes, source, tags, user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (id) DO NOTHING`,
      [
        recipe.id,
        recipe.name,
        recipe.emoji,
        recipe.description,
        recipe.servings,
        recipe.prepMinutes,
        recipe.cookMinutes,
        recipe.source,
        recipe.tags ?? [],
        userId
      ]
    )
    for (const [si, section] of recipe.sections.entries()) {
      const sectionRow = await one(
        'INSERT INTO recipe_sections (id, recipe_id, name, position) VALUES ($1, $2, $3, $4) RETURNING id',
        [uid('rs'), recipe.id, section.name, si]
      )
      for (const [ii, item] of section.items.entries()) {
        await query(
          `INSERT INTO recipe_items (id, section_id, label, kind, quantity, position)
           VALUES ($1, $2, $3, 'product', $4, $5)`,
          [uid('rit'), sectionRow.id, item.label, item.quantity, ii]
        )
      }
    }
    for (const [idx, text] of recipe.steps.entries()) {
      await query(
        'INSERT INTO recipe_steps (id, recipe_id, text, position) VALUES ($1, $2, $3, $4)',
        [uid('rst'), recipe.id, text, idx]
      )
    }
  }

  for (const plan of SEED_MEAL_PLANS) {
    await query(
      `INSERT INTO meal_plans (id, date, meal, recipe_id, user_id)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT DO NOTHING`,
      [plan.id, isoInDays(plan.offset), plan.meal, plan.recipeId, userId]
    )
  }
  return true
}

export async function seedDemoDataForUser(userId) {
  const seededSpaces = await seedSpacesForUser(userId)
  const seededRecipes = await seedRecipesForUser(userId)
  const seededLists = await seedListsForUser(userId)
  const seededTemplates = await seedTemplatesForUser(userId)
  return seededSpaces || seededRecipes || seededLists || seededTemplates
}

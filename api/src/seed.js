import { query, one, uid } from './db.js'
import { hashPassword } from './password.js'

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
    emoji: '\ud83d\uded2',
    type: 'grocery',
    spaceId: 'sp-seed-courses',
    startDateOffset: null,
    sections: [
      {
        name: 'Fruits & Légumes',
        items: [
          { label: 'Tomates', quantity: '500 g' },
          { label: 'Courgettes', quantity: '3' },
          { label: 'Pommes', quantity: '1 kg' },
          { label: 'Bananes', quantity: '1' },
          { label: 'Salade', quantity: '1' },
          { label: 'Carottes', quantity: '1 kg' },
          { label: 'Oignons', quantity: '1 kg' },
          { label: 'Citrons', quantity: '3' }
        ]
      },
      {
        name: 'Boucherie',
        items: [
          { label: 'Jambon blanc', quantity: '4 tranches' },
          { label: 'Poulet', quantity: '1' },
          { label: 'Steak haché', quantity: '500 g' }
        ]
      },
      {
        name: 'Poissonnerie',
        items: [
          { label: 'Saumon', quantity: '2 tranches' },
          { label: 'Crevettes', quantity: '300 g' }
        ]
      },
      {
        name: 'Crèmerie',
        items: [
          { label: 'Lait', quantity: '2 L' },
          { label: 'Œufs', quantity: '6' },
          { label: 'Beurre', quantity: '250 g' },
          { label: 'Yaourts', quantity: '4' },
          { label: 'Fromage râpé', quantity: '200 g' }
        ]
      },
      {
        name: 'Boulangerie',
        items: [
          { label: 'Pain', quantity: '1' },
          { label: 'Croissants', quantity: '2' }
        ]
      },
      {
        name: 'Épicerie salée',
        items: [
          { label: 'Pâtes', quantity: '500 g' },
          { label: 'Riz', quantity: '1 kg' },
          { label: 'Huile d\'olive', quantity: '75 cL' },
          { label: 'Pois chiches', quantity: '2 boîtes' },
          { label: 'Olives', quantity: '200 g' }
        ]
      },
      {
        name: 'Épicerie sucrée',
        items: [
          { label: 'Farine', quantity: '1 kg' },
          { label: 'Sucre', quantity: '500 g' },
          { label: 'Chocolat noir', quantity: '100 g' },
          { label: 'Confiture', quantity: '1 pot' }
        ]
      },
      {
        name: 'Boissons',
        items: [
          { label: 'Café', quantity: '250 g' },
          { label: 'Jus d\'orange', quantity: '1 L' },
          { label: 'Eau gazeuse', quantity: '6' }
        ]
      },
      {
        name: 'Surgelés',
        items: [
          { label: 'Épinards', quantity: '450 g' },
          { label: 'Frites', quantity: '750 g' }
        ]
      },
      {
        name: 'Hygiène & Entretien',
        items: [
          { label: 'Papier toilette', quantity: '6 rouleaux' },
          { label: 'Liquide vaisselle', quantity: '1' }
        ]
      }
    ]
  },
  {
    id: 'l-seed-menage',
    name: 'Ménage du week-end',
    emoji: '🧹',
    type: 'checklist',
    spaceId: 'sp-seed-maison',
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
  },
  {
    id: 'l-seed-travaux',
    name: 'Travaux salle de bain',
    emoji: '🫥',
    type: 'todo',
    spaceId: 'sp-seed-maison',
    startDateOffset: 10,
    endDateOffset: 24,
    sections: [
      {
        name: 'Préparation',
        items: [
          { label: 'Demander des devis', quantity: null },
          { label: 'Choisir les carrelages', quantity: null }
        ]
      },
      {
        name: 'Chantier',
        items: [
          { label: 'Commander la robinetterie', quantity: null },
          { label: 'Vider la salle de bain', quantity: null }
        ]
      }
    ]
  },
  {
    id: 'l-seed-valise',
    name: 'Valise week-end Rome',
    emoji: '\u2708\uFE0F',
    type: 'checklist',
    spaceId: 'sp-seed-sorties',
    startDateOffset: 14,
    sections: [
      {
        name: 'Papiers',
        items: [
          { label: 'Carte d’identité', quantity: null },
          { label: 'Billets de train', quantity: null },
          { label: 'Réservation hôtel', quantity: null }
        ]
      },
      {
        name: 'Affaires',
        items: [
          { label: 'Chargeur + adaptateur', quantity: null },
          { label: 'Trousse de toilette', quantity: null },
          { label: 'Chaussures marche', quantity: null }
        ]
      }
    ]
  },
  {
    id: 'l-seed-sorties',
    name: 'Sorties du mois',
    emoji: '🎫',
    type: 'todo',
    spaceId: 'sp-seed-sorties',
    startDateOffset: null,
    sections: [
      {
        name: 'Idées',
        items: [
          { label: 'Expo au musée', quantity: null },
          { label: 'Cinéma en famille', quantity: null },
          { label: 'Rando du dimanche', quantity: null }
        ]
      }
    ]
  },
  {
    id: 'l-seed-anniversaire',
    name: 'Anniversaire de Léa',
    emoji: '🎁',
    type: 'todo',
    spaceId: 'sp-seed-divers',
    startDateOffset: 21,
    sections: [
      {
        name: 'Préparer',
        items: [
          { label: 'Choisir le cadeau', quantity: null },
          { label: 'Commander le gâteau', quantity: null },
          { label: 'Envoyer les invitations', quantity: null }
        ]
      }
    ]
  }
]

async function seedListsForUser(userId, spaceIdMap) {
  const { rowCount } = await query('SELECT 1 FROM lists WHERE user_id = $1 LIMIT 1', [
    userId
  ])
  if (rowCount) return false

  for (const list of SEED_LISTS) {
    const listRow = await one(
      `INSERT INTO lists (id, name, emoji, type, space_id, start_date, end_date, user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      [
        uid('l'),
        list.name,
        list.emoji,
        list.type,
        (list.spaceId ? spaceIdMap.get(list.spaceId) : null) ?? null,
        list.startDateOffset === null ? null : isoInDays2(list.startDateOffset),
        list.endDateOffset === null || list.endDateOffset === undefined
          ? (list.startDateOffset === null ? null : isoInDays2(list.startDateOffset))
          : isoInDays2(list.endDateOffset),
        userId
      ]
    )
    for (const [si, section] of list.sections.entries()) {
      const sectionRow = await one(
        'INSERT INTO sections (id, list_id, name, position) VALUES ($1, $2, $3, $4) RETURNING id',
        [uid('s'), listRow.id, section.name, si]
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
    const tplRow = await one(
      `INSERT INTO templates (id, name, emoji, description, type, user_id)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [uid('t'), tpl.name, tpl.emoji, tpl.description, tpl.type, userId]
    )
    for (const [si, section] of tpl.sections.entries()) {
      const sectionRow = await one(
        'INSERT INTO template_sections (id, template_id, name, position) VALUES ($1, $2, $3, $4) RETURNING id',
        [uid('ts'), tplRow.id, section.name, si]
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
  const spaceIdMap = new Map()
  for (const sp of SEED_SPACES) {
    const spaceId = uid('sp')
    spaceIdMap.set(sp.id, spaceId)
    await query(
      `INSERT INTO spaces (id, name, emoji, user_id)
       VALUES ($1, $2, $3, $4)`,
      [spaceId, sp.name, sp.emoji, userId]
    )
  }
  return spaceIdMap
}


export async function seedRecipesForUser(userId) {
  const { rowCount } = await query('SELECT 1 FROM recipes WHERE user_id = $1 LIMIT 1', [
    userId
  ])
  if (rowCount) return false

  const recipeIdMap = new Map()
  for (const recipe of SEED_RECIPES) {
    const recipeId = uid('r')
    recipeIdMap.set(recipe.id, recipeId)
    await query(
      `INSERT INTO recipes (id, name, emoji, description, servings, prep_minutes, cook_minutes, source, tags, user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        recipeId,
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
        [uid('rs'), recipeIdMap.get(recipe.id), section.name, si]
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
        [uid('rst'), recipeIdMap.get(recipe.id), text, idx]
      )
    }
  }

  for (const plan of SEED_MEAL_PLANS) {
    await query(
      `INSERT INTO meal_plans (id, date, meal, recipe_id, user_id)
       VALUES ($1, $2, $3, $4, $5)`,
      [uid('mp'), isoInDays(plan.offset), plan.meal, recipeIdMap.get(plan.recipeId), userId]
    )
  }
  return true
}

export const SEED_USERS = [
  { username: 'clement', password: 'clement1234' },
  { username: 'laureline', password: 'laureline' }
]

export async function seedUsersWithFriendships() {
  const created = new Map()
  for (const { username, password } of SEED_USERS) {
    let user = await one('SELECT * FROM users WHERE username = $1', [username])
    if (!user) {
      user = await one(
        `INSERT INTO users (id, email, username, password_hash, role)
         VALUES ($1, $2, $3, $4, 'user') RETURNING *`,
        [uid('u'), `${username}@local`, username, await hashPassword(password)]
      ).catch(() => null)
      if (user) {
        try {
          await seedDemoDataForUser(user.id)
        } catch {
          /* individual demo seeding failure is not fatal */
        }
      }
    }
    if (user) created.set(username, user)
  }
  const clement = created.get('clement')
  const laureline = created.get('laureline')
  const admin = await one("SELECT * FROM users WHERE role = 'admin' LIMIT 1")
  const pairs = []
  if (clement && laureline) pairs.push([clement.id, laureline.id])
  if (clement && admin) pairs.push([clement.id, admin.id])
  for (const [a, b] of pairs) {
    await query(
      `INSERT INTO friendships (id, requester_id, addressee_id, status)
       VALUES ($1, $2, $3, 'accepted')
       ON CONFLICT (requester_id, addressee_id) DO NOTHING`,
      [uid('f'), a, b]
    )
  }
  return created.size
}

export async function seedDemoDataForUser(userId) {
  const spaceIdMap = await seedSpacesForUser(userId)
  const seededRecipes = await seedRecipesForUser(userId)
  const seededLists = await seedListsForUser(userId, spaceIdMap ?? new Map())
  const seededTemplates = await seedTemplatesForUser(userId)
  return Boolean(spaceIdMap) || seededRecipes || seededLists || seededTemplates
}

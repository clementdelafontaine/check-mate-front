let seq = 0
export const uid = () => `m-${Date.now().toString(36)}-${(seq++).toString(36)}`

const today = new Date()
const iso = (d) => {
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}
const inDays = (n) => {
  const d = new Date(today)
  d.setDate(d.getDate() + n)
  return iso(d)
}

export const groceryList = {
  id: 'l-courses', type: 'grocery',
  name: 'Courses du samedi',
  emoji: '🛒',
  kind: 'simple',
  isTemplate: false,
  spaceId: 'sp-courses',
  labelIds: ['lb-quotidien'],
  startDate: inDays(0),
  endDate: inDays(0),
  sections: [
    {
      id: 's-epicerie',
      name: 'Épicerie',
      items: [
        { id: 'i-1', label: 'Pâtes', quantity: '2', checked: true, kind: 'product' },
        { id: 'i-2', label: 'Riz', quantity: null, checked: false, kind: 'product' },
        { id: 'i-3', label: 'Café', quantity: '1', checked: true, kind: 'product' },
        { id: 'i-4', label: 'Huile d\u2019olive', quantity: null, checked: false, kind: 'product' }
      ]
    },
    {
      id: 's-frais',
      name: 'Produits frais',
      items: [
        { id: 'i-5', label: 'Lait', quantity: '2', checked: true, kind: 'product' },
        { id: 'i-6', label: 'Œufs', quantity: '6', checked: false, kind: 'product' },
        { id: 'i-7', label: 'Beurre', quantity: null, checked: false, kind: 'product' },
        { id: 'i-8', label: 'Yaourts', quantity: '4', checked: false, kind: 'product' }
      ]
    },
    {
      id: 's-simili',
      name: 'Simili',
      items: [
        { id: 'i-9', label: 'Steaks de soja', quantity: null, checked: false, kind: 'product' },
        { id: 'i-10', label: 'Crème végétale', quantity: '2', checked: false, kind: 'product' }
      ]
    }
  ]
}

export const tripList = {
  id: 'l-voyage', type: 'checklist',
  name: 'Week-end chez grand-mère',
  emoji: '🧳',
  kind: 'simple',
  isTemplate: false,
  spaceId: 'sp-voyages',
  labelIds: ['lb-sortie'],
  startDate: inDays(1),
  endDate: inDays(3),
  sections: [
    {
      id: 's-vetements',
      name: 'Vêtements',
      items: [
        { id: 'i-11', label: 'T-shirts', quantity: '3', checked: false, kind: 'product' },
        { id: 'i-12', label: 'Pantalon', quantity: null, checked: false, kind: 'product' },
        { id: 'i-13', label: 'Pull', quantity: null, checked: false, kind: 'product' },
        { id: 'i-14', label: 'Chaussettes', quantity: '4', checked: false, kind: 'product' }
      ]
    },
    {
      id: 's-hygiene',
      name: 'Hygiène',
      items: [
        { id: 'i-15', label: 'Brosse à dents', quantity: null, checked: false, kind: 'product' },
        { id: 'i-16', label: 'Chargeur', quantity: null, checked: false, kind: 'product' },
        { id: 'i-17', label: 'Adaptateur prise', quantity: null, checked: false, kind: 'product' },
        { id: 'i-17b', label: 'Pense-bête : couper l\u2019eau avant de partir', quantity: null, checked: false }
      ]
    },
    {
      id: 's-cadeaux',
      name: 'Cadeaux',
      items: [
        { id: 'i-18', label: 'Fleurs', quantity: '1', checked: false, kind: 'product' },
        { id: 'i-19', label: 'Macarons', quantity: '2', checked: false, kind: 'product' }
      ]
    }
  ]
}

export const taxesList = {
  id: 'l-impots', type: 'todo',
  name: 'Déclarer les impôts',
  emoji: '🧾',
  kind: 'simple',
  isTemplate: false,
  spaceId: 'sp-perso',
  labelIds: ['lb-urgent'],
  startDate: inDays(-3),
  endDate: inDays(-1),
  sections: [
    {
      id: 's-impots-docs',
      name: 'Démarches',
      items: [
        { id: 'i-20', label: 'Récupérer le revenu fiscal de référence', quantity: null, checked: true },
        { id: 'i-21', label: 'Remplir la déclaration en ligne', quantity: null, checked: false },
        { id: 'i-21b', label: 'Disponible jusqu\u2019au 31 mai sur impots.gouv.fr', quantity: null, checked: false }
      ]
    }
  ]
}

export const cleaningList = {
  id: 'l-menage', type: 'checklist',
  name: 'Ménage appartement',
  emoji: '🧹',
  kind: 'simple',
  isTemplate: false,
  spaceId: 'sp-maison',
  labelIds: ['lb-menage'],
  startDate: null,
  endDate: null,
  sections: [
    {
      id: 's-menage-cuisine',
      name: 'Cuisine',
      items: [
        { id: 'i-22', label: 'Plans de travail', quantity: null, checked: true },
        { id: 'i-23', label: 'Plaque de cuisson', quantity: null, checked: false },
        { id: 'i-24', label: 'Frigo — trier les restes', quantity: null, checked: false }
      ]
    },
    {
      id: 's-menage-sdb',
      name: 'Salle de bain',
      items: [
        { id: 'i-25', label: 'Lavabo + miroir', quantity: null, checked: false },
        { id: 'i-26', label: 'Serviettes', quantity: null, checked: true }
      ]
    },
    {
      id: 's-menage-salon',
      name: 'Salon',
      items: [
        { id: 'i-27', label: 'Aspirateur', quantity: null, checked: false },
        { id: 'i-28', label: 'Poussière étagères', quantity: null, checked: false }
      ]
    }
  ]
}

export const gardenList = {
  id: 'l-jardin', type: 'checklist',
  name: 'Jardin — entretien',
  emoji: '🌿',
  kind: 'simple',
  isTemplate: false,
  spaceId: 'sp-maison',
  labelIds: ['lb-jardin'],
  startDate: null,
  endDate: null,
  sections: [
    {
      id: 's-jardin-tonte',
      name: 'Tonte',
      items: [
        { id: 'i-29', label: 'Tondre la pelouse', quantity: null, checked: false },
        { id: 'i-30', label: 'Arroser les massifs', quantity: null, checked: false }
      ]
    },
    {
      id: 's-jardin-taille',
      name: 'Taille',
      items: [
        { id: 'i-31', label: 'Haie de cèdres', quantity: null, checked: true },
        { id: 'i-32', label: 'Rosiers', quantity: null, checked: false }
      ]
    }
  ]
}

export const birthdayList = {
  id: 'l-anniv', type: 'checklist',
  name: 'Anniversaire de Léa',
  emoji: '🎁',
  kind: 'simple',
  isTemplate: false,
  spaceId: 'sp-perso',
  labelIds: ['lb-sortie'],
  startDate: inDays(-5),
  endDate: inDays(-2),
  sections: [
    {
      id: 's-anniv',
      name: 'Organisation',
      items: [
        { id: 'i-33', label: 'Commander le gâteau', quantity: null, checked: true },
        { id: 'i-34', label: 'Acheter les guirlandes', quantity: null, checked: true },
        { id: 'i-35', label: 'Réserver la salle', quantity: null, checked: true }
      ]
    }
  ]
}

export const giftIdeasList = {
  id: 'l-idees', type: 'checklist',
  name: 'Idées cadeaux',
  emoji: '💡',
  kind: 'simple',
  isTemplate: false,
  spaceId: null,
  labelIds: [],
  startDate: null,
  endDate: null,
  sections: [
    {
      id: 's-idees',
      name: 'Idées',
      items: [
        { id: 'i-36', label: 'Livre de recettes', quantity: null, checked: false },
        { id: 'i-37', label: 'Box vin', quantity: null, checked: false }
      ]
    }
  ]
}

export const templates = [
  {
    id: 't-voyage',
    name: 'Voyage',
    emoji: '🧳',
    kind: 'template',
    isTemplate: true,
    description: 'Base réutilisable pour partir organisé.',
    sections: [
      {
        id: 'ts-vetements',
        name: 'Vêtements',
        items: [
          { label: 'T-shirts (1/jour)' },
          { label: 'Sous-vêtements' },
          { label: 'Pantalon confort' },
          { label: 'Tenue de pluie' },
          { label: 'Chaussures de marche' }
        ]
      },
      {
        id: 'ts-hygiene',
        name: 'Hygiène',
        items: [
          { label: 'Trousse de toilette' },
          { label: 'Médicaments' },
          { label: 'Protection solaire' }
        ]
      },
      {
        id: 'ts-documents',
        name: 'Documents',
        items: [
          { label: 'Papiers d\u2019identité' },
          { label: 'Billets / réservations' },
          { label: 'Assurance voyage' }
        ]
      }
    ]
  },
  {
    id: 't-courses',
    name: 'Courses',
    emoji: '🛒',
    kind: 'template',
    isTemplate: true,
    description: 'Liste de courses par rayon de supermarché.',
    sections: [
      {
        id: 'ts-epicerie',
        name: 'Épicerie',
        items: [{ label: 'Pâtes' }, { label: 'Riz' }, { label: 'Café' }]
      },
      {
        id: 'ts-frais',
        name: 'Produits frais',
        items: [{ label: 'Lait' }, { label: 'Œufs' }, { label: 'Fromage' }]
      },
      {
        id: 'ts-simili',
        name: 'Simili',
        items: [{ label: 'Steaks de soja' }, { label: 'Crème végétale' }]
      }
    ]
  },
  {
    id: 't-menage',
    name: 'Ménage par pièces',
    emoji: '🧹',
    kind: 'template',
    isTemplate: true,
    description: 'Roulement de ménage pièce par pièce.',
    sections: [
      {
        id: 'ts-menage-cuisine',
        name: 'Cuisine',
        items: [{ label: 'Plans de travail' }, { label: 'Plaque' }, { label: 'Évier' }, { label: 'Sol' }]
      },
      {
        id: 'ts-menage-sdb',
        name: 'Salle de bain',
        items: [{ label: 'Lavabo' }, { label: 'Douchette' }, { label: 'Toilettes' }, { label: 'Miroir' }]
      },
      {
        id: 'ts-menage-salon',
        name: 'Salon',
        items: [{ label: 'Aspirateur' }, { label: 'Poussière' }, { label: 'Ranger les câbles' }]
      },
      {
        id: 'ts-menage-chambres',
        name: 'Chambres',
        items: [{ label: 'Changer les draps' }, { label: 'Aérer' }]
      }
    ]
  }
]

export const itemFrequencySeed = {
  'pâtes': 4,
  'lait': 3,
  'café': 2,
  'œufs': 2,
  'riz': 1,
  'beurre': 1,
  'yaourts': 1,
  'poussière étagères': 1
}

export const initialLists = () => [
  JSON.parse(JSON.stringify(groceryList)),
  JSON.parse(JSON.stringify(tripList)),
  JSON.parse(JSON.stringify(taxesList)),
  JSON.parse(JSON.stringify(cleaningList)),
  JSON.parse(JSON.stringify(gardenList)),
  JSON.parse(JSON.stringify(birthdayList)),
  JSON.parse(JSON.stringify(giftIdeasList))
]

export const initialRecipes = () => JSON.parse(JSON.stringify(recipes))
export const initialMealPlans = () => JSON.parse(JSON.stringify(mealPlans))

export const recipes = [
  {
    id: 'r-carbonara',
    name: 'Pâtes carbonara',
    emoji: '🍝',
    description: 'La vraie, sans crème : œufs, pecorino et guanciale.',
    servings: 2,
    prepMinutes: 10,
    cookMinutes: 15,
    source: null,
    sections: [
      {
        id: 'rs-carbo-epicerie',
        name: 'Épicerie',
        items: [
          { id: 'ri-1', label: 'Spaghetti', quantity: '200 g' },
          { id: 'ri-2', label: 'Pecorino', quantity: '50 g' }
        ]
      },
      {
        id: 'rs-carbo-frais',
        name: 'Produits frais',
        items: [
          { id: 'ri-3', label: 'Œufs', quantity: '2' },
          { id: 'ri-4', label: 'Guanciale', quantity: '100 g' }
        ]
      }
    ],
    steps: [
      { id: 'rst-1', text: 'Cuire les spaghetti al dente dans une grande casserole d\u2019eau salée.' },
      { id: 'rst-2', text: 'Faire revenir le guanciale en lardons jusqu\u2019à ce qu\u2019il soit doré.' },
      { id: 'rst-3', text: 'Battre les œufs avec le pecorino râpé, poivrer généreusement.' },
      { id: 'rst-4', text: 'Hors du feu, mélanger pâtes, guanciale puis crème d\u2019œufs — le plat ne doit plus bouillir.' }
    ]
  },
  {
    id: 'r-courgettes',
    name: 'Courgettes farcies végétariennes',
    emoji: '🥘',
    description: 'Courgettes creusées garnies de riz, fromage et herbes, au four.',
    servings: 4,
    prepMinutes: 25,
    cookMinutes: 40,
    source: 'Cuisine AZ',
    sections: [
      {
        id: 'rs-courgette-frais',
        name: 'Produits frais',
        items: [
          { id: 'ri-5', label: 'Courgettes', quantity: '4' },
          { id: 'ri-6', label: 'Tomates', quantity: '2' }
        ]
      },
      {
        id: 'rs-courgette-epicerie',
        name: 'Épicerie',
        items: [
          { id: 'ri-7', label: 'Riz', quantity: '150 g' },
          { id: 'ri-8', label: 'Herbes de Provence', quantity: null }
        ]
      }
    ],
    steps: [
      { id: 'rst-5', text: 'Préchauffer le four à 180°C.' },
      { id: 'rst-6', text: 'Couper les courgettes en deux et les évider, réserver la chair.' },
      { id: 'rst-7', text: 'Mélanger la chair, le riz cuit, les tomates en dés et les herbes.' },
      { id: 'rst-8', text: 'Farcir les courgettes, parsemer de fromage et enfourner 40 minutes.' }
    ]
  },
  {
    id: 'r-curry',
    name: 'Curry de pois chiches express',
    emoji: '🍲',
    description: 'Curry coco rapide, parfait pour un soir de semaine.',
    servings: 3,
    prepMinutes: 10,
    cookMinutes: 20,
    source: null,
    sections: [
      {
        id: 'rs-curry-epicerie',
        name: 'Épicerie',
        items: [
          { id: 'ri-9', label: 'Pois chiches (boîte)', quantity: '2' },
          { id: 'ri-10', label: 'Lait de coco', quantity: '400 ml' },
          { id: 'ri-11', label: 'Pâte de curry', quantity: '2 c. à s.' }
        ]
      },
      {
        id: 'rs-curry-frais',
        name: 'Produits frais',
        items: [
          { id: 'ri-12', label: 'Oignons', quantity: '1' },
          { id: 'ri-13', label: 'Épinards', quantity: '200 g' }
        ]
      }
    ],
    steps: [
      { id: 'rst-9', text: 'Faire suer l\u2019oignon émincé dans un filet d\u2019huile.' },
      { id: 'rst-10', text: 'Ajouter la pâte de curry et faire revenir une minute.' },
      { id: 'rst-11', text: 'Verser le lait de coco et les pois chiches, laisser mijoter 15 minutes.' },
      { id: 'rst-12', text: 'Incorporer les épinards en fin de cuisson, servir avec du riz.' }
    ]
  },
  {
    id: 'r-crumble',
    name: 'Crumble aux pommes',
    emoji: '🍰',
    description: 'Dessert réconfortant : pommes, farine, beurre, sucre roux.',
    servings: 6,
    prepMinutes: 15,
    cookMinutes: 35,
    source: 'Marmiton',
    sections: [
      {
        id: 'rs-crumble-epicerie',
        name: 'Épicerie',
        items: [
          { id: 'ri-14', label: 'Farine', quantity: '120 g' },
          { id: 'ri-15', label: 'Sucre roux', quantity: '80 g' }
        ]
      },
      {
        id: 'rs-crumble-frais',
        name: 'Produits frais',
        items: [
          { id: 'ri-16', label: 'Pommes', quantity: '6' },
          { id: 'ri-17', label: 'Beurre', quantity: '80 g' }
        ]
      }
    ],
    steps: [
      { id: 'rst-13', text: 'Préchauffer le four à 180°C.' },
      { id: 'rst-14', text: 'Peler et couper les pommes en lamelles, les disposer dans un plat beurré.' },
      { id: 'rst-15', text: 'Sabler du bout des doigts farine, beurre froid et sucre roux.' },
      { id: 'rst-16', text: 'Répartir la pâte sur les pommes et enfourner 35 minutes.' }
    ]
  }
]

export const mealPlans = [
  { id: 'mp-carbo', date: inDays(0), meal: 'dinner', servings: 2, recipeId: 'r-carbonara', recipeName: 'Pâtes carbonara', recipeEmoji: '🍝' },
  { id: 'mp-courgettes', date: inDays(2), meal: 'lunch', servings: 4, recipeId: 'r-courgettes', recipeName: 'Courgettes farcies végétariennes', recipeEmoji: '🥘' },
  { id: 'mp-curry', date: inDays(3), meal: 'dinner', servings: 3, recipeId: 'r-curry', recipeName: 'Curry de pois chiches express', recipeEmoji: '🍲' },
  { id: 'mp-crumble', date: inDays(5), meal: 'dinner', servings: 6, recipeId: 'r-crumble', recipeName: 'Crumble aux pommes', recipeEmoji: '🍰' }
]

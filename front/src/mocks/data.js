let seq = 0
export const uid = () => `m-${Date.now().toString(36)}-${(seq++).toString(36)}`

export const groceryList = {
  id: 'l-courses',
  name: 'Liste de courses',
  emoji: '🛒',
  kind: 'simple',
  isTemplate: false,
  sections: [
    {
      id: 's-epicerie',
      name: 'Épicerie',
      items: [
        { id: 'i-1', label: 'Pâtes', checked: false },
        { id: 'i-2', label: 'Riz', checked: false },
        { id: 'i-3', label: 'Café', checked: false },
        { id: 'i-4', label: 'Huile d\u2019olive', checked: false }
      ]
    },
    {
      id: 's-frais',
      name: 'Produits frais',
      items: [
        { id: 'i-5', label: 'Lait', checked: false },
        { id: 'i-6', label: 'Œufs', checked: false },
        { id: 'i-7', label: 'Beurre', checked: false },
        { id: 'i-8', label: 'Yaourts', checked: false }
      ]
    },
    {
      id: 's-simili',
      name: 'Simili',
      items: [
        { id: 'i-9', label: 'Steaks de soja', checked: false },
        { id: 'i-10', label: 'Crème végétale', checked: false }
      ]
    }
  ]
}

export const tripList = {
  id: 'l-voyage',
  name: 'Voyage — semaine',
  emoji: '🧳',
  kind: 'simple',
  isTemplate: false,
  sections: [
    {
      id: 's-vetements',
      name: 'Vêtements',
      items: [
        { id: 'i-11', label: 'T-shirts', checked: false },
        { id: 'i-12', label: 'Pantalon', checked: false },
        { id: 'i-13', label: 'Pull', checked: false },
        { id: 'i-14', label: 'Chaussettes', checked: false }
      ]
    },
    {
      id: 's-hygiene',
      name: 'Hygiène',
      items: [
        { id: 'i-15', label: 'Brosse à dents', checked: false },
        { id: 'i-16', label: 'Chargeur', checked: false },
        { id: 'i-17', label: 'Adaptateur prise', checked: false }
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
  }
]

export const initialLists = () => [
  JSON.parse(JSON.stringify(groceryList)),
  JSON.parse(JSON.stringify(tripList))
]

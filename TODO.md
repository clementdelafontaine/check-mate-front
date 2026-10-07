# To-do

## Features à implémenter

### Recettes — multiplicateur de portions
- Pouvoir incrémenter le nombre de personnes directement sous le nom de la recette, avec boutons −/+.
- Les quantités des ingrédients se multiplient proportionnellement (ex : recette 4 pers. → 6 pers. : 200 g de farine devient 300 g).
- Réflexions préalables : quantités fractionnées (arrondi ?), persistance du multiplicateur (par utilisateur ?), interaction avec l'envoi vers la liste de courses (c'est la quantité multipliée qui doit être envoyée).

### Sécurisation de la base de données
- Mettre en place un système de sécurisation de la BDD : sauvegardes automatiques régulières (pg_dump programmé, rétention), et restauration testée.
- Points à couvrir : chiffrement au repos si pertinent, gestion fine des droits SQL (rôle applicatif limité, pas de superuser), durcissement `pg_hba.conf`, secret du `DATABASE_URL` hors image/compose (fichier env non versionné), et monitoring/backup du volume CasaOS.

### Rubrique Dépenses (clone Splitwise)
- Nouvelle rubrique avec un logo dans le menu footer.
- L'utilisateur crée des "groupes de dépenses" (ex : vacances entre amis, colocation) avec ses amis — même mécanique de partage que les listes (users/amis, propriétaire, partagés).
- Saisie de dépenses dans un groupe : montant, libellé, payeur, participants concernés (parts égales ou personnalisées).
- Calcul automatique des soldes (qui doit quoi à qui), simplification des dettes, et ideally un historique des remboursements.
- Impact backend : nouvelles tables (groups, expenses, expense_participants, settlements), routes API, et probablement un store Pinia dédié côté front.

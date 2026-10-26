# To-do

## Features à implémenter

### Listes — épinglage sur l'accueil
- Pouvoir épingler une liste pour la faire apparaître en écran d'accueil (ex : via le menu « … » de la carte liste, ou un bouton punaise).
- L'accueil affiche une section dédiée « Listes épinglées » avec les cartes des listes épinglées (emoji, nom, progression, raccourci vers la liste).
- Réflexions préalables : persistance du pin (colonne `pinned`/`position` sur lists, par utilisateur), ordre des épinglées (glisser-déposer ?), nombre max d'épinglées affichées, et comportement des listes épinglées terminées (masquées ? conservées ?).

### Export / import de listes
- Permettre à l'utilisateur d'exporter une liste (format JSON et/ou CSV) et d'en importer une.
- Points à couvrir : gestion des doublons/réconciliation lors de l'import (fusion ou remplacement ?), import d'une liste partagée (droits), et téléversement côté front (input file + parsing).

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

### Module Alertes météo par mail (OpenWeatherMap + Brevo)
- Nouveau module d'alertes météo envoyées automatiquement par mail : données OpenWeatherMap, envoi via SMTP Brevo (nodemailer).
- L'utilisateur configure une ou plusieurs alertes (position/géoloc, type d'alerte : pluie, gel, vent, températures, seuils), et un cron côté API (node-cron) interroge OpenWeatherMap et envoie le mail si conditions réunies.
- Impact backend : table `weather_alerts` (position, type, seuil, fréquence), service `mailer.js` (config SMTP Brevo par env vars : SMTP_HOST/USER/PASSWORD, MAIL_FROM), scheduler dans `server.js`.
- Réflexions préalables : fréquence de polling (quota gratuit OWM : 1 000 appels/jour), lien avec le calendrier/listes (ex : « pluie prévue demain matin, pensez à décaler l'arrosage »), et opt-in par utilisateur.

### Module Organisation domestique
- Nouveau module d'organisation domestique : tâches récurrentes de la maison (ménage, entretien, linge, courses), répartition entre membres (amis/partage), et rappels automatiques par mail.
- Fonctionnalités envisagées : tâches récurrentes (fréquence : quotidien/hebdo/mensuel/personnalisé), attribution à un membre, échéance et statut (à faire/en retard/fait), historique, et digest récurrent (ex : mail du dimanche avec les tâches de la semaine).
- Impact backend : tables `household_tasks` (label, fréquence, assigné, dernière exécution), routes API, store Pinia dédié, et réutilisation du service `mailer.js` partagé avec le module météo.
- Réflexions préalables : lien avec les listes existantes (tâche dédiée ou intégration ?), notion de « foyer » vs amis (mêmes mécaniques de partage ?), et interaction avec les rappels automatiques.
